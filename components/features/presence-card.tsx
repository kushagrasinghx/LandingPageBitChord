'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Check, RefreshCw } from 'lucide-react'
import { cn, pct, secs } from '@/lib/utils'

const SERVICES = [
  { name: 'Last.fm', detail: 'scrobbled', accent: 'text-rose-300', dot: 'bg-rose-400' },
  { name: 'ListenBrainz', detail: 'submitted', accent: 'text-amber-300', dot: 'bg-amber-400' },
] as const

/**
 * Discord Rich Presence preview with a live elapsed timer, plus scrobble status
 * for the two services BitChord submits to.
 *
 * The timer starts at 0 and is only advanced from an effect, so the server-
 * rendered HTML and the first client render agree (a `Date.now()`-seeded clock
 * would hydrate-mismatch).
 */
export function PresenceCard() {
  const reduced = useReducedMotion()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (reduced) return
    const id = window.setInterval(() => setElapsed((s) => (s + 1) % 600), 1000)
    return () => window.clearInterval(id)
  }, [reduced])

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  return (
    <div className="flex h-full flex-col gap-3.5">
      {/* Discord presence card */}
      <div className="rounded-xl border border-white/[0.08] bg-[#1a1b23]/80 p-3.5 backdrop-blur-xl">
        <p className="mb-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-white/40">
          Listening to BitChord
        </p>

        <div className="flex gap-3">
          {/* Album art + small badge, mirroring Discord's asset layout. */}
          <div className="relative size-14 shrink-0">
            <div className="size-full overflow-hidden rounded-lg bg-[radial-gradient(120%_120%_at_20%_15%,#a78bfa,transparent_60%),radial-gradient(120%_120%_at_85%_80%,#22d3ee,transparent_58%),radial-gradient(110%_110%_at_50%_100%,#ec4899,transparent_60%)]">
              <div className="size-full bg-black/20" />
            </div>
            <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full border-2 border-[#1a1b23] bg-gradient-to-br from-violet-500 to-cyan-400">
              <span className="flex h-2 items-end gap-[1.5px]">
                {[0.5, 1, 0.65].map((h, i) => (
                  <span
                    key={i}
                    className={cn(
                      'w-[1.5px] origin-bottom rounded-full bg-white',
                      !reduced && 'animate-waveform',
                    )}
                    style={{ height: pct(h), animationDelay: secs(i * 0.15, 2) }}
                  />
                ))}
              </span>
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-semibold text-white">Midnight Wire</p>
            <p className="truncate text-[11px] text-white/55">by Aurelia Vance</p>
            <p className="truncate text-[11px] text-white/40">on Signal Bloom</p>

            {/* Elapsed bar */}
            <div className="mt-1.5 flex items-center gap-1.5">
              <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/12">
                <div
                  className="h-full rounded-full bg-white/70 transition-[width] duration-1000 ease-linear"
                  style={{ width: pct(elapsed / 600) }}
                />
              </div>
              <span className="font-mono text-[9px] tabular-nums text-white/45">
                {mm}:{ss}
              </span>
            </div>
          </div>
        </div>

        {/* Presence buttons — up to two, as the settings screen allows. */}
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {['Listen along', 'Get BitChord'].map((label) => (
            <span
              key={label}
              className="rounded-[3px] bg-[#4e5058] px-2 py-1.5 text-center text-[10px] font-medium text-white/90"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Scrobble status */}
      <div className="flex flex-col gap-1.5">
        {SERVICES.map((s, i) => (
          <motion.div
            key={s.name}
            className="flex items-center gap-2.5 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2"
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 120, damping: 20, delay: 0.1 + i * 0.1 }}
          >
            <span
              className={cn('size-1.5 shrink-0 rounded-full', s.dot)}
              style={{ boxShadow: '0 0 8px 2px currentColor' }}
            />
            <span className="text-[12px] font-medium text-white/80">{s.name}</span>
            <span className="ml-auto inline-flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-wider text-emerald-300">
              <Check className="size-2.5" aria-hidden />
              {s.detail}
            </span>
          </motion.div>
        ))}

        <div className="flex items-center gap-2.5 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2">
          <RefreshCw
            className={cn('size-3 shrink-0 text-cyan-300', !reduced && 'animate-spin-slow')}
            aria-hidden
          />
          <span className="text-[12px] font-medium text-white/80">Discord gateway</span>
          <span className="ml-auto font-mono text-[9.5px] uppercase tracking-wider text-cyan-300">
            reconnects instantly
          </span>
        </div>
      </div>
    </div>
  )
}
