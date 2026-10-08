'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { REPO_URL } from '@/lib/github'
import { ArrowButton } from '@/components/ui/arrow-button'
import { ExplicitBadge } from '@/components/ui/explicit-badge'
import { artworkUrl, type MediaItem } from '@/lib/media'
import { cn } from '@/lib/utils'

/**
 * The row runs the full width of the page, but its first tile lines up with
 * the 1200px page column (see `page-container`). Percentages in padding resolve
 * against the section's width, so this avoids `100vw`, which counts the
 * scrollbar and would knock the alignment off on Windows.
 */
const GUTTER = 'max(1.5rem, calc((100% - 1200px) / 2 + 1.5rem))'

/** Where the page column ends; tiles beyond it fade out to the viewport edge. */
const COLUMN_EDGE = 'max(0px, calc((100% - 1200px) / 2))'
const EDGE_FADE = `linear-gradient(to right, transparent, #000 ${COLUMN_EDGE}, #000 calc(100% - ${COLUMN_EDGE}), transparent)`

/** Songs stacked per column in the `tracks` variant, as on Apple Music. */
const TRACKS_PER_COLUMN = 4

/**
 * A horizontally scrollable shelf from Apple Music's "New" page, with a
 * heading above it. Two layouts, matching Apple's:
 *
 * - `tiles`: large square covers with title and artist underneath.
 * - `tracks`: columns of four compact song rows — 40px cover, title, artist,
 *   hairline divider — as in Apple's "Best New Songs".
 *
 * Every tile links to the BitChord repository — the music is a showcase of
 * what you can listen to, and the repo is where you go to get the app.
 *
 * Touch and trackpad users scroll natively; the arrow buttons exist for mouse
 * users, who otherwise have no obvious way to move a row sideways.
 */
export function MediaRow({
  title,
  items,
  variant = 'tiles',
  eager = false,
}: {
  title: string
  items: MediaItem[]
  variant?: 'tiles' | 'tracks'
  /** Load the first few covers eagerly — only for the row above the fold. */
  eager?: boolean
}) {
  const trackRef = useRef<HTMLUListElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const updateEdges = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    updateEdges()
    window.addEventListener('resize', updateEdges)
    return () => window.removeEventListener('resize', updateEdges)
  }, [updateEdges])

  const scrollByPage = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    // Page by the visible column, not the full-bleed track.
    el.scrollBy({ left: dir * Math.min(el.clientWidth, 1200) * 0.85, behavior: 'smooth' })
  }

  if (items.length === 0) return null

  return (
    <section className="relative pt-10">
      <div className="page-container flex items-center justify-between gap-4">
        <h2 className="min-w-0 truncate text-[14px] font-medium text-white">{title}</h2>

        {/* -mr-3 cancels the button box and the glyph's own inset, so the
            visible chevron lines up with the column edge. */}
        <div className="-mr-3 hidden sm:flex">
          <ArrowButton label={`Scroll ${title} left`} disabled={!canPrev} onClick={() => scrollByPage(-1)}>
            <ChevronLeft className="size-5" aria-hidden />
          </ArrowButton>
          <ArrowButton label={`Scroll ${title} right`} disabled={!canNext} onClick={() => scrollByPage(1)}>
            <ChevronRight className="size-5" aria-hidden />
          </ArrowButton>
        </div>
      </div>

      <ul
        ref={trackRef}
        onScroll={updateEdges}
        style={{
          paddingInline: GUTTER,
          scrollPaddingInline: GUTTER,
          maskImage: EDGE_FADE,
          WebkitMaskImage: EDGE_FADE,
        }}
        className={cn(
          'no-scrollbar mt-3 flex snap-x snap-mandatory overflow-x-auto scroll-smooth pb-2',
          variant === 'tracks' ? 'gap-2.5' : 'gap-4 sm:gap-5',
        )}
      >
        {variant === 'tracks'
          ? chunk(items, TRACKS_PER_COLUMN).map((column, c) => (
              <li key={column[0].id} className="w-[270px] shrink-0 snap-start">
                {column.map((item, i) => (
                  <TrackRow
                    key={item.id}
                    item={item}
                    last={i === column.length - 1}
                    eager={eager && c < 3}
                  />
                ))}
              </li>
            ))
          : items.map((item, i) => (
              <li key={item.id} className="w-40 shrink-0 snap-start sm:w-48 lg:w-52">
                <Tile item={item} eager={eager && i < 6} />
              </li>
            ))}
      </ul>
    </section>
  )
}

function linkProps(item: MediaItem) {
  return {
    href: REPO_URL,
    target: '_blank',
    rel: 'noopener noreferrer',
    'aria-label': `${item.title}${item.explicit ? ' (Explicit)' : ''} by ${item.subtitle} — open BitChord on GitHub`,
  }
}

/** A large square cover with title and artist underneath. */
function Tile({ item, eager }: { item: MediaItem; eager: boolean }) {
  return (
    <a {...linkProps(item)} className="group block focus-visible:outline-none">
      {/* Apple Music-style hairline: a thin inset edge drawn
          over the artwork (::after), so it reads on dark covers too. */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-white/[0.04] group-focus-visible:ring-2 group-focus-visible:ring-white/70 after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_0_0_0.75px_rgb(255_255_255/0.32)] after:transition-shadow after:duration-300 group-hover:after:shadow-[inset_0_0_0_0.75px_rgb(255_255_255/0.5)]">
        <Image
          src={artworkUrl(item.artwork, 500)}
          alt=""
          fill
          sizes="(min-width: 1024px) 208px, (min-width: 640px) 192px, 160px"
          priority={eager}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </div>
      <p className="mt-2.5 flex items-center gap-1.5 text-[14px] font-medium text-white">
        <span className="truncate">{item.title}</span>
        {item.explicit ? <ExplicitBadge /> : null}
      </p>
      <p className="truncate text-[13px] text-white/50">{item.subtitle}</p>
    </a>
  )
}

/**
 * A compact song row, sized to Apple's "Best New Songs" shelf: 55px tall,
 * 40px cover with 5px corners, 13px title, 12px artist, and a hairline
 * divider under the text on every row but the last in its column.
 */
function TrackRow({ item, last, eager }: { item: MediaItem; last: boolean; eager: boolean }) {
  return (
    <a
      {...linkProps(item)}
      className="group flex h-[55px] items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    >
      <div className="relative size-10 shrink-0 overflow-hidden rounded-[5px] bg-white/[0.04] after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_0_0_0.75px_rgb(255_255_255/0.32)]">
        <Image
          src={artworkUrl(item.artwork, 120)}
          alt=""
          fill
          sizes="40px"
          priority={eager}
          className="object-cover"
        />
      </div>
      <div
        className={cn(
          'flex h-full min-w-0 flex-1 flex-col justify-center',
          !last && 'border-b-[0.8px] border-white/10',
        )}
      >
        <p className="flex items-center gap-1.5 text-[13px] leading-[15px] text-white/90 group-hover:text-white">
          <span className="truncate">{item.title}</span>
          {item.explicit ? <ExplicitBadge /> : null}
        </p>
        <p className="truncate text-[12px] leading-[14px] text-white/60">{item.subtitle}</p>
      </div>
    </a>
  )
}

function chunk<T>(list: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}
