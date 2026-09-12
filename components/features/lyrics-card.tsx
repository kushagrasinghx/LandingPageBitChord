'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Languages } from 'lucide-react'
import { cn } from '@/lib/utils'

import {
  LINE_FALLOFF_ALPHA,
  LINE_FALLOFF_BLUR,
  LYRIC_EASING,
  LYRIC_SETTLE_MS,
  INACTIVE_SCALE,
  LINE_GAP_MS,
  UNSUNG_ALPHA,
  buildLines,
  charAlpha,
  revealedChars,
  wordLift,
  type SourceLine,
} from '@/lib/lyric-timing'

/* ---------------------------------------------------------------------------
   Timing data

   Authored as plain word durations; `buildLines` turns them into the absolute
   timings and character offsets the sweep indexes into.
   --------------------------------------------------------------------------- */

const SOURCE: SourceLine[] = [
  {
    words: [
      { text: 'Hold', ms: 420, gap: 60 },
      { text: 'the', ms: 190 },
      { text: 'line', ms: 560, gap: 120 },
      { text: 'a', ms: 160 },
      { text: 'little', ms: 340 },
      { text: 'longer', ms: 900 },
    ],
    translation: 'Aguanta la línea un poco más',
  },
  {
    words: [
      { text: 'every', ms: 300 },
      { text: 'echo', ms: 420, gap: 90 },
      { text: 'coming', ms: 360 },
      { text: 'back', ms: 300, gap: 70 },
      { text: 'stronger', ms: 980 },
    ],
    translation: 'cada eco regresa más fuerte',
  },
  {
    words: [
      { text: 'and', ms: 220 },
      { text: 'the', ms: 180 },
      { text: 'room', ms: 620, gap: 140 },
      { text: 'goes', ms: 300 },
      { text: 'quiet', ms: 900 },
    ],
    translation: 'y la sala se queda en silencio',
  },
  {
    words: [
      { text: 'sung', ms: 480, gap: 80 },
      { text: 'in', ms: 200 },
      { text: 'full', ms: 420, gap: 110 },
      { text: 'resolution', ms: 1200 },
    ],
    translation: 'cantado en resolución completa',
  },
]

const LINES = buildLines(SOURCE)

const TOTAL_MS = LINES[LINES.length - 1]!.endMs + LINE_GAP_MS * 3

/* ---------------------------------------------------------------------------
   Component
   --------------------------------------------------------------------------- */

/**
 * The lyrics panel as the app actually draws it.
 *
 * Three behaviours carry it, and all three are why the previous version read as
 * a mock-up:
 *
 *  1. The highlight is *character*-level, not word-level. It creeps across a
 *     held word instead of snapping from one word to the next, and the boundary
 *     character is partly lit so the cut lands inside a glyph.
 *  2. A word being held blooms — clipped to that word rather than trailing the
 *     highlight. The app also lifts it a couple of px; that is deliberately not
 *     reproduced here, because translating an inline-block mid-sentence costs a
 *     layout pass per frame on the web and stuttered.
 *  3. Rows either side of the sung one fall off in brightness *and* focus, and
 *     the panel carries the sung row to a fixed height instead of letting it sit
 *     wherever it landed.
 *
 * Per-frame work is written straight to the DOM from one rAF loop. Driving ~180
 * characters through React state at 60fps would spend the frame budget in
 * reconciliation; the row-level settle is left to CSS transitions, which are the
 * browser's equivalent of the app's `animateFloatAsState`.
 */
export function LyricsCard() {
  const reduced = useReducedMotion()
  const [translate, setTranslate] = useState(false)

  const stageRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<(HTMLDivElement | null)[]>([])
  const charRefs = useRef<(HTMLSpanElement | null)[][]>(LINES.map(() => []))
  const wordRefs = useRef<(HTMLSpanElement | null)[][]>(LINES.map(() => []))

  // Last value written per element, so a frame that changes nothing costs a
  // comparison rather than a style recalc.
  const painted = useRef({
    alpha: LINES.map((l) => l.text.split('').map(() => -1)),
    lift: LINES.map((l) => l.words.map(() => -1)),
    row: LINES.map(() => Number.NaN),
    active: -1,
  })

  // Row offsets, measured once per layout rather than per frame.
  //
  // Reading `offsetTop` inside the loop — after the loop had already written
  // opacity, filter and transform to the same rows — forces a synchronous
  // layout on every frame, with a blur transition in flight each time. Caching
  // them keeps the loop write-only.
  const offsets = useRef<number[]>([])
  const measure = useRef(() => {})

  useLayoutEffect(() => {
    let raf = 0
    let start = 0
    let onScreen = true

    /** Where the sung row sits, measured from the top of the stage. */
    const FOCUS_TOP = 6

    function paint(positionMs: number) {
      // Which row is being sung. Past the last line the panel holds on it
      // rather than snapping back, the way it does at the end of a track.
      let active = 0
      for (let i = 0; i < LINES.length; i++) {
        if (positionMs >= LINES[i]!.timeMs) active = i
      }

      /* ------------------------------ rows ------------------------------ */

      for (let li = 0; li < LINES.length; li++) {
        const row = rowRefs.current[li]
        if (!row) continue
        const distance = Math.abs(li - active)
        const step = Math.min(distance, LINE_FALLOFF_ALPHA.length - 1)
        if (painted.current.row[li] === step) continue

        painted.current.row[li] = step
        row.style.opacity = String(LINE_FALLOFF_ALPHA[step])
        row.style.filter = step === 0 ? 'none' : `blur(${LINE_FALLOFF_BLUR[step]}px)`
        row.style.transform = `scale(${distance === 0 ? 1 : INACTIVE_SCALE})`
      }

      /* ---------------------------- the sweep --------------------------- */

      for (let li = 0; li < LINES.length; li++) {
        const line = LINES[li]!
        const chars = charRefs.current[li]!
        const alphas = painted.current.alpha[li]!

        // A row wholly sung or wholly unsung is one comparison, not a walk of
        // its characters — which is every row but one, most frames.
        const uniform =
          positionMs >= line.endMs ? 1 : positionMs <= line.timeMs ? UNSUNG_ALPHA : null

        // The cache is only updated once the write has actually happened. React
        // calls an inline callback ref with `null` before re-attaching it, so a
        // frame landing mid-re-render can see a missing element; recording that
        // as painted would leave the character stuck at a stale colour until
        // its value happened to change again.
        if (uniform !== null) {
          for (let k = 0; k < chars.length; k++) {
            if (alphas[k] === uniform) continue
            const el = chars[k]
            if (!el) continue
            alphas[k] = uniform
            el.style.color = `rgba(255,255,255,${uniform})`
          }
        } else {
          const revealed = revealedChars(line, positionMs)
          for (let k = 0; k < chars.length; k++) {
            const quantised = Math.round(charAlpha(revealed, k) * 100) / 100
            if (alphas[k] === quantised) continue
            const el = chars[k]
            if (!el) continue
            alphas[k] = quantised
            el.style.color = `rgba(255,255,255,${quantised})`
          }
        }

        /* ----------------------------- bloom ---------------------------- */

        const words = wordRefs.current[li]!
        const lifts = painted.current.lift[li]!
        for (let wi = 0; wi < line.words.length; wi++) {
          const quantised = Math.round(wordLift(line.words[wi]!, positionMs) * 100) / 100
          if (lifts[wi] === quantised) continue
          const el = words[wi]
          if (!el) continue
          lifts[wi] = quantised
          // Brightness only. The word used to rise a couple of px as well, but
          // animating `translateY` on an inline-block inside a line of text
          // re-runs layout for the whole line every frame, and it visibly
          // stuttered. The bloom carries the held note on its own.
          el.style.textShadow =
            quantised === 0
              ? ''
              : `0 0 ${6 + 4 * quantised}px rgba(255,255,255,${0.5 * quantised})`
        }
      }

      /* ----------------------------- scroll ----------------------------- */

      // Only when the panel actually moves to a different line. The offsets
      // come from the cache, so no frame reads layout back.
      if (painted.current.active !== active) {
        painted.current.active = active
        const track = trackRef.current
        const top = offsets.current[active]
        if (track && top !== undefined) {
          track.style.transform = `translateY(${FOCUS_TOP - top}px)`
        }
      }
    }

    function frame(now: number) {
      // Re-queue first and bail second. The loop must not be the thing that
      // stops, because the only event that could restart it is an
      // IntersectionObserver callback — and those are not delivered while the
      // page is not being rendered. Stopping the loop on an off-screen entry
      // and waiting for a callback that never came is exactly how this card
      // ended up frozen on its first frame, every character still unsung.
      raf = requestAnimationFrame(frame)
      if (!onScreen) return
      if (!start) start = now
      paint((now - start) % TOTAL_MS)
    }

    /**
     * Re-read every row's resting position. Called on mount, on resize, and
     * whenever the translation track opens or closes — the three things that
     * change row heights. Never from inside the frame loop.
     */
    measure.current = () => {
      offsets.current = rowRefs.current.map((row) => row?.offsetTop ?? 0)
      // Force the next frame to reposition against the new measurements.
      painted.current.active = -1
    }
    measure.current()

    const onResize = () => measure.current()
    window.addEventListener('resize', onResize)

    if (reduced) {
      // One representative frame: part-way through the third line, so the
      // falloff, a partial sweep and a lifted word are all visible at rest.
      paint(LINES[2]!.timeMs + 700)
      return () => window.removeEventListener('resize', onResize)
    }

    // Skip the work while the card is off screen. A frame that early-returns
    // costs nothing; the browser already throttles rAF in background tabs.
    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry?.isIntersecting ?? true
      },
      { threshold: 0 },
    )
    if (stageRef.current) io.observe(stageRef.current)

    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [reduced])

  // Opening or closing the translation track changes every row's height, so
  // the cached offsets are stale until the rows have been re-measured.
  useEffect(() => {
    measure.current()
  }, [translate])

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setTranslate((v) => !v)}
          aria-pressed={translate}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 font-mono text-[9.5px] uppercase tracking-wider transition-colors',
            translate
              ? 'border-white/35 bg-white/12 text-white'
              : 'border-line bg-white/[0.04] text-white/45 hover:text-white',
          )}
        >
          <Languages className="size-3" aria-hidden />
          {translate ? 'ES on' : 'Translate'}
        </button>
      </div>

      {/*
        Lyric stage.

        Deliberately `h-[190px] shrink-0` and *not* `flex-1`. Every row inside
        is absolutely positioned so the panel can carry the sung line to a fixed
        height, which leaves this box with no in-flow content at all. Under
        `flex-1` the basis of 0% then wins over the height, the column has no
        spare space to grow into, and the whole panel collapses to a couple of
        pixels — lyrics present in the DOM, clipped out of existence by
        `overflow-hidden`.
      */}
      <div
        ref={stageRef}
        className="relative h-[212px] shrink-0 overflow-hidden rounded-xl border border-line bg-black/35 px-4"
      >
        <div
          ref={trackRef}
          className="absolute inset-x-4 top-0 will-change-transform"
          style={{ transition: `transform ${LYRIC_SETTLE_MS}ms ${LYRIC_EASING}` }}
        >
          {LINES.map((line, li) => (
            <div
              key={li}
              ref={(el) => {
                rowRefs.current[li] = el
              }}
              className="origin-left py-[9px]"
              style={{
                transition: `opacity ${LYRIC_SETTLE_MS}ms ${LYRIC_EASING}, filter ${LYRIC_SETTLE_MS}ms ${LYRIC_EASING}, transform ${LYRIC_SETTLE_MS}ms ${LYRIC_EASING}`,
              }}
            >
              {/* `text-white/45` is the unsung baseline, so the line looks
                  right for the frames before the loop first paints rather than
                  flashing at the inherited body colour. */}
              <p className="text-[23px] font-bold leading-[1.18] tracking-[-0.022em] text-white/45 sm:text-[27px]">
                {line.words.map((word, wi) => (
                  <span key={wi}>
                    <span
                      ref={(el) => {
                        wordRefs.current[li]![wi] = el
                      }}
                      className="inline-block"
                    >
                      {word.text.split('').map((char, ci) => (
                        <span
                          key={ci}
                          ref={(el) => {
                            charRefs.current[li]![word.from + ci] = el
                          }}
                        >
                          {char}
                        </span>
                      ))}
                    </span>
                    {wi < line.words.length - 1 ? (
                      <span
                        ref={(el) => {
                          charRefs.current[li]![word.to] = el
                        }}
                      >
                        {' '}
                      </span>
                    ) : null}
                  </span>
                ))}
              </p>

              {translate ? (
                <p className="mt-1 text-[13.5px] italic leading-snug text-white/50">
                  {line.translation}
                </p>
              ) : null}
            </div>
          ))}
        </div>

        {/* The panel runs past its own edges, as it does on a phone screen. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/70 to-transparent"
        />
      </div>
    </div>
  )
}
