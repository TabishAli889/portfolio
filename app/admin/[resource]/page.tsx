import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Plus } from 'lucide-react'
import { requireAdminPage } from '@/lib/auth-guard'
import { getResource, type ResourceKey } from '@/lib/resources'
import { getSingleton, listResource, refOptionsFor } from '@/lib/admin-data'
import { ResourceForm } from '@/components/admin/ResourceForm'
import { ResourceList, type ListRow } from '@/components/admin/ResourceList'

/**
 * One route serves every content type.
 *
 * Singletons (hero, about, settings) render the edit form directly, because
 * there is only ever one document. Collections render the sortable list.
 */

export async function generateMetadata({ params }: PageProps<'/admin/[resource]'>) {
  const { resource } = await params
  const config = getResource(resource)
  return { title: config?.plural ?? 'Not found' }
}

export default async function ResourceIndexPage({ params }: PageProps<'/admin/[resource]'>) {
  await requireAdminPage()

  const { resource } = await params
  const config = getResource(resource)
  if (!config) notFound()

  const key = config.key as ResourceKey

  if (config.singleton) {
    const [doc, refOptions] = await Promise.all([
      getSingleton(key),
      refOptionsFor(key),
    ])

    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <h1 className="text-2xl">{config.singular}</h1>
          <p className="mt-1.5 text-sm text-fog-400">{config.description}</p>
        </header>

        <ResourceForm
          resourceKey={key}
          id={null}
          initialValues={doc ?? {}}
          refOptions={refOptions}
        />
      </div>
    )
  }

  const docs = await listResource(key)
  const rows: ListRow[] = docs.map((doc) => ({
    id: doc.id,
    title: String(doc[config.titleField ?? 'name'] ?? 'Untitled'),
    subtitle: config.subtitleField ? String(doc[config.subtitleField] ?? '') : undefined,
    published: doc.published !== false,
    featured: doc.featured === true,
  }))

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl">{config.plural}</h1>
          <p className="mt-1.5 max-w-xl text-sm text-fog-400">{config.description}</p>
        </div>

        <Link href={`/admin/${config.slug}/new`} className="btn btn-primary !py-2 !text-xs">
          <Plus className="size-3.5" aria-hidden />
          New {config.singular.toLowerCase()}
        </Link>
      </header>

      {rows.length > 1 && (
        <p className="text-xs text-fog-500">
          Drag the handle to reorder, or focus a handle and use Space then the arrow keys. The
          order here is the order on the public site.
        </p>
      )}

      <ResourceList
        resourceKey={key}
        slug={config.slug}
        rows={rows}
        singular={config.singular}
      />
    </div>
  )
}
