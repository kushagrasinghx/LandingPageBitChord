'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  motion,
  useMotionTemplate,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion'
import {
  Disc3,
  Heart,
  ListMusic,
  Pause,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Sparkles,
  Waves,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Demo track for the mockup. Lyrics are split per word with a duration in ms so
 * the highlight advances at word/syllable granularity, matching how BitChord's
 * enhanced-LRC highlighting actually behaves.
 */
const LYRIC_LINES: { words: { text: string; ms: number }[] }[] = [
  {
    words: [
      { text: 'Static', ms: 420 },
      { text: 'on', ms: 200 },
      { text: 'the', ms: 180 },
      { text: 'midnight', ms: 480 },
      { text: 'wire,', ms: 620 },
    ],
  },
  {
    words: [
      { text: 'every', ms: 320 },
      { text: 'sample', ms: 400 },
      { text: 'holding', ms: 420 },
      { text: 'fire', ms: 700 },
    ],
  },
  {
    words: [
      { text: 'lossless', ms: 460 },
      { text: 'now,', ms: 380 },
      { text: 'no', ms: 220 },
      { text: 'compromise', ms: 820 },
    ],
  },
]

const TOTAL_WORDS = LYRIC_LINES.reduce((n, l) => n + l.words.length, 0)

/** Flat word list with the line each word belongs to, for the ticker. */
const FLAT = LYRIC_LINES.flatMap((line, lineIndex) =>
  line.words.map((w) => ({ ...w, lineIndex })),
)

const STATS = [
  { label: 'Bit Depth', value: '24-bit' },
  { label: 'Sample Rate', value: '96 kHz' },
  { label: 'Bitrate', value: '1,411 kbps' },
  { label: 'Codec', value: 'FLAC Lossless' },
] as const

/** Deterministic bar heights — avoids a server/client hydration mismatch. */
const EQ_BARS = Array.from({ length: 28 }, (_, i) => 0.25 + Math.abs(Math.sin(i * 1.7)) * 0.75)

export function PhoneShowcase({ className }: { className?: string }) {
  const reduced = useReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)

  /* ------------------------------- 3D tilt -------------------------------- */

  // Springs hold normalized -0.5..0.5 pointer offsets; rotation is derived.
  const px = useSpring(0, { stiffness: 90, damping: 20, mass: 0.6 })
  const py = useSpring(0, { stiffness: 90, damping: 20, mass: 0.6 })

  const rotateY = useTransform(px, [-0.5, 0.5], [16, -16])
  const rotateX = useTransform(py, [-0.5, 0.5], [-13, 13])
  const transform = useMotionTemplate`perspective(1400px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduced) return
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    px.set((e.clientX - rect.left) / rect.width - 0.5)
    py.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  function onLeave() {
    px.set(0)
    py.set(0)
  }

  /* ----------------------------- lyric ticker ----------------------------- */

  const [wordIndex, setWordIndex] = useState(0)

  useEffect(() => {
    if (reduced) return
    const current = FLAT[wordIndex % TOTAL_WORDS]
    const timeout = window.setTimeout(
      () => setWordIndex((i) => (i + 1) % TOTAL_WORDS),
      current?.ms ?? 400,
    )
    return () => window.clearTimeout(timeout)
  }, [wordIndex, reduced])

  const activeLine = FLAT[wordIndex]?.lineIndex ?? 0
  // Index of the active word *within* its line.
  const wordInLine = useMemo(() => {
    let seen = 0
    for (let i = 0; i < activeLine; i++) seen += LYRIC_LINES[i]!.words.length
    return wordIndex - seen
  }, [wordIndex, activeLine])

  /* ---------------------------- playback clock ---------------------------- */

  // 0..1 through a 4:12 track. Purely decorative but must not desync from the
  // rendered timestamp, so both derive from this one value.
  const [progress, setProgress] = useState(0.31)

  useEffect(() => {
    if (reduced) return
    const id = window.setInterval(() => setProgress((p) => (p + 0.0012) % 1), 90)
    return () => window.clearInterval(id)
  }, [reduced])

  const DURATION = 252 // 4:12 in seconds
  const elapsed = Math.floor(progress * DURATION)
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div
      ref={wrapRef}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn('relative mx-auto w-full max-w-[330px]', className)}
    >
      {/* Ambient glow, standing in for BitChord's artwork-driven theming. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-16 -z-10 opacity-70 blur-3xl"
        style={{
          background:
            'radial-gradient(closest-side, rgba(124,58,237,0.5), transparent 72%), radial-gradient(closest-side at 70% 78%, rgba(6,182,212,0.42), transparent 70%), radial-gradient(closest-side at 26% 84%, rgba(236,72,153,0.34), transparent 70%)',
        }}
      />

      <motion.div
        style={{ transform, transformStyle: 'preserve-3d' }}
        className={cn('relative', !reduced && 'animate-float')}
      >
        {/* Device shell */}
        <div className="relative rounded-[42px] border border-white/[0.14] bg-gradient-to-b from-white/[0.16] via-white/[0.05] to-white/[0.09] p-[1.5px] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.95),0_0_70px_-20px_rgba(124,58,237,0.4)]">
          <div className="relative overflow-hidden rounded-[41px] bg-[#08080c] p-2.5">
            {/* Screen */}
            <div className="relative overflow-hidden rounded-[33px] bg-gradient-to-b from-[#12101a] via-[#0b0a12] to-[#08080c]">
              {/* Artwork wash bleeding into the top of the screen */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-[58%] opacity-60"
                style={{
                  background:
                    'radial-gradient(120% 80% at 50% 0%, rgba(139,92,246,0.5), transparent 68%)',
                }}
              />

              {/* Status bar */}
              <div className="relative flex items-center justify-between px-5 pt-3.5 font-mono text-[9.5px] tracking-wide text-white/45">
                <span>9:41</span>
                <div className="absolute left-1/2 top-2 h-4 w-16 -translate-x-1/2 rounded-full bg-black/90" />
                <span className="flex items-center gap-1">
                  <Waves className="size-2.5" aria-hidden />
                  LDAC
                </span>
              </div>

              {/* Now-playing header */}
              <div className="relative flex items-center justify-between px-5 pb-1 pt-4">
                <span className="font-mono text-[8.5px] uppercase tracking-[0.22em] text-white/35">
                  Now Playing
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-1.5 py-[2px] font-mono text-[8px] font-medium tracking-wider text-cyan-200">
                  <Sparkles className="size-2" aria-hidden />
                  HI-RES
                </span>
              </div>

              {/* Artwork + vinyl */}
              <div className="relative mx-5 mt-3 aspect-square">
                {/* Spinning vinyl peeking out behind the sleeve */}
                <div
                  className={cn(
                    'absolute right-[-10px] top-1/2 size-[74%] -translate-y-1/2 rounded-full',
                    'bg-[conic-gradient(from_0deg,#141420,#2a2a3d,#141420,#25253a,#141420)]',
                    'border border-white/10 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.9)]',
                    !reduced && 'animate-spin-slow',
                  )}
                  aria-hidden
                >
                  {/* Groove rings */}
                  <div className="absolute inset-[12%] rounded-full border border-white/[0.06]" />
                  <div className="absolute inset-[24%] rounded-full border border-white/[0.05]" />
                  <div className="absolute inset-[36%] rounded-full border border-white/[0.04]" />
                  <div className="absolute inset-[43%] rounded-full bg-gradient-to-br from-violet-400 to-cyan-400" />
                  <div className="absolute left-1/2 top-1/2 size-[5%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#08080c]" />
                </div>

                {/* Album sleeve */}
                <div className="absolute inset-0 z-10 overflow-hidden rounded-2xl border border-white/12 shadow-[0_20px_50px_-16px_rgba(0,0,0,0.95)]">
                  <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_18%_12%,#a78bfa,transparent_58%),radial-gradient(110%_110%_at_88%_28%,#22d3ee,transparent_55%),radial-gradient(130%_130%_at_54%_98%,#ec4899,transparent_62%)]" />
                  <div className="absolute inset-0 bg-[#0a0a12]/35" />
                  {/* Animated canvas artwork stand-in */}
                  <div
                    className={cn(
                      'absolute inset-0 opacity-45 mix-blend-screen',
                      !reduced && 'animate-spin-slow',
                    )}
                    style={{
                      background:
                        'conic-gradient(from 90deg, transparent, rgba(255,255,255,0.28), transparent 55%)',
                    }}
                    aria-hidden
                  />
                  {/* Waveform signature across the sleeve */}
                  <div className="absolute inset-x-4 bottom-4 flex h-10 items-end gap-[3px]">
                    {EQ_BARS.map((h, i) => (
                      <span
                        key={i}
                        className={cn(
                          'flex-1 origin-bottom rounded-full bg-white/70',
                          !reduced && 'animate-waveform',
                        )}
                        style={{
                          height: `${h * 100}%`,
                          animationDelay: `${(i % 9) * 0.11}s`,
                        }}
                      />
                    ))}
                  </div>
                  <span className="absolute left-4 top-4 font-mono text-[8px] uppercase tracking-[0.2em] text-white/70">
                    Canvas
                  </span>
                </div>
              </div>

              {/* Track meta */}
              <div className="relative px-5 pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold tracking-[-0.01em] text-white">
                      Midnight Wire
                    </p>
                    <p className="truncate text-[11.5px] text-white/45">
                      Aurelia Vance · Signal Bloom
                    </p>
                  </div>
                  <Heart className="mt-1 size-4 shrink-0 fill-pink-500/80 text-pink-400" aria-hidden />
                </div>
              </div>

              {/* Syllable-synced lyrics */}
              <div className="relative mx-5 mt-3.5 h-[62px] overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2">
                <div className="flex flex-col gap-1">
                  {LYRIC_LINES.map((line, li) => {
                    const isActive = li === activeLine
                    return (
                      <motion.p
                        key={li}
                        className="flex flex-wrap gap-x-[4px] text-[11.5px] font-medium leading-[1.35]"
                        animate={{
                          opacity: isActive ? 1 : 0.24,
                          filter: isActive ? 'blur(0px)' : 'blur(0.6px)',
                        }}
                        transition={{ duration: 0.35 }}
                      >
                        {line.words.map((w, wi) => {
                          const sung = isActive ? wi <= wordInLine : li < activeLine
                          return (
                            <motion.span
                              key={wi}
                              animate={{
                                color: sung ? 'rgb(255,255,255)' : 'rgba(255,255,255,0.42)',
                                y: isActive && wi === wordInLine ? -1.5 : 0,
                              }}
                              transition={{ duration: 0.18 }}
                              className={cn(
                                isActive &&
                                  wi === wordInLine &&
                                  'drop-shadow-[0_0_10px_rgba(34,211,238,0.85)]',
                              )}
                            >
                              {w.text}
                            </motion.span>
                          )
                        })}
                      </motion.p>
                    )
                  })}
                </div>
                {/* Bottom fade so the third line reads as continuing off-panel. */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-[#0b0a12] to-transparent" />
              </div>

              {/* Scrubber */}
              <div className="relative px-5 pt-3.5">
                <div className="relative h-[3px] w-full overflow-hidden rounded-full bg-white/12">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-400 via-cyan-300 to-cyan-200"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between font-mono text-[8.5px] tabular-nums text-white/40">
                  <span>{fmt(elapsed)}</span>
                  <span>-{fmt(DURATION - elapsed)}</span>
                </div>
              </div>

              {/* Transport */}
              <div className="relative flex items-center justify-between px-6 pt-2.5">
                <Shuffle className="size-3.5 text-white/40" aria-hidden />
                <SkipBack className="size-4 fill-white/85 text-white/85" aria-hidden />
                <div className="relative grid size-11 place-items-center rounded-full bg-white text-[#0a0a0f] shadow-[0_6px_20px_-4px_rgba(255,255,255,0.45)]">
                  <Pause className="size-4 fill-current" aria-hidden />
                  {!reduced ? (
                    <span
                      className="absolute inset-0 rounded-full border border-white/50 animate-pulse-ring"
                      aria-hidden
                    />
                  ) : null}
                </div>
                <SkipForward className="size-4 fill-white/85 text-white/85" aria-hidden />
                <Repeat className="size-3.5 text-white/40" aria-hidden />
              </div>

              {/* Audiophile stats HUD */}
              <div className="relative mx-5 mb-4 mt-4 rounded-xl border border-white/[0.08] bg-black/45 p-2.5 backdrop-blur-xl">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/40">
                    Stats for nerds
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-[8px] text-emerald-300">
                    <span className="size-1 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.7)]" />
                    UPGRADED
                  </span>
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {STATS.map((s) => (
                    <div key={s.label} className="flex flex-col">
                      <dt className="font-mono text-[7.5px] uppercase tracking-wider text-white/35">
                        {s.label}
                      </dt>
                      <dd className="font-mono text-[9.5px] font-medium text-cyan-200">
                        {s.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Frosted nav bar (Haze-style, as shipped in v1.4.1) */}
              <div className="relative flex items-center justify-around border-t border-white/[0.07] bg-white/[0.04] px-6 py-2.5 backdrop-blur-xl">
                <Disc3 className="size-4 text-white/80" aria-hidden />
                <ListMusic className="size-4 text-white/35" aria-hidden />
                <Waves className="size-4 text-white/35" aria-hidden />
              </div>
            </div>
          </div>

          {/* Screen edge specular */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[42px] bg-gradient-to-tr from-transparent via-white/[0.06] to-transparent"
          />
        </div>

        {/* Floating side chips — sell the "upgrade mid-playback" story */}
        <motion.div
          className="absolute -left-8 top-[24%] hidden rounded-xl glass-strong px-3 py-2 shadow-2xl sm:block"
          initial={{ opacity: 0, x: -14 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.5 }}
          style={{ transform: 'translateZ(60px)' }}
        >
          <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/40">Opus</p>
          <p className="font-mono text-[10.5px] font-medium text-white/85">first frame</p>
          <p className="font-mono text-[8.5px] text-emerald-300">~180 ms</p>
        </motion.div>

        <motion.div
          className="absolute -right-7 bottom-[27%] hidden rounded-xl glass-strong px-3 py-2 shadow-2xl sm:block"
          initial={{ opacity: 0, x: 14 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.68 }}
          style={{ transform: 'translateZ(60px)' }}
        >
          <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/40">FLAC</p>
          <p className="font-mono text-[10.5px] font-medium text-white/85">promoted</p>
          <p className="font-mono text-[8.5px] text-cyan-300">no re-buffer</p>
        </motion.div>
      </motion.div>
    </div>
  )
}
