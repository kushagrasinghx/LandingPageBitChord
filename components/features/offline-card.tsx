'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Check, Download, FileMusic, HardDrive, Image, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'

const QUEUE = [
  { title: 'Midnight Wire', size: '38.2 MB', codec: 'FLAC' },
  { title: 'Signal Bloom', size: '41.7 MB', codec: 'FLAC' },
  { title: 'Paper Cities', size: '9.4 MB', codec: 'Opus' },
] as const

const TAGS = [
  { icon: FileMusic, label: 'Embedded lyrics' },
  { icon: Image, label: 'Hi-Res cover art' },
  { icon: Tag, label: 'Full ID3 metadata' },
] as const

/**
 * Offline library card: a download queue that fills, the metadata BitChord
 * embeds into each file, and a storage meter.
 *
 * Progress is driven from a single interval so the three rows fill at staggered
 * rates off one clock rather than three competing timers.
 */
export function OfflineCard() {
  const reduced = useReducedMotion()
  const [tick, setTick] = useState(reduced ? 100 : 0)

  useEffect(() => {
    if (reduced) return
    const id = window.setInterval(() => setTick((t) => (t >= 130 ? 0 : t + 1)), 55)
    return () => window.clearInterval(id)
  }, [reduced])

  // Each row lags the one above it, so the queue reads as sequential work.
  const rowProgress = (i: number) => Math.max(0, Math.min(100, tick - i * 15))

  return (
    <div className="flex h-full flex-col gap-3.5">
      {/* Download queue */}
      <div className="flex flex-col gap-1.5">
        {QUEUE.map((track, i) => {
          const pct = rowProgress(i)
          const done = pct >= 100
          return (
            <div
              key={track.title}
              className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2"
            >
              <div className="flex items-center gap-2">
                {done ? (
                  <Check className="size-3 shrink-0 text-emerald-400" aria-hidden />
                ) : (
                  <Download className="size-3 shrink-0 text-cyan-300" aria-hidden />
                )}
                <span className="truncate text-[12px] font-medium text-white/85">
                  {track.title}
                </span>
                <span
                  className={cn(
                    'ml-auto shrink-0 rounded border px-1.5 py-px font-mono text-[8.5px] uppercase tracking-wider',
                    track.codec === 'FLAC'
                      ? 'border-cyan-400/25 bg-cyan-400/10 text-cyan-200'
                      : 'border-violet-400/25 bg-violet-400/10 text-violet-200',
                  )}
                >
                  {track.codec}
                </span>
                <span className="shrink-0 font-mono text-[9.5px] tabular-nums text-white/35">
                  {track.size}
                </span>
              </div>

              <div className="mt-1.5 h-[2.5px] overflow-hidden rounded-full bg-white/8">
                <div
                  className={cn(
                    'h-full rounded-full transition-[width] duration-100 ease-linear',
                    done
                      ? 'bg-emerald-400/80'
                      : 'bg-gradient-to-r from-violet-400 to-cyan-300',
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* What gets written into each file */}
      <div className="flex flex-wrap gap-1.5">
        {TAGS.map(({ icon: Icon, label }, i) => (
          <motion.span
            key={label}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10.5px] text-white/60"
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 140, damping: 20, delay: i * 0.08 }}
          >
            <Icon className="size-3 text-violet-300" aria-hidden />
            {label}
          </motion.span>
        ))}
      </div>

      {/* Storage meter */}
      <div className="mt-auto rounded-lg border border-white/[0.07] bg-black/30 p-3">
        <div className="mb-2 flex items-center gap-2">
          <HardDrive className="size-3 text-white/40" aria-hidden />
          <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-white/40">
            Music/BitChord
          </span>
          <span className="ml-auto font-mono text-[10px] tabular-nums text-white/60">
            4.2 / 64 GB
          </span>
        </div>
        <div className="flex h-1.5 gap-px overflow-hidden rounded-full bg-white/8">
          <span className="w-[4.4%] bg-cyan-400/85" />
          <span className="w-[2.1%] bg-violet-400/85" />
          <span className="w-[0.6%] bg-pink-400/85" />
        </div>
        <div className="mt-2 flex gap-3 font-mono text-[9px] uppercase tracking-wider text-white/30">
          <span className="inline-flex items-center gap-1">
            <span className="size-1 rounded-full bg-cyan-400" /> Lossless
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-1 rounded-full bg-violet-400" /> Lossy
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-1 rounded-full bg-pink-400" /> Artwork
          </span>
        </div>
      </div>
    </div>
  )
}
