import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { requireAdminPage } from '@/lib/auth-guard'
import { getResource, type ResourceKey } from '@/lib/resources'
import { refOptionsFor } from '@/lib/admin-data'
import { ResourceForm } from '@/components/admin/ResourceForm'

export async function generateMetadata({ params }: PageProps<'/admin/[resource]/new'>) {
  const { resource } = await params
  const config = getResource(resource)
  return { title: config ? `New ${config.singular.toLowerCase()}` : 'Not found' }
}

export default async function NewResourcePage({ params }: PageProps<'/admin/[resource]/new'>) {
  await requireAdminPage()

  const { resource } = await params
  const config = getResource(resource)
  if (!config) notFound()

  // Singletons have nothing to create; send the user to the edit screen.
  if (config.singleton) redirect(`/admin/${config.slug}`)

  const key = config.key as ResourceKey
  const refOptions = await refOptionsFor(key)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href={`/admin/${config.slug}`}
        className="inline-flex items-center gap-1.5 text-xs text-fog-500 transition-colors hover:text-fog-200"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to {config.plural.toLowerCase()}
      </Link>

      <header>
        <h1 className="text-2xl">New {config.singular.toLowerCase()}</h1>
        <p className="mt-1.5 text-sm text-fog-400">{config.description}</p>
      </header>

      <ResourceForm resourceKey={key} id={null} initialValues={{}} refOptions={refOptions} />
    </div>
  )
}
