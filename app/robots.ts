import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/env'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The admin and its APIs must never be crawled. The admin layout also
      // sets `robots: noindex` in its metadata, so this is belt and braces.
      disallow: ['/admin', '/admin/', '/api/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
