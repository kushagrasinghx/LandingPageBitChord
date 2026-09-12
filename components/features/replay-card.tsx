'use client'

import { motion } from 'framer-motion'
import { Odometer } from '@/components/ui/odometer'
import { LogoMark } from '@/components/ui/logo'
import { cn } from '@/lib/utils'

/**
 * Replay preview: the app's monthly listening recap.
 *
 * Two halves, mirroring the screen itself — the embossed card that carries the
 * headline number, and the ranked rows underneath it.
 *
 * The top rank is marked by inverting it — black on white — rather than by
 * colour, so the card stays monochrome with the rest of the page.
 */

const ROWS = [
  { rank: 1, title: 'Midnight Wire', artist: 'Aurelia Vance', plays: 84 },
  { rank: 2, title: 'Paper Cities', artist: 'Novaline', plays: 61 },
  { rank: 3, title: 'Signal Bloom', artist: 'Aurelia Vance', plays: 47 },
] as const

export function ReplayCard() {
  return (
    <div className="flex h-full flex-col gap-3.5">
      {/* Embossed recap card */}
      <div className="relative overflow-hidden rounded-xl border border-line bg-surface-2 p-3.5">
        {/* Sheen across the face, the way a pressed card catches light. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent"
        />

        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-white/40">
              Your listening experience
            </p>
            <p className="mt-1.5 text-[1.75rem] font-bold leading-none tracking-[-0.04em] text-white">
              <Odometer value={4182} />
            </p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-white/45">
              Minutes listened
            </p>
          </div>

          {/* The mark, embossed rather than printed. */}
          <LogoMark className="w-7 shrink-0 opacity-70" />
        </div>

        <div className="relative mt-3.5 flex items-end justify-between gap-3 border-t border-white/[0.06] pt-2.5">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/35">
              Member since
            </p>
            <p className="font-mono text-[11px] tabular-nums text-white/75">Mar 2026</p>
          </div>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-white/45">
            September
          </p>
        </div>
      </div>

      {/* Ranked rows */}
      <div className="flex flex-col gap-1.5">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">Top songs</p>

        {ROWS.map((row, i) => (
          <motion.div
            key={row.title}
            className="flex items-center gap-2.5 rounded-lg border border-line bg-white/[0.02] px-2.5 py-2"
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 130, damping: 20, delay: 0.08 + i * 0.09 }}
          >
            <span
              className={cn(
                'grid size-5 shrink-0 place-items-center rounded-full font-mono text-[10px] font-semibold tabular-nums',
                row.rank === 1 ? 'bg-white text-canvas' : 'bg-white/[0.08] text-white/60',
              )}
            >
              {row.rank}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-medium text-white/85">
                {row.title}
              </span>
              <span className="block truncate text-[10.5px] text-white/40">{row.artist}</span>
            </span>

            <span className="shrink-0 font-mono text-[9.5px] tabular-nums text-white/35">
              {row.plays} plays
            </span>
          </motion.div>
        ))}
      </div>

      <p className="mt-auto font-mono text-[10px] uppercase tracking-[0.12em] text-white/25">
        Songs · Artists · Albums · Genres — shareable as a poster
      </p>
    </div>
  )
}
