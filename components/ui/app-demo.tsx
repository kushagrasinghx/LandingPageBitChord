'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The real app, running.
 *
 * This replaced a hand-built phone mockup. The mockup had to invent every
 * detail it showed — a fake status bar, invented bit depth, a spinning vinyl the
 * app does not have — and the further it went the more it was selling something
 * that did not exist. A screen recording cannot lie about the product.
 *
 * The recording is a portrait capture that already includes the device's own
 * status and gesture bars, so it reads as a phone screen without a drawn bezel
 * around it. It carries no audio track (stripped at encode) — a hero that makes
 * noise is a hero people close.
 *
 * Under `prefers-reduced-motion` nothing plays on its own: the poster frame
 * stands in until the visitor asks for it. Autoplay is also not guaranteed even
 * without that — some browsers refuse it on metered connections — so the play
 * affordance is driven by whether the element is actually paused rather than by
 * assuming the `autoPlay` attribute won.
 */
export function AppDemo({ className }: { className?: string }) {
  const reduced = useReducedMotion()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [paused, setPaused] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const sync = () => setPaused(video.paused)

    // `playing` matters as much as `play` here. The element carries the native
    // `autoPlay` attribute, so the browser can start it during hydration —
    // before this effect ever runs — and the one `play` event is gone by the
    // time we subscribe. Re-reading `video.paused` on `playing`, and again once
    // the `play()` promise settles, covers that race; without it the overlay
    // sits on top of a video that is visibly running.
    video.addEventListener('play', sync)
    video.addEventListener('playing', sync)
    video.addEventListener('pause', sync)
    sync()

    if (!reduced) {
      // `play()` rejects when the browser blocks autoplay. That is a supported
      // outcome, not an error: `sync` then leaves the poster and the play
      // button in place.
      void video.play().then(sync, sync)
    }

    return () => {
      video.removeEventListener('play', sync)
      video.removeEventListener('playing', sync)
      video.removeEventListener('pause', sync)
    }
  }, [reduced])

  // The cap matches the hero's demo column exactly, so on large screens the
  // video fills that column with no side gap, and on small ones it simply
  // centres rather than growing into a full-width portrait wall.
  return (
    <div className={cn('relative mx-auto w-full max-w-[330px]', className)}>
      <video
        ref={videoRef}
        // `poster` covers the gap before the first frame decodes, so the hero
        // never lays out around an empty box.
        poster="/bitchord-demo-poster.jpg"
        width={540}
        height={1170}
        loop
        muted
        playsInline
        autoPlay={!reduced}
        preload="metadata"
        aria-label="BitChord playing a track, then opening its word-synced lyrics panel"
        className="block w-full rounded-[34px] border border-line bg-surface shadow-[0_50px_100px_-40px_rgba(0,0,0,0.9)]"
      >
        <source src="/bitchord-demo.mp4" type="video/mp4" />
      </video>

      {/* Shown whenever the video is not running — reduced motion, blocked
          autoplay, or the visitor paused it themselves. */}
      {paused ? (
        <button
          type="button"
          onClick={() => void videoRef.current?.play()}
          className="absolute inset-0 grid place-items-center rounded-[34px] bg-black/35 transition-colors hover:bg-black/25"
          aria-label="Play the BitChord demo"
        >
          <span className="grid size-14 place-items-center rounded-full bg-white text-canvas shadow-[0_8px_30px_-6px_rgba(0,0,0,0.6)]">
            <Play className="ml-0.5 size-5 fill-current" aria-hidden />
          </span>
        </button>
      ) : null}
    </div>
  )
}
