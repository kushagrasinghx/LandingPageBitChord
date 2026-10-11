'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowDownToLine } from 'lucide-react'
import { LATEST_RELEASE_URL, formatBytes, type Release } from '@/lib/github'
import { cn } from '@/lib/utils'

type Blob = { color: string; left: string; top: string; size: number }

/** Blue and white mesh per slide, drawn from each screenshot's own tones. */
const SLIDES: { src: string; label: string; mesh: Blob[] }[] = [
  {
    src: '/tv/now-playing.webp',
    label: 'Now Playing',
    mesh: [
      { color: '22 54 108', left: '-12%', top: '-30%', size: 700 },
      { color: '92 108 140', left: '58%', top: '-22%', size: 520 },
      { color: '12 32 70', left: '8%', top: '50%', size: 640 },
      { color: '40 78 132', left: '62%', top: '48%', size: 600 },
    ],
  },
  {
    src: '/tv/lyrics.webp',
    label: 'Synced lyrics',
    mesh: [
      { color: '20 50 102', left: '52%', top: '-34%', size: 720 },
      { color: '100 114 146', left: '-8%', top: '8%', size: 480 },
      { color: '34 70 122', left: '30%', top: '52%', size: 660 },
      { color: '10 28 62', left: '72%', top: '40%', size: 560 },
    ],
  },
  {
    src: '/tv/lyrics-pride.webp',
    label: 'Synced lyrics',
    mesh: [
      { color: '96 110 142', left: '-6%', top: '-30%', size: 640 },
      { color: '26 60 114', left: '56%', top: '30%', size: 680 },
      { color: '62 90 130', left: '22%', top: '44%', size: 560 },
      { color: '12 34 74', left: '66%', top: '-24%', size: 600 },
    ],
  },
  {
    src: '/tv/up-next.webp',
    label: 'Up Next',
    mesh: [
      { color: '104 116 148', left: '20%', top: '-36%', size: 640 },
      { color: '36 72 124', left: '-14%', top: '38%', size: 620 },
      { color: '72 96 136', left: '60%', top: '-8%', size: 520 },
      { color: '20 48 98', left: '48%', top: '54%', size: 700 },
    ],
  },
]

/** Where each blob rests; slides move it by transform, which never relayouts. */
const BASE = SLIDES[0].mesh
const px = (v: string) => parseFloat(v)

/**
 * Blobs keep their identity across slides, so colour and position glide.
 *
 * Only transform and colour animate (GPU-composited, no layout), and the whole
 * field pauses while the section is off screen.
 */
function TvMesh({ mesh, reduce, paused }: { mesh: Blob[]; reduce: boolean | null; paused: boolean }) {
  const t = reduce ? 'none' : 'transform 3s ease-in-out'
  // Eased falloff, like the hero's multi-stop gradients, so no edge shows.
  const mask =
    'radial-gradient(closest-side, #000 0%, rgb(0 0 0 / 0.7) 25%, rgb(0 0 0 / 0.38) 50%, rgb(0 0 0 / 0.12) 75%, transparent 100%)'
  const drift = ['mesh-drift-a 26s', 'mesh-drift-b 31s', 'mesh-drift-c 22s', 'mesh-drift-b 34s reverse']
  return (
    <div
      aria-hidden
      data-paused={paused || undefined}
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {mesh.map((b, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            width: b.size,
            height: b.size,
            left: BASE[i].left,
            top: BASE[i].top,
            // Container is ~1200 x 800: 1% of it, in px.
            transform: `translate3d(${(px(b.left) - px(BASE[i].left)) * 12}px, ${(px(b.top) - px(BASE[i].top)) * 8}px, 0)`,
            transition: t,
            willChange: 'transform',
          }}
        >
          <div
            className="mesh-blob size-full rounded-full"
            style={{
              backgroundColor: `rgb(${b.color})`,
              maskImage: mask,
              WebkitMaskImage: mask,
              transition: reduce ? 'none' : 'background-color 3s ease-in-out',
              animation: `${drift[i % drift.length]} ease-in-out infinite alternate`,
            }}
          />
        </div>
      ))}
      {/* Blur layer over the blobs, so no circle edge reads. Dropped while paused. */}
      {paused ? null : <div className="absolute inset-0 backdrop-blur-[60px]" />}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(120% 90% at 50% 40%, transparent 30%, rgb(0 0 0 / 0.55) 100%)' }}
      />
    </div>
  )
}

const INTERVAL_MS = 5000

/** BitChord on Android TV, in a panel like the Replay section's. */
export function TvSection({ release }: { release: Release | null }) {
  const tv = release?.tvApk ?? null
  const tag = release?.tag ?? null
  const [index, setIndex] = useState(0)
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  // Nothing animates or ticks while the section is scrolled out of view.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: '80px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (reduce || !inView) return
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), INTERVAL_MS)
    return () => clearInterval(id)
  }, [reduce, inView, index])

  return (
    <section ref={ref} aria-labelledby="tv-title" className="page-container mt-10">
      <div className="relative isolate overflow-hidden rounded-3xl bg-[#0a0a0a] pb-8 pt-12 shadow-[inset_0_0_0_0.8px_rgb(255_255_255/0.1)] sm:pt-14">
        <TvMesh mesh={SLIDES[index].mesh} reduce={reduce} paused={!inView} />

        <div className="relative px-6 text-center">
          <h2 id="tv-title" className="text-[15px] font-medium text-white">
            Now on the big screen.
          </h2>
          <p className="mx-auto mt-1 max-w-[560px] text-balance text-[13px] leading-[18px] text-white/50">
            BitChord for TV puts full-screen artwork, synced lyrics and your queue in the living
            room, all driven from the remote.
          </p>
        </div>

        <div className="relative mx-auto mt-10 max-w-[760px] px-6">
          {/* TV: dark bezel, thin outer rim, and a stand beneath. */}
          <div className="rounded-[10px] bg-[#050505] p-[10px] shadow-[0_30px_70px_-20px_rgb(0_0_0/0.85),inset_0_0_0_1px_rgb(255_255_255/0.18),0_0_0_1px_rgb(0_0_0/0.9)] sm:p-3">
          <div className="relative aspect-video overflow-hidden bg-black shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]">
            <AnimatePresence initial={false}>
              <motion.div
                key={index}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.8, ease: 'easeInOut' }}
              >
                <Image
                  src={SLIDES[index].src}
                  alt={`BitChord on TV: ${SLIDES[index].label}`}
                  fill
                  sizes="(min-width: 800px) 712px, 100vw"
                  priority={index === 0}
                  className="object-cover"
                />
              </motion.div>
            </AnimatePresence>
            {/* Preload the rest so the crossfade never waits on the network. */}
            <div className="hidden">
              {SLIDES.slice(1).map((s) => (
                <Image key={s.src} src={s.src} alt="" width={1920} height={1080} />
              ))}
            </div>
          </div>
          </div>
          <div aria-hidden className="mx-auto h-2 w-24 rounded-b-md bg-gradient-to-b from-[#2a2a2a] to-[#0d0d0d] sm:w-32" />

          <div className="mt-6 flex flex-col items-center gap-2">
            <a
              href={tv?.downloadUrl ?? release?.htmlUrl ?? LATEST_RELEASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              download={tv ? '' : undefined}
              aria-label={tv ? `Download BitChord TV ${tag ?? ''}, ${formatBytes(tv.size)}` : 'View the latest BitChord TV release on GitHub'}
              className="group inline-flex h-11 items-center gap-2 rounded-full bg-white/90 px-5 text-[14px] font-semibold text-black transition-[background-color,box-shadow] duration-300 hover:bg-white hover:shadow-[0_0_24px_rgb(255_255_255/0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <ArrowDownToLine className="size-4 transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden />
              Download TV{tag ? ` ${tag}` : ''}
            </a>
            <p className="text-[12px] text-white/40">
              Universal APK for Android TV{tv ? ` · ${formatBytes(tv.size)}` : ''}
            </p>
          </div>

          <div className="mt-6 flex justify-center gap-2" role="tablist" aria-label="TV screenshots">
            {SLIDES.map((s, i) => (
              <button
                key={s.src}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={s.label}
                onClick={() => setIndex(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
                  i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/25 hover:bg-white/40',
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
