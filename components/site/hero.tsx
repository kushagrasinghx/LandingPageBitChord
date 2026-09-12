'use client'

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { ArrowDownToLine, ArrowUpRight, Github, History, Star } from 'lucide-react'
import { FaAndroid, FaLinux, FaTv, FaWindows } from 'react-icons/fa'
import { AppDemo } from '@/components/ui/app-demo'
import { MagneticButton } from '@/components/ui/magnetic-button'
import { LiveMetric } from '@/components/ui/live-metric'
import { Skeleton } from '@/components/ui/skeleton'
import { Reveal } from '@/components/ui/reveal'
import { useTelemetry } from '@/components/telemetry-provider'
import { RELEASES_URL, REPO_URL, resolveDownload } from '@/lib/github'
import { cn } from '@/lib/utils'

/**
 * Where BitChord runs, and where it is going.
 *
 * Android is the only one that ships today; the other three are stated as
 * planned rather than implied as available, so the grid cannot be read as a
 * claim the product does not support yet.
 */
const PLATFORMS = [
  { name: 'Android', status: 'Available now', shipped: true, icon: FaAndroid },
  { name: 'Android TV', status: 'Coming soon', shipped: false, icon: FaTv },
  { name: 'Windows', status: 'Coming soon', shipped: false, icon: FaWindows },
  { name: 'Linux', status: 'Coming soon', shipped: false, icon: FaLinux },
] as const

export function Hero() {
  const { data } = useTelemetry()
  const reduced = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)

  // Parallax: the copy and the demo drift at different rates as the hero leaves.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const demoY = useTransform(scrollYProgress, [0, 1], ['0%', '-14%'])
  const copyY = useTransform(scrollYProgress, [0, 1], ['0%', '22%'])

  const latest = data?.latest ?? null
  const tag = latest?.tag
  const releaseCount = data?.releaseCount ?? null
  const stars = data?.repo?.stars ?? null
  const download = resolveDownload(latest)

  return (
    <section id="top" ref={sectionRef} className="relative overflow-hidden pb-20 pt-16 sm:pb-28 sm:pt-20">
      {/*
        A film of noise, so the flat black has some tooth to it rather than
        reading as a dead void. The grid that used to sit here as well is gone:
        the page-wide one in <Backdrop /> now draws at the same strength, and
        two 64px grids stacked — one fixed, one scrolling with the section —
        slid past each other into a moiré.
      */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 noise opacity-[0.045]" />
      </div>

      {/* The demo column is sized to the video, not the other way round, so the
          video fills it with no side gap at either breakpoint. */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,330px)] lg:gap-14">
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
                <span className="absolute inset-0 rounded-full bg-white" />
                <span className="absolute inset-0 animate-ping rounded-full bg-white" />
              </span>
              {tag ? (
                <span className="shimmer-text font-mono font-medium">{tag} Released</span>
              ) : (
                <Skeleton className="h-3 w-24" />
              )}
              <ArrowUpRight
                className="size-3 shrink-0 text-white/40 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </a>
          </Reveal>

          {/* Display headline */}
          <Reveal delay={0.08}>
            <h1 className="mt-7 max-w-[18ch] text-balance text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-[4.1rem]">
              <span className="text-white">Instant Stream.</span>
              <br />
              <span className="text-white/45">No Compromise.</span>
            </h1>
          </Reveal>

          {/* Sub-headline */}
          <Reveal delay={0.16}>
            <p className="mt-6 max-w-xl text-pretty text-[15px] leading-relaxed text-white/50 sm:text-[16.5px]">
              The open-source YouTube Music client for people who actually listen.
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
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[11.5px] text-white/75">
                  <Star className="size-2.5 fill-white/75" aria-hidden />
                  <LiveMetric value={stars} digits={3} separator={false} />
                </span>
              </a>

              <span className="hidden h-3 w-px bg-white/10 sm:block" aria-hidden />

              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/30">
                Android 8.0+ · No ads · No tracking
              </p>
            </div>
          </Reveal>

          {/* Platform availability */}
          {/* `w-full` on the Reveal itself: it is a flex item of a column that
              is `items-start` at lg, so without this it shrink-to-fits and the
              grid's own max-width never gets a chance to apply. */}
          <Reveal delay={0.4} className="w-full">
            <ul className="mx-auto mt-8 grid w-full max-w-[520px] grid-cols-2 gap-2.5 lg:mx-0">
              {PLATFORMS.map(({ name, status, shipped, icon: Icon }) => (
                <li
                  key={name}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl border border-line px-4 py-3.5',
                    // Shipped reads forward, planned reads back. The difference
                    // is luminance only — the row order already carries rank.
                    shipped ? 'bg-white/[0.05]' : 'bg-transparent',
                  )}
                >
                  <Icon
                    className={cn('size-6 shrink-0', shipped ? 'text-white' : 'text-white/35')}
                    aria-hidden
                  />
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span
                      className={cn(
                        'truncate text-[14.5px] font-semibold',
                        shipped ? 'text-white' : 'text-white/55',
                      )}
                    >
                      {name}
                    </span>
                    <span className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-white/35">
                      {status}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </motion.div>

        {/* ----------------------------- showcase ---------------------------- */}
        <motion.div
          className="relative"
          style={reduced ? undefined : { y: demoY }}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 70, damping: 20, delay: 0.2 }}
        >
          <AppDemo />
        </motion.div>
      </div>
    </section>
  )
}
