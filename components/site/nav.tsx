'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { ArrowDownToLine, Github, Menu, Star, X } from 'lucide-react'
import { MagneticButton } from '@/components/ui/magnetic-button'
import { LiveMetric } from '@/components/ui/live-metric'
import { WaveformMark } from '@/components/ui/waveform-mark'
import { useTelemetry } from '@/components/telemetry-provider'
import { REPO_URL, resolveDownload } from '@/lib/github'
import { cn } from '@/lib/utils'

const LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Audio Engine', href: '#audio-engine' },
  { label: 'Releases', href: '#releases' },
  { label: 'Tech Stack', href: '#tech-stack' },
] as const

export function Nav() {
  const { data } = useTelemetry()
  const [open, setOpen] = useState(false)
  const [condensed, setCondensed] = useState(false)
  const { scrollY, scrollYProgress } = useScroll()
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  const stars = data?.repo?.stars ?? null
  const download = resolveDownload(data?.latest ?? null)
  const tag = data?.latest?.tag

  // Tighten the header once the user has committed to scrolling.
  useEffect(() => {
    const unsub = scrollY.on('change', (v) => setCondensed(v > 24))
    return () => unsub()
  }, [scrollY])

  // Close the mobile sheet on Escape, and lock scroll while it's open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:pt-5">
      <motion.nav
        className={cn(
          'relative flex w-full max-w-6xl items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-500',
          '[transition-timing-function:var(--ease-out-expo)]',
          condensed
            ? 'glass-strong shadow-[0_18px_50px_-24px_rgba(0,0,0,0.9)]'
            : 'border border-transparent bg-transparent',
        )}
      >
        {/* Scroll progress hairline along the bottom edge of the bar. */}
        <motion.span
          aria-hidden
          className="absolute inset-x-3 bottom-0 h-px origin-left rounded-full bg-gradient-to-r from-violet-500 via-cyan-400 to-pink-500"
          style={{ width: progressWidth, opacity: condensed ? 0.8 : 0 }}
        />

        {/* Brand */}
        <a href="#top" className="group flex items-center gap-2.5 pr-1" aria-label="BitChord home">
          <WaveformMark />
          <span className="flex flex-col leading-none">
            <span className="text-[15px] font-bold tracking-[-0.02em] text-white">BitChord</span>
            <span className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-white/35">
              Hi-Res Client
            </span>
          </span>
        </a>

        {/* Desktop links */}
        <div className="ml-2 hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative rounded-lg px-3 py-2 text-[13.5px] text-white/55 transition-colors duration-300 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Live star button */}
          <a
            href={`${REPO_URL}/stargazers`}
            target="_blank"
            rel="noopener noreferrer"
            className="group hidden items-center gap-2 rounded-full glass px-3 py-2 text-[13px] text-white/75 transition-all duration-300 hover:bg-white/[0.07] hover:text-white sm:inline-flex"
          >
            <Star
              className="size-3.5 text-amber-300 transition-transform duration-300 group-hover:scale-110 group-hover:fill-amber-300"
              aria-hidden
            />
            <span className="hidden md:inline">Star</span>
            <span className="h-3.5 w-px bg-white/15" aria-hidden />
            <LiveMetric value={stars} digits={3} className="font-mono text-[12.5px]" />
          </a>

          {/* Primary CTA */}
          <MagneticButton
            href={download.url}
            external
            download={download.isDirect}
            strength={4}
            className="!px-4 !py-2 !text-[13px]"
            aria-label={
              download.isDirect ? `Download BitChord APK ${tag ?? ''}` : 'View BitChord releases'
            }
          >
            <ArrowDownToLine className="size-3.5" aria-hidden />
            Get APK
          </MagneticButton>

          {/* Mobile trigger */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="grid size-9 place-items-center rounded-xl glass text-white/70 transition-colors hover:text-white lg:hidden"
          >
            {open ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile sheet */}
      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed inset-x-4 top-[5.5rem] z-50 overflow-hidden rounded-2xl glass-strong p-2 lg:hidden"
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            >
              <div className="flex items-center justify-between px-2 pb-2 pt-1">
                <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-white/35">
                  Navigate
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="grid size-7 place-items-center rounded-lg text-white/50 hover:bg-white/5 hover:text-white"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </div>
              <div className="flex flex-col">
                {LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-3 py-3 text-[15px] text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
                  >
                    {link.label}
                  </a>
                ))}
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="mt-1 flex items-center gap-2 rounded-xl px-3 py-3 text-[15px] text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <Github className="size-4" aria-hidden />
                  GitHub
                  <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[12px] text-amber-300">
                    <Star className="size-3 fill-amber-300" aria-hidden />
                    <LiveMetric value={stars} digits={3} />
                  </span>
                </a>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </header>
  )
}
