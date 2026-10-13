'use server'

import { updateTag } from 'next/cache'
import { z } from 'zod'
import { connectToDatabase } from './mongodb'
import { requireAdmin, UnauthorizedError } from './auth-guard'
import { actionError, actionOk, type ActionResult } from './action-result'
import { getResource, isResourceKey, type ResourceKey } from './resources'
import { RESOURCE_MODELS, tagsFor } from './resources.server'
import { SINGLETON_KEY } from '@/models/common'
import { Message } from '@/models'

/**
 * Every admin mutation goes through one of the five actions in this file.
 *
 * Each one:
 *  1. re-checks the admin session (proxy protection is not sufficient on its
 *     own - see proxy.ts),
 *  2. validates the resource key against the registry, so the `resource`
 *     argument can never address an arbitrary collection,
 *  3. validates the payload with the same Zod schema the form used,
 *  4. purges the affected cache tags with `updateTag` so the next public read
 *     is fresh ("read your own writes" - the Next 16 replacement for calling
 *     revalidateTag with no profile).
 */

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id')

/** Wraps an action body with auth + uniform error reporting. */
async function guarded<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    await requireAdmin()
    return await fn()
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return actionError('Your session has expired. Please sign in again.')
    }

    // Duplicate key, e.g. two projects with the same slug.
    const mongoError = error as { code?: number; keyPattern?: Record<string, unknown> }
    if (mongoError?.code === 11000) {
      const field = Object.keys(mongoError.keyPattern ?? {})[0] ?? 'value'
      return actionError(`That ${field} is already taken.`, {
        [field]: [`This ${field} is already used by another item.`],
      })
    }

    console.error('[admin action]', error)
    return actionError(
      error instanceof Error && error.message.startsWith('Missing required environment')
        ? error.message
        : 'Something went wrong while saving. Please try again.',
    )
  }
}

function resolveResource(resource: string) {
  if (!isResourceKey(resource)) throw new Error(`Unknown resource: ${resource}`)
  const config = getResource(resource)
  if (!config) throw new Error(`Unknown resource: ${resource}`)
  return { config, binding: RESOURCE_MODELS[resource] }
}

function purge(resource: ResourceKey) {
  for (const tag of tagsFor(resource)) {
    updateTag(tag)
  }
}

/**
 * Creates (id === null) or updates a document. Singletons ignore `id` and
 * upsert the one document addressed by the singleton key.
 */
export async function saveResource(
  resource: string,
  id: string | null,
  payload: unknown,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const { config, binding } = resolveResource(resource)

    const parsed = config.schema.safeParse(payload)
    if (!parsed.success) {
      const { fieldErrors } = z.flattenError(parsed.error)
      return actionError('Please fix the highlighted fields.', fieldErrors)
    }

    await connectToDatabase()
    const data = parsed.data as Record<string, unknown>

    if (config.singleton) {
      const doc = await binding.model.findOneAndUpdate(
        { key: SINGLETON_KEY },
        { $set: data },
        {
          upsert: true,
          returnDocument: 'after',
          setDefaultsOnInsert: true,
          runValidators: true,
        },
      )
      purge(resource as ResourceKey)
      return actionOk({ id: String(doc._id) }, `${config.singular} saved.`)
    }

    if (id) {
      const parsedId = objectId.safeParse(id)
      if (!parsedId.success) return actionError('Invalid id.')

      const doc = await binding.model.findByIdAndUpdate(
        parsedId.data,
        { $set: data },
        { returnDocument: 'after', runValidators: true },
      )
      if (!doc) return actionError(`That ${config.singular.toLowerCase()} no longer exists.`)

      purge(resource as ResourceKey)
      return actionOk({ id: String(doc._id) }, `${config.singular} updated.`)
    }

    // New documents go to the end of the list. `order` is never part of the
    // submitted payload (see lib/schemas.ts), so an update leaves the existing
    // position untouched and only a create assigns one.
    if (data.order === undefined) {
      const last = await binding.model.findOne().sort({ order: -1 }).select('order').lean<{
        order?: number
      }>()
      data.order = (last?.order ?? 0) + 1
    }

    const created = await binding.model.create(data)
    purge(resource as ResourceKey)
    return actionOk({ id: String(created._id) }, `${config.singular} created.`)
  })
}

export async function deleteResource(resource: string, id: string): Promise<ActionResult> {
  return guarded(async () => {
    const { config, binding } = resolveResource(resource)
    if (config.singleton) return actionError('Site content cannot be deleted, only edited.')

    const parsedId = objectId.safeParse(id)
    if (!parsedId.success) return actionError('Invalid id.')

    await connectToDatabase()

    // A skill category with skills attached would orphan them, so clear the
    // children first rather than leaving unreachable rows behind.
    if (resource === 'skill-categories') {
      const { Skill } = await import('@/models')
      const attached = await Skill.countDocuments({ category: parsedId.data })
      if (attached > 0) {
        return actionError(
          `This category still has ${attached} skill${attached === 1 ? '' : 's'}. Move or delete them first.`,
        )
      }
    }

    const result = await binding.model.findByIdAndDelete(parsedId.data)
    if (!result) return actionError('That item no longer exists.')

    purge(resource as ResourceKey)
    return actionOk(undefined, `${config.singular} deleted.`)
  })
}

/** Persists the new drag-and-drop order as 0..n-1 in a single round trip. */
export async function reorderResource(resource: string, ids: string[]): Promise<ActionResult> {
  return guarded(async () => {
    const { config, binding } = resolveResource(resource)
    if (config.singleton) return actionError('This content type cannot be reordered.')

    const parsed = z.array(objectId).max(500).safeParse(ids)
    if (!parsed.success) return actionError('Invalid order payload.')

    await connectToDatabase()
    await binding.model.bulkWrite(
      parsed.data.map((id, index) => ({
        updateOne: { filter: { _id: id }, update: { $set: { order: index } } },
      })),
    )

    purge(resource as ResourceKey)
    return actionOk(undefined, 'Order saved.')
  })
}

export async function setPublished(
  resource: string,
  id: string,
  published: boolean,
): Promise<ActionResult> {
  return guarded(async () => {
    const { config, binding } = resolveResource(resource)
    if (config.singleton) return actionError('This content type has no published toggle.')

    const parsedId = objectId.safeParse(id)
    if (!parsedId.success) return actionError('Invalid id.')

    await connectToDatabase()
    const doc = await binding.model.findByIdAndUpdate(
      parsedId.data,
      { $set: { published: Boolean(published) } },
      { returnDocument: 'after' },
    )
    if (!doc) return actionError('That item no longer exists.')

    purge(resource as ResourceKey)
    return actionOk(undefined, published ? 'Published.' : 'Moved to draft.')
  })
}

// --- Inbox ---------------------------------------------------------------

export async function setMessageRead(id: string, read: boolean): Promise<ActionResult> {
  return guarded(async () => {
    const parsedId = objectId.safeParse(id)
    if (!parsedId.success) return actionError('Invalid id.')

    await connectToDatabase()
    const doc = await Message.findByIdAndUpdate(parsedId.data, { $set: { read: Boolean(read) } })
    if (!doc) return actionError('That message no longer exists.')

    return actionOk(undefined, read ? 'Marked as read.' : 'Marked as unread.')
  })
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  return guarded(async () => {
    const parsedId = objectId.safeParse(id)
    if (!parsedId.success) return actionError('Invalid id.')

    await connectToDatabase()
    const doc = await Message.findByIdAndDelete(parsedId.data)
    if (!doc) return actionError('That message no longer exists.')

    return actionOk(undefined, 'Message deleted.')
  })
}
