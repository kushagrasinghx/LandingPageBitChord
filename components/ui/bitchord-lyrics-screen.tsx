'use client'

import Image from 'next/image'
import { Fragment, useEffect, useMemo, useRef } from 'react'
import { DEMO_TRACK, type DemoLyrics } from '@/lib/lyrics-demo'
import {
  GLOW_RADIUS,
  GLOW_ROOM,
  INACTIVE_SCALE,
  LINE_FALLOFF_ALPHA,
  LINE_FALLOFF_BLUR,
  LYRIC_EASING_CSS,
  LYRIC_SETTLE_MS,
  STAGGER_FRACTION,
  STAGGER_STEPS,
  UNSUNG_ALPHA,
  WIPE_FEATHER,
  WORD_RISE,
  activeLyricRows,
  blurSigma,
  buildLine,
  lyricEasing,
  revealedChars,
  sampleGrowth,
  scrollLead,
  wordLift,
  type CharGrowth,
  type LyricLine,
} from '@/lib/lyrics-engine'

/**
 * The BitChord app's player with the lyrics open, rebuilt for the web from the
 * app's own source (sharedUi/.../ui/player: NowPlayingScreen.kt,
 * PlayerLyrics.kt, ArtworkMeshBackdrop.kt, PlayerControls.kt, PlayerQueue.kt).
 *
 * Measurements are the app's dp, drawn 1:1 as CSS px on a 390×844 screen:
 * - 32dp dismiss strip with a 38×5 handle, 8dp pad, 60dp header with a 54dp
 *   thumbnail (8dp corners), credits 12dp after it scaled to 0.8, and 34dp
 *   translucent discs for like / more.
 * - The lyric list: 30dp gutter, 40dp top inset, 28dp fading edges, lines
 *   in SF Pro Display ExtraBold 34/41 with −0.7 tracking, 10dp glow room.
 * - Backdrop: the cover blurred to nothing under a 34→48→64% black gradient.
 *
 * Every frame-rate value is written straight to the DOM from one rAF loop,
 * the way the app reads its clock in the draw phase rather than recomposing.
 * Row-level settles (dim, blur, scale) are CSS transitions on the app's
 * 400ms LYRIC_EASING curve.
 *
 * Deliberately word-level only. The app also swells a held note letter by
 * letter; here every word animates the same way (sweep and lift), and a held
 * note blooms as a whole word, softer than the app's — CSS blur on white text
 * reads far stronger than the app's glow does on a phone.
 */

/** The bloom on a held word, at its strongest (the app uses 0.62). */
const GLOW_ALPHA = 0.32

/** The app's typeface. Apple devices have it; elsewhere Inter stands in. */
const SF_STACK = '"SF Pro Display", -apple-system, BlinkMacSystemFont, var(--font-inter), system-ui, sans-serif'

const PLAYER_GUTTER = 30
const PANEL_TOP_INSET = 40
const FADE_EDGE = 28
const STATUS_BAR = 40
const DISMISS_STRIP = 32
const ART_BOX_TOP_PAD = 8
const HEADER_HEIGHT = 60
const THUMB_SIZE = 54
const PANEL_TOP = STATUS_BAR + DISMISS_STRIP + ART_BOX_TOP_PAD + HEADER_HEIGHT

const COPIES = ['dim', 'glow', 'lit'] as const
type Copy = (typeof COPIES)[number]

type WordBox = { left: number; width: number; top: number; right: number }
type Run = { from: number; delta: number; durationMs: number; startedAt: number }

export function BitChordLyricsScreen({ lyrics, className }: { lyrics: DemoLyrics; className?: string }) {
  const LINES = useMemo(() => lyrics.lines.map((l) => buildLine(l.timeMs, l.words)), [lyrics])
  const SONG_MS = lyrics.durationMs
  const panelRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<(HTMLDivElement | null)[]>([])
  const staggerRefs = useRef<(HTMLDivElement | null)[]>([])
  const scaleRefs = useRef<(HTMLDivElement | null)[]>([])
  const copyRefs = useRef<Record<Copy, (HTMLDivElement | null)[]>>({ dim: [], glow: [], lit: [] })
  const wordRefs = useRef<Record<Copy, (HTMLSpanElement | null)[][]>>({
    dim: LINES.map(() => []),
    glow: LINES.map(() => []),
    lit: LINES.map(() => []),
  })

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // The app turns the bloom off under reduced animation; so does this.
    const glowing = !reduced

    let boxes: WordBox[][] = []
    let rowTops: number[] = []

    /** Word boxes in the lit copy, which every copy shares. Re-read when fonts land. */
    const measure = () => {
      boxes = LINES.map((_, li) =>
        wordRefs.current.lit[li]!.map((el) => {
          if (!el) return { left: 0, width: 0, top: 0, right: 0 }
          return { left: el.offsetLeft, width: el.offsetWidth, top: el.offsetTop, right: el.offsetLeft + el.offsetWidth }
        }),
      )
      rowTops = rowRefs.current.map((el) => el?.offsetTop ?? 0)
    }
    measure()
    document.fonts?.ready.then(measure)

    // Only what changed is written; a frame that changes nothing costs a compare.
    const painted = LINES.map(() => ({ alpha: -1, blur: -1, scale: -1, dim: -1, glow: -1, phase: -1 }))
    const growth: CharGrowth = { scale: 1, shift: 0, rise: 0, bloom: 0 }

    let scroll = 0
    let placed = false
    let focus = -1
    let run: Run | null = null
    let clock = 0
    let last = performance.now()
    let visible = true
    let raf = 0

    const drawLine = (li: number, at: number, active: boolean) => {
      const line = LINES[li]!
      const revealed = revealedChars(line, at)
      const wordBoxes = boxes[li] ?? []

      // ----- the sweep: lit copy masked at the edge, feathered while active -----
      let edgeRow = -1
      let edgeX = 0
      const done = revealed >= line.text.length
      if (!done && revealed > 0) {
        let wi = line.wordSpans.findIndex(([s, e]) => revealed >= s && revealed < e)
        if (wi >= 0) {
          const [s, e] = line.wordSpans[wi]!
          const b = wordBoxes[wi]!
          edgeRow = b.top
          edgeX = b.left + (b.width * (revealed - s)) / (e - s)
        } else {
          // In the space between two words: it fills over the pause.
          wi = line.wordSpans.findIndex(([, e], i) => revealed >= e && revealed < (line.wordSpans[i + 1]?.[0] ?? Infinity))
          const b = wordBoxes[wi]
          const n = wordBoxes[wi + 1]
          if (b) {
            edgeRow = b.top
            const [, e] = line.wordSpans[wi]!
            const ns = line.wordSpans[wi + 1]?.[0] ?? e
            const f = ns > e ? (revealed - e) / (ns - e) : 1
            edgeX = n && n.top === b.top ? b.right + (n.left - b.right) * f : b.right
          }
        }
      }
      const feather = active ? WIPE_FEATHER : 0
      line.words.forEach((_, wi) => {
        const el = wordRefs.current.lit[li]![wi]
        if (!el) return
        const b = wordBoxes[wi]!
        let mask = 'none'
        let shown = '1'
        if (revealed <= 0) shown = '0'
        else if (!done) {
          if (b.top > edgeRow) shown = '0'
          else if (b.top === edgeRow) {
            const to = edgeX - b.left
            const from = Math.max(edgeX - feather, 0) - b.left
            mask = `linear-gradient(to right, #000 ${from}px, transparent ${to}px)`
          }
        }
        if (el.style.opacity !== shown) el.style.opacity = shown
        if (el.style.maskImage !== mask) {
          el.style.maskImage = mask
          el.style.webkitMaskImage = mask
        }
      })

      // ----- the lift, and a held word's bloom: word level only -----
      line.words.forEach((_, wi) => {
        const lift = reduced ? 0 : wordLift(line, wi, at)
        const transform = lift <= 0.01 ? '' : `translateY(${(-lift * WORD_RISE).toFixed(2)}px)`
        for (const copy of COPIES) {
          const wordEl = wordRefs.current[copy][li]![wi]
          if (wordEl && wordEl.style.transform !== transform) wordEl.style.transform = transform
        }
        // The app's bloom envelope for a held note, taken as the brightest of
        // its letters at this moment and applied to the whole word.
        const glowEl = wordRefs.current.glow[li]![wi]
        if (!glowEl) return
        const grow = line.growing.find((g) => g.index === wi)
        let bloom = 0
        if (grow && !reduced && at >= grow.startMs && at <= grow.restsAtMs) {
          for (let ci = 0; ci < line.words[wi]!.text.length; ci++) {
            sampleGrowth(grow, ci, at, growth)
            bloom = Math.max(bloom, growth.bloom)
          }
        }
        const o = bloom > 0.01 ? Math.min(bloom, 1).toFixed(3) : '0'
        if (glowEl.style.opacity !== o) glowEl.style.opacity = o
      })
    }

    const frame = (now: number) => {
      const dt = now - last
      last = now
      const before = clock
      clock = (clock + dt) % SONG_MS
      const t = clock

      // Back to the top when the song comes round again.
      if (t < before) {
        placed = false
        focus = -1
        run = null
        scroll = 0
        painted.forEach((p) => (p.phase = -1))
      }

      const active = activeLyricRows(LINES, t)
      const scrollLine = active[0] ?? -1
      const lead = activeLyricRows(LINES, t + scrollLead(LINES, t))[0] ?? -1
      const nextFocus = lead >= 0 ? lead : scrollLine

      if (nextFocus !== focus) {
        focus = nextFocus
        if (focus >= 0) {
          const target = (rowTops[focus] ?? 0) - (PANEL_TOP_INSET - GLOW_ROOM)
          if (!placed) {
            scroll = target
            placed = true
            run = null
          } else {
            run = { from: scroll, delta: target - scroll, durationMs: scrollLead(LINES, t), startedAt: now }
          }
        }
      }

      let elapsed = 0
      if (run) {
        elapsed = now - run.startedAt
        scroll = run.from + run.delta * lyricEasing(elapsed / run.durationMs)
        if (elapsed > run.durationMs * (1 + STAGGER_FRACTION * STAGGER_STEPS)) run = null
      }
      trackRef.current!.style.transform = `translate3d(0, ${(-scroll).toFixed(2)}px, 0)`

      for (let i = 0; i < LINES.length; i++) {
        const line = LINES[i]!
        const p = painted[i]!
        const isActive = active.includes(i)
        const offset = scrollLine < 0 ? 0 : i - scrollLine
        const step = Math.min(Math.abs(offset), LINE_FALLOFF_ALPHA.length - 1)

        const alpha = isActive ? 1 : LINE_FALLOFF_ALPHA[step]!
        const blur = isActive ? 0 : blurSigma(LINE_FALLOFF_BLUR[step]!)
        const scale = isActive ? 1 : INACTIVE_SCALE
        const dim = offset < 0 ? 1 : UNSUNG_ALPHA
        const glow = isActive && glowing ? GLOW_ALPHA : 0

        const row = rowRefs.current[i]!
        if (p.alpha !== alpha) row.style.opacity = String((p.alpha = alpha))
        if (p.blur !== blur) row.style.filter = (p.blur = blur) > 0 ? `blur(${blur.toFixed(2)}px)` : 'none'
        if (p.scale !== scale) scaleRefs.current[i]!.style.transform = `scale(${(p.scale = scale)})`
        if (p.dim !== dim) copyRefs.current.dim[i]!.style.color = `rgb(255 255 255 / ${(p.dim = dim)})`
        if (p.glow !== glow) copyRefs.current.glow[i]!.style.opacity = String((p.glow = glow))

        // The rows after the one being scrolled to arrive one behind another.
        let ty = 0
        if (run && focus >= 0) {
          const behind = Math.min(Math.max(run.delta >= 0 ? i - focus : focus - i, 0), STAGGER_STEPS)
          const delay = behind * STAGGER_FRACTION * run.durationMs
          if (delay > 0) {
            ty = run.delta * (lyricEasing(elapsed / run.durationMs) - lyricEasing((elapsed - delay) / run.durationMs))
          }
        }
        staggerRefs.current[i]!.style.transform = ty ? `translate3d(0, ${ty.toFixed(2)}px, 0)` : ''

        // Only a line inside its own animation window redraws every frame;
        // either side of it, it is drawn once at rest.
        const phase = t < line.animatesFromMs ? 0 : t > line.animatesUntilMs ? 2 : 1
        if (phase === 1 || p.phase !== phase) {
          p.phase = phase
          const at = phase === 0 ? line.animatesFromMs - 1 : phase === 2 ? line.animatesUntilMs + 1 : t
          drawLine(i, at, isActive)
        }
      }

      if (visible) raf = requestAnimationFrame(frame)
    }

    // Paused while scrolled out of view, like the app off screen.
    const io = new IntersectionObserver(([entry]) => {
      const was = visible
      visible = Boolean(entry?.isIntersecting)
      if (visible && !was) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    })
    if (panelRef.current) io.observe(panelRef.current)
    raf = requestAnimationFrame(frame)
    window.addEventListener('resize', measure)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [LINES, SONG_MS])

  const lineStyle = {
    fontSize: 34,
    lineHeight: '41px',
    fontWeight: 800,
    letterSpacing: '-0.7px',
  } as const

  const renderWords = (line: LyricLine, li: number, copy: Copy) =>
    line.words.map((word, wi) => (
      <Fragment key={wi}>
        <span
          ref={(el) => void (wordRefs.current[copy][li]![wi] = el)}
          className="inline-block will-change-transform"
          style={copy === 'glow' ? { opacity: 0 } : undefined}
        >
          {word.text}
        </span>
        {wi < line.words.length - 1 ? ' ' : null}
      </Fragment>
    ))

  return (
    <div
      className={className}
      style={{ fontFamily: SF_STACK, WebkitFontSmoothing: 'antialiased' }}
      role="img"
      aria-label={`BitChord's lyrics screen playing ${DEMO_TRACK.title} by ${DEMO_TRACK.artist}, with synced lyrics`}
    >
      <div className="relative h-[844px] w-[390px] overflow-hidden bg-[#121212] text-white" aria-hidden>
        {/* ------------------- FullArtworkBlurBackdrop ------------------- */}
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={DEMO_TRACK.artwork}
            alt=""
            fill
            sizes="390px"
            className="scale-[1.35] object-cover"
            // The app box-blurs a 128px copy three times (radius 1/12 of it) and
            // stretches it to the screen: ~70px of blur at this size. The filter
            // is scaled by the 1.35 zoom that hides the blurred edge, hence 52.
            style={{ filter: 'blur(52px)' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgb(0 0 0 / 0.34) 0%, rgb(0 0 0 / 0.48) 55%, rgb(0 0 0 / 0.64) 100%)',
            }}
          />
        </div>

        {/* -------------------------- status bar -------------------------- */}
        <StatusBar />

        {/* --------------------- dismiss strip + handle -------------------- */}
        <div className="relative" style={{ height: DISMISS_STRIP }}>
          <div
            className="absolute left-1/2 h-[5px] w-[38px] -translate-x-1/2 rounded-[3px] bg-white/70 shadow-[0_1px_2px_rgb(0_0_0/0.3)]"
            style={{ top: (DISMISS_STRIP - 5) / 2 }}
          />
        </div>

        {/* ----------------------------- header ---------------------------- */}
        <div
          className="relative flex items-center"
          style={{ marginTop: ART_BOX_TOP_PAD, height: HEADER_HEIGHT, paddingInline: PLAYER_GUTTER }}
        >
          <div
            className="relative shrink-0 overflow-hidden rounded-[8px]"
            style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
          >
            <Image src={DEMO_TRACK.artwork} alt="" fill sizes="54px" className="object-cover" />
          </div>
          <div className="ml-3 min-w-0 flex-1 origin-left scale-[0.8]">
            <p className="truncate text-[20px] font-bold leading-[24px] tracking-[-0.3px] text-white">
              {DEMO_TRACK.title}
            </p>
            <p className="truncate text-[20px] font-medium leading-[24px] tracking-[-0.3px] text-white/55">
              {DEMO_TRACK.artist}
            </p>
          </div>
          <div className="ml-2.5 flex shrink-0 items-center gap-2">
            <Disc>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round">
                <path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 3.9 4 7.4 4c2 0 3.5 1.1 4.6 2.7C13.1 5.1 14.6 4 16.6 4c3.5 0 5.8 3.6 4.6 7.1-1.7 4.8-9.2 9.4-9.2 9.4z" />
              </svg>
            </Disc>
            <Disc>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
            </Disc>
          </div>
        </div>

        {/* -------------------------- lyrics panel ------------------------- */}
        <div
          ref={panelRef}
          className="absolute inset-x-0 bottom-0 overflow-hidden"
          style={{
            top: PANEL_TOP,
            maskImage: `linear-gradient(to bottom, transparent 0, #000 ${FADE_EDGE}px, #000 calc(100% - ${FADE_EDGE}px), transparent 100%)`,
            WebkitMaskImage: `linear-gradient(to bottom, transparent 0, #000 ${FADE_EDGE}px, #000 calc(100% - ${FADE_EDGE}px), transparent 100%)`,
          }}
        >
          <div
            ref={trackRef}
            className="will-change-transform"
            style={{
              paddingTop: PANEL_TOP_INSET - GLOW_ROOM,
              paddingInline: PLAYER_GUTTER - GLOW_ROOM,
              paddingBottom: 600,
            }}
          >
            {LINES.map((line, li) => (
              <div
                key={li}
                ref={(el) => void (rowRefs.current[li] = el)}
                style={{
                  transition: `opacity ${LYRIC_SETTLE_MS}ms ${LYRIC_EASING_CSS}, filter ${LYRIC_SETTLE_MS}ms ${LYRIC_EASING_CSS}`,
                }}
              >
                <div ref={(el) => void (staggerRefs.current[li] = el)}>
                  <div
                    ref={(el) => void (scaleRefs.current[li] = el)}
                    className="origin-left"
                    style={{ transition: `transform ${LYRIC_SETTLE_MS}ms ${LYRIC_EASING_CSS}` }}
                  >
                    <div className="relative" style={{ ...lineStyle, padding: GLOW_ROOM }}>
                      {/* Dim copy: in flow, sets the size every copy shares. */}
                      <div
                        ref={(el) => void (copyRefs.current.dim[li] = el)}
                        style={{ color: `rgb(255 255 255 / ${UNSUNG_ALPHA})`, transition: 'color 300ms ease-out' }}
                      >
                        {renderWords(line, li, 'dim')}
                      </div>
                      {/* Bloom: only held words, blurred. */}
                      <div
                        ref={(el) => void (copyRefs.current.glow[li] = el)}
                        className="pointer-events-none absolute"
                        style={{
                          inset: GLOW_ROOM,
                          color: '#fff',
                          opacity: 0,
                          filter: `blur(${blurSigma(GLOW_RADIUS).toFixed(2)}px)`,
                          transition: 'opacity 420ms cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      >
                        {renderWords(line, li, 'glow')}
                      </div>
                      {/* Lit copy: masked to whatever has been sung. */}
                      <div
                        ref={(el) => void (copyRefs.current.lit[li] = el)}
                        className="pointer-events-none absolute"
                        style={{ inset: GLOW_ROOM, color: '#fff' }}
                      >
                        {renderWords(line, li, 'lit')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** The app's CircleGlyph: a 34dp disc at 18% white with a 19dp white glyph. */
function Disc({ children }: { children: React.ReactNode }) {
  return <div className="grid size-[34px] place-items-center rounded-full bg-white/[0.18] text-white">{children}</div>
}

function StatusBar() {
  return (
    <div className="relative" style={{ height: STATUS_BAR }}>
      {/* Front camera punch-hole, centred in the bar. */}
      <span className="absolute left-1/2 top-1/2 size-[15px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black ring-1 ring-white/10" />
    </div>
  )
}
