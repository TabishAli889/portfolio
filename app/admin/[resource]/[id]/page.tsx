import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { requireAdminPage } from '@/lib/auth-guard'
import { getResource, type ResourceKey } from '@/lib/resources'
import { getResourceItem, refOptionsFor } from '@/lib/admin-data'
import { ResourceForm } from '@/components/admin/ResourceForm'

export async function generateMetadata({ params }: PageProps<'/admin/[resource]/[id]'>) {
  const { resource } = await params
  const config = getResource(resource)
  return { title: config ? `Edit ${config.singular.toLowerCase()}` : 'Not found' }
}

export default async function EditResourcePage({ params }: PageProps<'/admin/[resource]/[id]'>) {
  await requireAdminPage()

  const { resource, id } = await params
  const config = getResource(resource)
  if (!config) notFound()
  if (config.singleton) redirect(`/admin/${config.slug}`)

  const key = config.key as ResourceKey
  const [doc, refOptions] = await Promise.all([getResourceItem(key, id), refOptionsFor(key)])
  if (!doc) notFound()

  const title = String(doc[config.titleField ?? 'name'] ?? config.singular)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href={`/admin/${config.slug}`}
        className="inline-flex items-center gap-1.5 text-xs text-fog-500 transition-colors hover:text-fog-200"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to {config.plural.toLowerCase()}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs tracking-wide text-fog-500 uppercase">{config.singular}</p>
          <h1 className="mt-1 truncate text-2xl">{title}</h1>
        </div>

        {/* Projects have a public detail page worth checking after an edit. */}
        {key === 'projects' && typeof doc.slug === 'string' && doc.published !== false && (
          <Link
            href={`/projects/${doc.slug}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost !py-2 !text-xs"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            View live
          </Link>
        )}
      </header>

      <ResourceForm resourceKey={key} id={id} initialValues={doc} refOptions={refOptions} />
    </div>
  )
}
