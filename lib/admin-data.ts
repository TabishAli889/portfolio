import 'server-only'
import { connectToDatabase } from './mongodb'
import { requireAdmin } from './auth-guard'
import { toPlain, toPlainList } from './serialize'
import { getResource, type ResourceKey } from './resources'
import { RESOURCE_MODELS } from './resources.server'
import { SINGLETON_KEY } from '@/models/common'
import { Message } from '@/models'
import type { AdminMessage } from './content-types'

/**
 * Reads for the admin dashboard.
 *
 * Deliberately *not* cached: the admin must always see the current state,
 * including drafts, immediately after a save. Each function re-checks the
 * session for the same reason the actions do.
 */

export type AdminRow = Record<string, unknown> & { id: string }

export async function listResource(resource: ResourceKey): Promise<AdminRow[]> {
  await requireAdmin()
  const config = getResource(resource)
  if (!config || config.singleton) return []

  await connectToDatabase()
  const docs = await RESOURCE_MODELS[resource].model
    .find()
    .sort({ order: 1, createdAt: 1 })
    .lean()

  return toPlainList<AdminRow>(docs)
}

export async function getResourceItem(
  resource: ResourceKey,
  id: string,
): Promise<AdminRow | null> {
  await requireAdmin()
  const config = getResource(resource)
  if (!config || config.singleton) return null
  if (!/^[a-f\d]{24}$/i.test(id)) return null

  await connectToDatabase()
  const doc = await RESOURCE_MODELS[resource].model.findById(id).lean()
  return doc ? toPlain<AdminRow>(doc) : null
}

/** The one document for a singleton resource, or null before it is first saved. */
export async function getSingleton(resource: ResourceKey): Promise<AdminRow | null> {
  await requireAdmin()
  const config = getResource(resource)
  if (!config || !config.singleton) return null

  await connectToDatabase()
  const doc = await RESOURCE_MODELS[resource].model.findOne({ key: SINGLETON_KEY }).lean()
  return doc ? toPlain<AdminRow>(doc) : null
}

/** Options for a `ref` field, e.g. the skill-category dropdown. */
export async function listRefOptions(
  resource: ResourceKey,
): Promise<{ value: string; label: string }[]> {
  await requireAdmin()
  const config = getResource(resource)
  if (!config || config.singleton) return []

  await connectToDatabase()
  const docs = await RESOURCE_MODELS[resource].model
    .find()
    .sort({ order: 1 })
    .select(`${config.titleField ?? 'name'} order`)
    .lean<Record<string, unknown>[]>()

  const titleField = config.titleField ?? 'name'
  return toPlainList<AdminRow>(docs).map((doc) => ({
    value: doc.id,
    label: String(doc[titleField] ?? doc.id),
  }))
}

// --- Inbox ---------------------------------------------------------------

export async function listMessages(): Promise<AdminMessage[]> {
  await requireAdmin()
  await connectToDatabase()
  const docs = await Message.find().sort({ createdAt: -1 }).limit(500).lean()
  return toPlainList<AdminMessage>(docs)
}

export async function countUnreadMessages(): Promise<number> {
  await requireAdmin()
  await connectToDatabase()
  return Message.countDocuments({ read: false })
}

/** Row counts for the dashboard overview cards. */
export async function getDashboardStats(): Promise<{
  counts: { resource: ResourceKey; label: string; total: number; drafts: number }[]
  unread: number
}> {
  await requireAdmin()
  await connectToDatabase()

  const collectionResources = (Object.keys(RESOURCE_MODELS) as ResourceKey[]).filter(
    (key) => !getResource(key)?.singleton,
  )

  const counts = await Promise.all(
    collectionResources.map(async (resource) => {
      const { model } = RESOURCE_MODELS[resource]
      const [total, drafts] = await Promise.all([
        model.countDocuments(),
        model.countDocuments({ published: false }),
      ])
      return {
        resource,
        label: getResource(resource)?.plural ?? resource,
        total,
        drafts,
      }
    }),
  )

  const unread = await Message.countDocuments({ read: false })
  return { counts, unread }
}

/**
 * Loads the option lists for every `ref` field a resource declares, keyed by
 * the referenced resource - e.g. { 'skill-categories': [...] } for the skill
 * form's category dropdown.
 */
export async function refOptionsFor(
  key: ResourceKey,
): Promise<Record<string, { value: string; label: string }[]>> {
  const config = getResource(key)
  if (!config) return {}

  const refResources = [
    ...new Set(
      config.fields
        .filter((field) => field.type === 'ref' && field.refResource)
        .map((field) => field.refResource as ResourceKey),
    ),
  ]

  const entries = await Promise.all(
    refResources.map(async (refKey) => [refKey, await listRefOptions(refKey)] as const),
  )

  return Object.fromEntries(entries)
}
