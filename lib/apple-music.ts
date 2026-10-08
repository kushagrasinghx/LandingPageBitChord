import { unstable_cache } from 'next/cache'
import type { MediaItem } from '@/lib/media'

/**
 * Shelves from Apple Music's "New" page (music.apple.com/us/new).
 *
 * There is no public, key-free API for this page. Apple's web player fills it
 * from its private API using a token issued to the player itself, which we do
 * not reuse. Instead we read the JSON Apple embeds in the page's own HTML
 * (`<script id="serialized-server-data">`) — the same public document any
 * browser receives. That format is undocumented and may change; every step
 * below degrades to empty shelves (rows are then left out) rather than
 * throwing. The supported alternative is the Apple Music API with a MusicKit
 * developer token from a paid Apple Developer account.
 *
 * The HTML is ~2.4 MB, over Next's 2 MB fetch-cache limit, so the fetch itself
 * is uncached and only the few KB we extract are cached, via `unstable_cache`.
 */

const PAGE_URL = 'https://music.apple.com/us/new'

/** Seconds before the extracted shelves are considered stale and refetched. */
const REVALIDATE_SECONDS = 3600

export type NewPageShelves = {
  newThisWeek: MediaItem[]
  recentReleases: MediaItem[]
  bestNewSongs: MediaItem[]
}

const EMPTY: NewPageShelves = { newThisWeek: [], recentReleases: [], bestNewSongs: [] }

/** The slice of Apple's page JSON we read. Everything is optional: it is not ours. */
type RawItem = {
  id?: string
  title?: string
  titleLinks?: { title?: string }[]
  subtitleLinks?: { title?: string }[]
  artwork?: { dictionary?: { url?: string } }
  showExplicitBadge?: boolean
}

type RawSection = {
  header?: { item?: { title?: string; titleLink?: { title?: string } } }
  items?: RawItem[]
}

function toItem(raw: RawItem): MediaItem | null {
  const title = raw.title ?? raw.titleLinks?.[0]?.title
  const artwork = raw.artwork?.dictionary?.url
  if (!raw.id || !title || !artwork) return null
  return {
    id: raw.id,
    title,
    // Featured artists arrive as separate links; Apple shows them comma-joined.
    subtitle: (raw.subtitleLinks ?? [])
      .map((l) => l.title)
      .filter(Boolean)
      .join(', '),
    artwork,
    explicit: Boolean(raw.showExplicitBadge),
  }
}

function shelf(sections: RawSection[], title: string): MediaItem[] {
  const section = sections.find(
    (s) => (s.header?.item?.title ?? s.header?.item?.titleLink?.title) === title,
  )
  return (section?.items ?? []).map(toItem).filter((i): i is MediaItem => i !== null)
}

async function fetchShelves(): Promise<NewPageShelves> {
  const res = await fetch(PAGE_URL, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Apple Music page returned ${res.status}`)

  const html = await res.text()
  const json = html.match(
    /<script type="application\/json" id="serialized-server-data">([\s\S]*?)<\/script>/,
  )?.[1]
  if (!json) throw new Error('Apple Music page has no serialized data')

  const parsed = JSON.parse(json) as { data?: { data?: { sections?: RawSection[] } }[] }
  const sections = parsed.data?.[0]?.data?.sections ?? []

  const shelves = {
    newThisWeek: shelf(sections, 'New This Week'),
    recentReleases: shelf(sections, 'Recent Releases'),
    bestNewSongs: shelf(sections, 'Best New Songs'),
  }
  if (Object.values(shelves).every((items) => items.length === 0)) {
    throw new Error('Apple Music page format changed: no shelves found')
  }
  return shelves
}

/**
 * Failures throw inside the cached function so `unstable_cache` stores
 * nothing, and the next render retries instead of serving empty shelves for
 * an hour. They are caught here, so the page itself never errors.
 */
const cachedShelves = unstable_cache(fetchShelves, ['apple-music-new-page'], {
  revalidate: REVALIDATE_SECONDS,
})

export async function getNewPageShelves(): Promise<NewPageShelves> {
  try {
    return await cachedShelves()
  } catch (error) {
    // Logged so a format change on Apple's side shows up in server logs
    // instead of the rows silently disappearing.
    console.warn('[apple-music] could not read the New page:', error)
    return EMPTY
  }
}
