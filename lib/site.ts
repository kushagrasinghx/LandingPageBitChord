/**
 * Canonical origin for the deployed site.
 *
 * Everything SEO-facing — `metadataBase`, the canonical link, `robots.txt`,
 * the sitemap and the JSON-LD — resolves against this, so absolute URLs are
 * derived in one place rather than hand-written per file.
 *
 * Set `NEXT_PUBLIC_SITE_URL` in the deployment environment. `VERCEL_PROJECT_
 * PRODUCTION_URL` is the automatic fallback on Vercel, which keeps preview
 * deployments pointing at the production origin instead of advertising their
 * own throwaway hostname as canonical.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://bitchord.app')
).replace(/\/$/, '')

export const SITE_NAME = 'BitChord'

/** Minimum Android release the APK installs on, quoted in the app schema. */
export const MIN_ANDROID = '8.0'
