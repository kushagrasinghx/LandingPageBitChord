import { BRAND_PATHS, BRAND_STROKES, type BrandIcon } from '@/lib/brand-icons'

/**
 * Services the BitChord app actually connects to — every name here is one the
 * app's source has an integration for. Playback first, then where your
 * listening shows up, then lyrics, then where it plays.
 *
 * Marks are white and single-colour: Simple Icons where it has the brand, and
 * hand-drawn versions of the supplied logos for ListenBrainz and Musixmatch.
 */
const SERVICES: { name: string; icon?: BrandIcon }[] = [
  { name: 'YouTube Music', icon: 'youTubeMusic' },
  { name: 'Spotify', icon: 'spotify' },
  { name: 'Discord', icon: 'discord' },
  { name: 'Last.fm', icon: 'lastFm' },
  { name: 'ListenBrainz', icon: 'listenBrainz' },
  { name: 'Musixmatch', icon: 'musixmatch' },
  { name: 'Google Cast', icon: 'googleCast' },
  { name: 'Android Auto', icon: 'androidAuto' },
]

/** The services strip under the hero: no panel, just a line and the marks. */
export function Integrations() {
  return (
    <section aria-labelledby="integrations-title" className="page-container mt-20">
      <div className="text-center">
        <h2 id="integrations-title" className="text-[15px] font-medium text-white">
          Plays nicely with everything you already use.
        </h2>
        <p className="mx-auto mt-1 max-w-[560px] text-balance text-[13px] leading-[18px] text-white/50">
          Scrobbling, Discord presence, Spotify Canvas, word-synced lyrics and translation, all
          built in.
        </p>
      </div>

      <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-9 gap-y-6">
        {SERVICES.map(({ name, icon }) => (
          <li key={name} className="flex items-center gap-2 text-white/80">
            {icon ? <Mark icon={icon} /> : null}
            <span className="text-[15px] font-semibold tracking-[-0.01em]">{name}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Mark({ icon }: { icon: BrandIcon }) {
  if (icon in BRAND_STROKES) {
    const { d, width } = BRAND_STROKES[icon as keyof typeof BRAND_STROKES]
    return (
      <svg
        viewBox="0 0 24 24"
        className="size-5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d={d} />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0 fill-current" aria-hidden>
      <path d={BRAND_PATHS[icon as keyof typeof BRAND_PATHS]} />
    </svg>
  )
}
