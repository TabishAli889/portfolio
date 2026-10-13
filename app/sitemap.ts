import type { MetadataRoute } from 'next'
import { getProjectSlugs } from '@/lib/data'
import { siteUrl } from '@/lib/env'

/**
 * Built from the same cached, tagged reader the project pages use, so
 * publishing a project in the admin adds it to the sitemap without a deploy.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getProjectSlugs()

  return [
    {
      url: siteUrl,
      changeFrequency: 'monthly',
      priority: 1,
    },
    ...slugs.map((slug) => ({
      url: `${siteUrl}/projects/${slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}
