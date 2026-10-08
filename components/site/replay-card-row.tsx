'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ArrowButton } from '@/components/ui/arrow-button'
import { ReplayCreditCard, type ReplayCardData } from '@/components/ui/replay-card'
import { RELEASES_URL } from '@/lib/github'

/**
 * The Library's card row — 300px cards, 12px apart, scrolled sideways — with
 * the album rows' chevrons centred underneath, so it can be paged with a mouse
 * as well as swiped. `safe center` centres the row only when it fits, so the
 * first card is never pushed out of reach.
 */
export function ReplayCardRow({ cards }: { cards: ReplayCardData[] }) {
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
    const ro = new ResizeObserver(updateEdges)
    if (trackRef.current) ro.observe(trackRef.current)
    return () => ro.disconnect()
  }, [updateEdges])

  const scrollByPage = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' })
  }

  return (
    <>
      <ul
        ref={trackRef}
        onScroll={updateEdges}
        className="no-scrollbar mt-9 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-6 pb-4 pt-2 [justify-content:safe_center] sm:px-10"
      >
        {cards.map((card) => (
          <li key={card.label} className="snap-center">
            <ReplayCreditCard card={card} holder="BitChord listener" memberSince="04/25" href={RELEASES_URL} />
          </li>
        ))}
      </ul>

      {/* Only when there is somewhere to go: a row that fits needs no arrows. */}
      {canPrev || canNext ? (
        <div className="mt-2 flex justify-center gap-1">
          <ArrowButton label="Previous Replay card" disabled={!canPrev} onClick={() => scrollByPage(-1)}>
            <ChevronLeft className="size-5" aria-hidden />
          </ArrowButton>
          <ArrowButton label="Next Replay card" disabled={!canNext} onClick={() => scrollByPage(1)}>
            <ChevronRight className="size-5" aria-hidden />
          </ArrowButton>
        </div>
      ) : null}
    </>
  )
}
