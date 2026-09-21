import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'
import { getTelemetry } from '@/lib/github'

/**
 * A single-page site, so the sitemap is one entry — but a truthful one:
 * `lastModified` follows the most recent release rather than the build clock,
 * so it only moves when the page's content actually changes.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const telemetry = await getTelemetry().catch(() => null)
  const published = telemetry?.latest?.publishedAt

  return [
    {
      url: SITE_URL,
      lastModified: published ? new Date(published) : new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/docs`,
      lastModified: published ? new Date(published) : new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}
