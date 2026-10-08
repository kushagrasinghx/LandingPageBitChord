'use client'

import { useEffect, useRef, useState } from 'react'
import { BitChordLyricsScreen } from '@/components/ui/bitchord-lyrics-screen'
import { DownloadButtons } from '@/components/site/download-buttons'
import { RELEASES_URL, type resolveDownload } from '@/lib/github'
import type { DemoLyrics } from '@/lib/lyrics-demo'

/** The phone's screen, in CSS px (the app's dp, 1:1). */
const SCREEN_W = 390
/** Bezel around the screen. */
const BEZEL = 11
const FRAME_W = SCREEN_W + BEZEL * 2

/** Live count of people with the app open, from BitChord's own API. */
const LIVE_STATS_URL = 'https://api.bitchord.kushagrasingh.in/api/stats/live'
/** The endpoint caches for 15s; polling at twice that is plenty. */
const LIVE_POLL_MS = 30_000

/**
 * People using BitChord right now, refreshed while the tab is visible.
 * Null until the first reading arrives, and if the API cannot be reached.
 */
function useOnlineUsers(): number | null {
  const [online, setOnline] = useState<number | null>(null)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let cancelled = false

    const poll = async () => {
      try {
        const res = await fetch(LIVE_STATS_URL, { cache: 'no-store' })
        if (res.ok) {
          const data = (await res.json()) as { online?: unknown }
          if (!cancelled && typeof data.online === 'number') setOnline(data.online)
        }
      } catch {
        // Keep the last reading; the line simply stops updating.
      }
      if (!cancelled && document.visibilityState === 'visible') timer = setTimeout(poll, LIVE_POLL_MS)
    }

    const onVisibility = () => {
      clearTimeout(timer)
      if (document.visibilityState === 'visible') poll()
    }

    poll()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelled = true
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return online
}

/** Every platform with a build, each linking to the releases page. */
const PLATFORMS = ['Android', 'Windows', 'Linux', 'macOS'] as const

/** How far down the phone shows before the container cuts it off. */
const VISIBLE = 560

/**
 * The hero: the tagline and the two calls to action, over the BitChord player
 * — lyrics open — in a phone that runs off the bottom of a rounded panel. Sits
 * in the page column like every other section.
 *
 * The phone is laid out at its real size and scaled down to fit narrow
 * screens, so the lyrics keep the app's exact metrics at any width.
 */
export function PhoneHero({
  lyrics,
  tag,
  download,
  stars,
  totalDownloads,
}: {
  lyrics: DemoLyrics
  tag: string | null
  download: ReturnType<typeof resolveDownload>
  stars: number | null
  /** Downloads summed across every release asset; 0 when GitHub was unreachable. */
  totalDownloads: number
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const online = useOnlineUsers()

  useEffect(() => {
    const box = boxRef.current
    if (!box) return
    const fit = () => setScale(Math.min(1, (box.clientWidth - 32) / FRAME_W))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(box)
    // The mesh drift stops while the hero is scrolled out of view.
    const io = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) delete box.dataset.paused
      else box.dataset.paused = ''
    })
    io.observe(box)
    return () => {
      ro.disconnect()
      io.disconnect()
    }
  }, [])

  return (
    <section className="page-container pt-6" aria-label="BitChord">
      <div
        ref={boxRef}
        className="relative isolate overflow-hidden rounded-3xl bg-[#060504] shadow-[inset_0_0_0_0.8px_rgb(255_255_255/0.1)]"
      >
        <MeshGradient />

        {/* ------------------------- tagline + actions ------------------------ */}
        <div className="relative flex flex-col items-center px-6 pb-12 pt-14 text-center sm:pt-16">
          <h1 className="text-balance text-[34px] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[48px]">
            <span className="text-white">Instant Stream.</span>{' '}
            <span className="text-white/45">No Compromise.</span>
          </h1>

          <div className="mt-7">
            <DownloadButtons tag={tag} download={download} stars={stars} />
          </div>

          {/* Each part is left out rather than shown as "0" when its source failed. */}
          {totalDownloads > 0 || online !== null ? (
            <p className="mt-5 text-[13px] text-white/50">
              {/* The numbers lit to match the platform links below; the words stay muted. */}
              {totalDownloads > 0 ? (
                <>
                  <span className="text-white/80">{totalDownloads.toLocaleString('en-US')}</span> total downloads
                </>
              ) : null}
              {totalDownloads > 0 && online !== null ? <span aria-hidden> · </span> : null}
              {online !== null ? (
                <>
                  <span className="text-white/80">{online.toLocaleString('en-US')}</span> listening now
                </>
              ) : null}
            </p>
          ) : null}
          <p className={totalDownloads > 0 || online !== null ? 'mt-1 text-[13px] text-white/50' : 'mt-5 text-[13px] text-white/50'}>
            Available on{' '}
            {PLATFORMS.map((name, i) => (
              <span key={name}>
                <a
                  href={RELEASES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  {name}
                </a>
                {i < PLATFORMS.length - 2 ? ', ' : i === PLATFORMS.length - 2 ? ' and ' : ''}
              </span>
            ))}
          </p>
        </div>

        {/* ------------------- the phone, cut off by the panel ------------------- */}
        <div className="relative" style={{ height: VISIBLE * scale }}>
          <div
            className="absolute left-1/2 top-0 origin-top"
            style={{ transform: `translateX(-50%) scale(${scale})` }}
          >
            {/* Device: a thin metal edge, black bezel, and the screen inside it. */}
            <div
              className="rounded-[58px] bg-[#1b1b1d] p-[2px] shadow-[0_40px_120px_rgb(0_0_0/0.6),inset_0_0_0_1px_rgb(255_255_255/0.14)]"
              style={{ width: FRAME_W + 4 }}
            >
              <div className="rounded-[56px] bg-black" style={{ padding: BEZEL }}>
                <div className="overflow-hidden rounded-[46px]">
                  <BitChordLyricsScreen lyrics={lyrics} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Fields of colour from the cover — amber, burnt orange, olive — kept on the
 * dark side and drifting on long, unrelated loops so the blend never visibly
 * repeats.
 *
 * Built to cost nothing per frame: each field is a soft multi-stop radial
 * gradient (soft enough to need no blur filter) on its own compositor layer,
 * and only its transform animates — so the GPU just moves finished layers. A
 * CSS blur over moving children would be recomputed on every frame instead,
 * which is what made this stutter on phones. The drift pauses while the hero
 * is off screen (see `data-paused`) and under reduced motion.
 */
const MESH = [
  { color: '74 42 6', size: 820, left: '-14%', top: '-22%', anim: 'mesh-drift-a 26s' },
  { color: '58 29 5', size: 720, left: '56%', top: '-12%', anim: 'mesh-drift-b 31s' },
  { color: '42 36 8', size: 700, left: '16%', top: '40%', anim: 'mesh-drift-c 22s' },
  { color: '61 34 7', size: 760, left: '60%', top: '46%', anim: 'mesh-drift-b 34s reverse' },
] as const

function MeshGradient() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {MESH.map((blob, i) => (
        <div
          key={i}
          className="mesh-blob absolute rounded-full"
          style={{
            width: blob.size,
            height: blob.size,
            left: blob.left,
            top: blob.top,
            // Several stops on an eased falloff read as blurred without a filter.
            background: `radial-gradient(closest-side, rgb(${blob.color} / 0.95) 0%, rgb(${blob.color} / 0.7) 25%, rgb(${blob.color} / 0.38) 50%, rgb(${blob.color} / 0.12) 75%, rgb(${blob.color} / 0) 100%)`,
            animation: `${blob.anim} ease-in-out infinite alternate`,
          }}
        />
      ))}
      {/* Keeps the whole field on the dark side, deepest at the edges. */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(120% 90% at 50% 40%, transparent 30%, rgb(0 0 0 / 0.55) 100%)' }}
      />
    </div>
  )
}
