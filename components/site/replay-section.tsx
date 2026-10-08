import { ReplayCardRow } from '@/components/site/replay-card-row'
import type { ReplayCardData } from '@/components/ui/replay-card'
import { DEMO_TRACK } from '@/lib/lyrics-demo'
import { artworkUrl, type MediaItem } from '@/lib/media'

/** Same-origin artwork, so the card can read its pixels for the mesh palette. */
function sameOrigin(item: MediaItem | undefined): string {
  if (!item) return DEMO_TRACK.artwork
  return `/_next/image?url=${encodeURIComponent(artworkUrl(item.artwork, 300))}&w=256&q=75`
}

const plays = (n: number) => `${n.toLocaleString('en-US')} Plays`

/**
 * An example Replay, dealt the way ReplayModel.cards does it: minutes first,
 * then top song, artist and album, each detail line in the app's own format.
 *
 * The song, artist and album are this week's from the rows above (so each
 * card is lit by a different record); the figures are illustrative.
 */
export function replayCards(shelves: {
  bestNewSongs: MediaItem[]
  newThisWeek: MediaItem[]
  recentReleases: MediaItem[]
}): ReplayCardData[] {
  const year = new Date().getFullYear().toString()
  const song = shelves.bestNewSongs[0]
  // Each card lit by a different record: skip covers already dealt, and an
  // artist who is already the top song's.
  const used = new Set(song ? [song.artwork] : [])
  const artist = shelves.newThisWeek.find((i) => !used.has(i.artwork) && !song?.subtitle.includes(i.subtitle))
  if (artist) used.add(artist.artwork)
  const album = shelves.recentReleases.find((i) => !used.has(i.artwork))

  return [
    {
      label: 'Minutes listened',
      value: '48,326',
      detail: `${plays(3912)} · ${year}`,
      artwork: sameOrigin(song),
    },
    {
      label: 'Top song',
      value: song?.title ?? DEMO_TRACK.title,
      detail: `${song?.subtitle ?? DEMO_TRACK.artist} · ${plays(214)}`,
      artwork: sameOrigin(song),
    },
    {
      label: 'Top artist',
      value: artist?.subtitle ?? DEMO_TRACK.artist,
      detail: `3,672 min · ${plays(1284)}`,
      artwork: sameOrigin(artist),
    },
    {
      label: 'Top album',
      value: album?.title ?? DEMO_TRACK.album,
      detail: `${album?.subtitle ?? DEMO_TRACK.artist} · 1,904 min`,
      artwork: sameOrigin(album),
    },
  ]
}

/** The Replay wallet from the app's Library page, in a panel like the hero's. */
export function ReplaySection({ cards }: { cards: ReplayCardData[] }) {
  return (
    <section aria-labelledby="replay-title" className="page-container mt-20">
      <div className="overflow-hidden rounded-3xl bg-[#0a0a0a] pb-8 pt-12 shadow-[inset_0_0_0_0.8px_rgb(255_255_255/0.1)] sm:pt-14">
        <div className="px-6 text-center">
          <h2 id="replay-title" className="text-[15px] font-medium text-white">
            Your year in music, in your pocket.
          </h2>
          <p className="mx-auto mt-1 max-w-[560px] text-balance text-[13px] leading-[18px] text-white/50">
            Replay counts every minute, song, artist and album you play, and deals it out as cards
            that are yours to keep and share.
          </p>
        </div>

        <ReplayCardRow cards={cards} />
      </div>
    </section>
  )
}
