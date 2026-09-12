import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/**
 * Everything is public and indexable — there is no auth, no user content and
 * no duplicate routes. `/api/` is excluded because it serves JSON that would
 * only dilute the crawl budget.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: '/api/' }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
