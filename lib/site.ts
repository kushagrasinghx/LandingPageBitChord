/**
 * Canonical origin for the deployed site.
 *
 * Everything SEO-facing — `metadataBase`, the canonical link, `robots.txt`,
 * the sitemap and the JSON-LD — resolves against this, so absolute URLs are
 * derived in one place rather than hand-written per file.
 *
 * Resolution order:
 *
 *  1. `NEXT_PUBLIC_SITE_URL` — set this in the deployment environment. It is
 *     the only way to pin the custom domain.
 *  2. `VERCEL_PROJECT_PRODUCTION_URL` — set automatically by Vercel, and
 *     always the *production* URL, so preview deployments point at production
 *     instead of advertising their own throwaway hostname as canonical.
 *  3. Localhost.
 *
 * There is deliberately no real-looking domain at the end of that chain. A
 * plausible fallback is the dangerous kind: if the environment is ever
 * misconfigured it ships a confident, wrong canonical pointing somewhere the
 * project does not control, and nothing about the page looks broken. Falling
 * back to localhost fails visibly instead.
 */
const configured = process.env.NEXT_PUBLIC_SITE_URL ?? resolveVercelUrl()

export const SITE_URL = (configured ?? 'http://localhost:3100').replace(/\/$/, '')

function resolveVercelUrl(): string | undefined {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL
  return host ? `https://${host}` : undefined
}

export const SITE_NAME = 'BitChord'

/** Minimum Android release the APK installs on, quoted in the app schema. */
export const MIN_ANDROID = '8.0'
