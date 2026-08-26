'use client'

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { ArrowDownToLine, ArrowUpRight, Github, History, Sparkles, Star } from 'lucide-react'
import { AudioCanvas } from '@/components/ui/audio-canvas'
import { PhoneShowcase } from '@/components/ui/phone-showcase'
import { MagneticButton } from '@/components/ui/magnetic-button'
import { LiveMetric } from '@/components/ui/live-metric'
import { Skeleton } from '@/components/ui/skeleton'
import { Reveal } from '@/components/ui/reveal'
import { useTelemetry } from '@/components/telemetry-provider'
import { RELEASES_URL, REPO_URL, resolveDownload } from '@/lib/github'

export function Hero() {
  const { data } = useTelemetry()
  const reduced = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)

  // Parallax: the canvas and phone drift at different rates as the hero leaves.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const canvasY = useTransform(scrollYProgress, [0, 1], ['0%', '32%'])
  const phoneY = useTransform(scrollYProgress, [0, 1], ['0%', '-14%'])
  const copyY = useTransform(scrollYProgress, [0, 1], ['0%', '22%'])
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0])

  const latest = data?.latest ?? null
  const tag = latest?.tag
  const releaseCount = data?.releaseCount ?? null
  const stars = data?.repo?.stars ?? null
  const download = resolveDownload(latest)

  return (
    <section id="top" ref={sectionRef} className="relative overflow-hidden pb-20 pt-32 sm:pb-28 sm:pt-40">
      {/* Interactive audio spectrum field. */}
      <motion.div
        className="pointer-events-none absolute inset-0 -z-10"
        style={reduced ? undefined : { y: canvasY, opacity: fade }}
      >
        <AudioCanvas className="absolute inset-0 size-full" />
      </motion.div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-10">
        {/* ------------------------------ copy ------------------------------ */}
        <motion.div
          className="flex flex-col items-center text-center lg:items-start lg:text-left"
          style={reduced ? undefined : { y: copyY }}
        >
          {/* Announcement pill */}
          <Reveal>
            <a
              href={latest?.htmlUrl ?? RELEASES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2.5 rounded-full glass px-3 py-1.5 text-[12.5px] transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06]"
            >
              <span className="relative flex size-1.5 shrink-0">
                <span className="absolute inset-0 rounded-full bg-cyan-400" />
                <span className="absolute inset-0 animate-ping rounded-full bg-cyan-400" />
              </span>
              <Sparkles className="size-3.5 shrink-0 text-violet-300" aria-hidden />
              <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                {tag ? (
                  <span className="shimmer-text font-mono font-medium">{tag} Released</span>
                ) : (
                  <Skeleton className="h-3 w-24" />
                )}
                <span className="text-white/20" aria-hidden>
                  •
                </span>
                <span className="text-white/55">
                  Total Releases:{' '}
                  {releaseCount === null ? (
                    <Skeleton className="h-3 w-4" />
                  ) : (
                    <span className="font-mono text-white/80">{releaseCount}</span>
                  )}
                </span>
                <span className="text-white/20" aria-hidden>
                  •
                </span>
                <span className="text-white/55">Lossless FLAC Engine</span>
              </span>
              <ArrowUpRight
                className="size-3 shrink-0 text-white/40 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </a>
          </Reveal>

          {/* Display headline */}
          <Reveal delay={0.08}>
            <h1 className="mt-7 max-w-[18ch] text-balance text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-[4.1rem]">
              <span className="text-gradient">Instant Stream.</span>
              <br />
              <span className="text-gradient">Seamless Lossless.</span>
              <br />
              <span className="text-white/25">No Compromise.</span>
            </h1>
          </Reveal>

          {/* Sub-headline */}
          <Reveal delay={0.16}>
            <p className="mt-6 max-w-xl text-pretty text-[15px] leading-relaxed text-white/50 sm:text-[16.5px]">
              The open-source YouTube Music powerhouse that starts playback instantly in Opus, then
              auto-promotes your track to pristine Hi-Res FLAC mid-playback — without a single
              hitch.
            </p>
          </Reveal>

          {/* CTAs */}
          <Reveal delay={0.24}>
            <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <MagneticButton
                href={download.url}
                external
                download={download.isDirect}
                className="!px-6 !py-3.5"
                aria-label={
                  download.isDirect
                    ? `Download BitChord APK ${tag ?? 'latest'}, ${download.size}`
                    : 'View BitChord releases on GitHub'
                }
              >
                <ArrowDownToLine className="size-4 transition-transform duration-300 group-hover/btn:translate-y-0.5" aria-hidden />
                <span>Download Latest APK{tag ? ` (${tag})` : ''}</span>
                {download.isDirect ? (
                  <span className="ml-1 rounded-full bg-black/10 px-2 py-0.5 font-mono text-[10.5px] font-medium text-black/55">
                    {download.size}
                  </span>
                ) : null}
              </MagneticButton>

              <MagneticButton
                href={RELEASES_URL}
                external
                variant="secondary"
                className="!px-5 !py-3.5"
              >
                <History className="size-4" aria-hidden />
                <span>
                  View Releases
                  {releaseCount !== null ? ` (${releaseCount} Builds)` : ''}
                </span>
              </MagneticButton>
            </div>
          </Reveal>

          {/* Tertiary CTA + trust line */}
          <Reveal delay={0.32}>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 lg:justify-start">
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 text-[13.5px] text-white/55 transition-colors hover:text-white"
              >
                <Github className="size-4" aria-hidden />
                <span>Star on GitHub</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[11.5px] text-amber-300">
                  <Star className="size-2.5 fill-amber-300" aria-hidden />
                  <LiveMetric value={stars} digits={3} />
                </span>
              </a>

              <span className="hidden h-3 w-px bg-white/10 sm:block" aria-hidden />

              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/30">
                Android 8.0+ · No ads · No tracking
              </p>
            </div>
          </Reveal>
        </motion.div>

        {/* ----------------------------- showcase ---------------------------- */}
        <motion.div
          className="relative"
          style={reduced ? undefined : { y: phoneY }}
          initial={{ opacity: 0, scale: 0.92, rotateY: -12 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ type: 'spring', stiffness: 70, damping: 20, delay: 0.2 }}
        >
          <PhoneShowcase />
        </motion.div>
      </div>
    </section>
  )
}
