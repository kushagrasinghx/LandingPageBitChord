/**
 * GitHub telemetry service for the BitChord repository.
 *
 * All requests run on the server (RSC render + the /api/github route handler) for
 * three reasons: the browser never sees a rate-limit-shared token, responses are
 * cached once for every visitor rather than per-visitor, and the client is spared
 * a CORS preflight against api.github.com.
 *
 * Every function here resolves — never throws. A failed fetch degrades to `null`
 * so the UI can fall back to skeleton shimmers and static copy instead of
 * blanking out on a rate limit or an offline build.
 */

export const REPO_OWNER = 'kushagrasinghx'
export const REPO_NAME = 'BitChord'
export const REPO_SLUG = `${REPO_OWNER}/${REPO_NAME}`
export const REPO_URL = `https://github.com/${REPO_SLUG}`
export const RELEASES_URL = `${REPO_URL}/releases`
export const ISSUES_URL = `${REPO_URL}/issues`
export const LATEST_RELEASE_URL = `${RELEASES_URL}/latest`

const API_ROOT = 'https://api.github.com'

/** Seconds before cached GitHub data is considered stale and refetched. */
const REVALIDATE_SECONDS = 300

export type ReleaseAsset = {
  name: string
  /** Byte size, straight from the API. */
  size: number
  downloadUrl: string
  downloadCount: number
}

export type Release = {
  tag: string
  name: string
  publishedAt: string | null
  prerelease: boolean
  /** Raw markdown body, used to derive changelog bullets. */
  body: string
  htmlUrl: string
  /** The `.apk` asset, when the release ships one. */
  apk: ReleaseAsset | null
  /** Bullet lines parsed out of the release body for the timeline. */
  highlights: string[]
}

export type RepoStats = {
  stars: number
  forks: number
  openIssues: number
  watchers: number
  license: string | null
  language: string | null
  description: string | null
  pushedAt: string | null
}

export type Telemetry = {
  /** `null` when the repo endpoint could not be reached. */
  repo: RepoStats | null
  /** Empty when the releases endpoint could not be reached. */
  releases: Release[]
  /** Total published (non-draft) releases. */
  releaseCount: number
  latest: Release | null
  /** Sum of download counts across every release asset. */
  totalDownloads: number
  /** True when at least one endpoint failed — drives degraded-state UI. */
  degraded: boolean
  /** ISO timestamp of when this payload was assembled. */
  fetchedAt: string
}

function headers(): HeadersInit {
  const base: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    // GitHub asks for a UA on unauthenticated traffic.
    'User-Agent': 'bitchord-landing',
  }
  // Optional: lifts the unauthenticated 60 req/hr ceiling to 5,000 when set.
  const token = process.env.GITHUB_TOKEN
  if (token) base.Authorization = `Bearer ${token}`
  return base
}

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_ROOT}${path}`, {
      headers: headers(),
      next: { revalidate: REVALIDATE_SECONDS },
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    // Offline build, DNS failure, rate limit with a non-JSON body — all the same
    // to the caller: no data, render the fallback.
    return null
  }
}

type RawRepo = {
  stargazers_count?: number
  forks_count?: number
  open_issues_count?: number
  subscribers_count?: number
  license?: { spdx_id?: string; name?: string } | null
  language?: string | null
  description?: string | null
  pushed_at?: string | null
}

type RawAsset = {
  name?: string
  size?: number
  browser_download_url?: string
  download_count?: number
}

type RawRelease = {
  tag_name?: string
  name?: string | null
  published_at?: string | null
  prerelease?: boolean
  draft?: boolean
  body?: string | null
  html_url?: string
  assets?: RawAsset[]
}

/**
 * Pulls the human-meaningful bullet lines out of a release body.
 *
 * Release notes here mix prose, banner images, `## Changelog` headings and
 * commit-level bullets. We keep markdown list items, drop the internal ones that
 * only name Kotlin symbols (they read as noise on a landing page), strip inline
 * markdown, and cap the result.
 */
function parseHighlights(body: string, limit = 4): string[] {
  const lines = body.split(/\r?\n/)
  const bullets: string[] = []

  for (const raw of lines) {
    const line = raw.trim()
    if (!/^[-*]\s+/.test(line)) continue

    let text = line.replace(/^[-*]\s+/, '')

    // Strip images, then turn links into their label.
    text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // Unwrap bold/italic emphasis but keep the words.
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')
    // Backticked identifiers read as noise once de-formatted; keep the name only.
    text = text.replace(/`([^`]+)`/g, '$1')
    text = text.replace(/\s+/g, ' ').trim()

    if (text.length < 12) continue
    // Skip lines that are mostly a list of code symbols rather than a change
    // a user would notice (e.g. "Add smart playback package: TrackAnalyzer, ...").
    const symbolish = /^(Add|Rewrite|Replace|Switch|Pin|Rework|Raise)\b.*(\b[A-Z][a-zA-Z]+[A-Z][a-zA-Z]*\b|\.kt\b|\.onnx\b)/
    if (symbolish.test(text)) continue

    bullets.push(text)
    if (bullets.length >= limit) break
  }

  if (bullets.length > 0) return bullets

  // No usable bullets: fall back to the first substantive prose sentence so the
  // timeline entry is never empty.
  const prose = lines
    .map((l) => l.trim())
    .find((l) => l.length > 40 && !l.startsWith('!') && !l.startsWith('#') && !l.startsWith('>'))

  if (!prose) return []
  const cleaned = prose
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
  return [cleaned.length > 220 ? `${cleaned.slice(0, 217)}...` : cleaned]
}

function normalizeRelease(raw: RawRelease): Release {
  const assets = raw.assets ?? []
  const apkRaw = assets.find((a) => a.name?.toLowerCase().endsWith('.apk'))
  const body = raw.body ?? ''
  const tag = raw.tag_name ?? 'unknown'

  return {
    tag,
    name: raw.name || tag,
    publishedAt: raw.published_at ?? null,
    prerelease: Boolean(raw.prerelease),
    body,
    htmlUrl: raw.html_url ?? `${RELEASES_URL}/tag/${tag}`,
    apk: apkRaw?.browser_download_url
      ? {
          name: apkRaw.name ?? 'BitChord.apk',
          size: apkRaw.size ?? 0,
          downloadUrl: apkRaw.browser_download_url,
          downloadCount: apkRaw.download_count ?? 0,
        }
      : null,
    highlights: parseHighlights(body),
  }
}

/**
 * Fetches repo stats and the full release list in parallel and folds them into a
 * single payload. Partial failure is expected and tolerated: if only one of the
 * two endpoints answers, the payload is marked `degraded` and the other half
 * stays empty.
 */
export async function getTelemetry(): Promise<Telemetry> {
  const [repoRaw, releasesRaw] = await Promise.all([
    getJson<RawRepo>(`/repos/${REPO_SLUG}`),
    getJson<RawRelease[]>(`/repos/${REPO_SLUG}/releases?per_page=100`),
  ])

  const repo: RepoStats | null = repoRaw
    ? {
        stars: repoRaw.stargazers_count ?? 0,
        forks: repoRaw.forks_count ?? 0,
        openIssues: repoRaw.open_issues_count ?? 0,
        watchers: repoRaw.subscribers_count ?? 0,
        license: repoRaw.license?.spdx_id ?? null,
        language: repoRaw.language ?? null,
        description: repoRaw.description ?? null,
        pushedAt: repoRaw.pushed_at ?? null,
      }
    : null

  const releases = Array.isArray(releasesRaw)
    ? releasesRaw.filter((r) => !r.draft).map(normalizeRelease)
    : []

  // The API returns releases newest-first, but sort defensively rather than
  // relying on it — the hero's "latest" tag is the page's most load-bearing fact.
  releases.sort((a, b) => {
    const at = a.publishedAt ? Date.parse(a.publishedAt) : 0
    const bt = b.publishedAt ? Date.parse(b.publishedAt) : 0
    return bt - at
  })

  const totalDownloads = releases.reduce((sum, r) => sum + (r.apk?.downloadCount ?? 0), 0)

  return {
    repo,
    releases,
    releaseCount: releases.length,
    latest: releases[0] ?? null,
    totalDownloads,
    degraded: repo === null || releases.length === 0,
    fetchedAt: new Date().toISOString(),
  }
}

/* ---------------------------------- format --------------------------------- */

export function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return '—'
  const mb = bytes / 1024 / 1024
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`
  if (mb >= 100) return `${Math.round(mb)} MB`
  return `${mb.toFixed(1)} MB`
}

export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${(n / 1000).toFixed(0)}k`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** "3 days ago" style relative label, for release recency. */
export function formatRelative(iso: string | null): string {
  if (!iso) return ''
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return ''
  const days = Math.floor((Date.now() - then) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`
  const years = Math.floor(months / 12)
  return `${years} ${years === 1 ? 'year' : 'years'} ago`
}

/**
 * Best available download target for a release: the direct `.apk` asset when the
 * release publishes one, otherwise its GitHub release page.
 *
 * Returned alongside `isDirect` so CTAs can label the action honestly instead of
 * promising a file download that turns out to be a page navigation.
 */
export function resolveDownload(release: Release | null): {
  url: string
  isDirect: boolean
  size: string
  fileName: string | null
} {
  if (release?.apk) {
    return {
      url: release.apk.downloadUrl,
      isDirect: true,
      size: formatBytes(release.apk.size),
      fileName: release.apk.name,
    }
  }
  return {
    url: release?.htmlUrl ?? LATEST_RELEASE_URL,
    isDirect: false,
    size: '—',
    fileName: null,
  }
}
