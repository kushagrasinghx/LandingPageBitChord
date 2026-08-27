'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { AlertTriangle, Check, Pause, Play, Zap } from 'lucide-react'
import { cn, pct } from '@/lib/utils'

/** Fraction of the timeline where BitChord hands Opus off to FLAC. */
const HANDOFF = 0.42
/** Where a conventional player stalls to re-buffer, and for how long. */
const STALL_START = 0.6
const STALL_END = 0.72

const CYCLE_MS = 7000
const TICK_MS = 40

/**
 * Side-by-side visualizer: a conventional lossy stream against BitChord's
 * start-fast-then-upgrade pipeline.
 *
 * A single `progress` value (0..1) drives every derived state — playhead, packet
 * lane, codec badges, the bitrate readout and the stall marker — so nothing can
 * drift out of sync. The loop is a plain interval rather than rAF because the
 * visual only changes meaningfully at ~25fps and this keeps it pausable.
 */
export function PipelineVisualizer() {
  const reduced = useReducedMotion()
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    if (!playing || reduced) return
    const id = window.setInterval(() => {
      setProgress((p) => (p + TICK_MS / CYCLE_MS) % 1)
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [playing, reduced])

  const upgraded = progress >= HANDOFF
  const stalling = progress >= STALL_START && progress < STALL_END

  // Bitrate readout: 128 kbps Opus before the handoff, 1,411 kbps FLAC after,
  // with a short ramp so the number visibly climbs rather than teleporting.
  const ramp = Math.min(1, Math.max(0, (progress - HANDOFF) / 0.06))
  const bitrate = Math.round(128 + ramp * (1411 - 128))

  return (
    <div className="flex flex-col gap-5">
      {/* Controls + legend */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPlaying((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-white/60 transition-colors hover:bg-white/[0.09] hover:text-white"
            aria-label={playing ? 'Pause visualizer' : 'Play visualizer'}
          >
            {playing ? <Pause className="size-3" aria-hidden /> : <Play className="size-3" aria-hidden />}
            {playing ? 'Pause' : 'Play'}
          </button>

          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-white/25">
            t = {(progress * 100).toFixed(0).padStart(2, '0')}%
          </span>
        </div>

        {/* Live bitrate readout */}
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5">
          <span
            className={cn(
              'size-1.5 rounded-full transition-colors duration-300',
              upgraded
                ? 'bg-cyan-400 shadow-[0_0_8px_2px_rgba(6,182,212,0.7)]'
                : 'bg-amber-400 shadow-[0_0_8px_2px_rgba(251,191,36,0.6)]',
            )}
          />
          <span className="font-mono text-[11px] tabular-nums text-white/80">
            {bitrate.toLocaleString('en-US')} kbps
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/35">
            {upgraded ? 'FLAC' : 'Opus'}
          </span>
        </div>
      </div>

      {/* ---------------------------- lane: legacy ---------------------------- */}
      <Lane
        title="Conventional player"
        subtitle="One stream, one quality. Re-buffers when the pipe narrows."
        tone="warn"
        progress={progress}
        badge={
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-amber-200">
            128 kbps · locked
          </span>
        }
        packets={(i, x) => {
          const inStall = x >= STALL_START && x < STALL_END
          return {
            // Packets vanish through the stall window: that gap is the point.
            opacity: inStall ? 0 : 0.9,
            color: 'rgba(251,191,36,0.85)',
            height: inStall ? 3 : 8 + (i % 3) * 3,
          }
        }}
        marker={
          <div
            className="absolute inset-y-0 flex items-center justify-center border-x border-dashed border-amber-400/40 bg-amber-400/[0.07]"
            style={{ left: pct(STALL_START), width: pct(STALL_END - STALL_START) }}
          >
            <span className="whitespace-nowrap font-mono text-[8.5px] uppercase tracking-wider text-amber-200/90">
              re-buffer
            </span>
          </div>
        }
        status={
          stalling ? (
            <span className="inline-flex items-center gap-1.5 text-amber-300">
              <AlertTriangle className="size-3" aria-hidden />
              Stalled — audible gap
            </span>
          ) : (
            <span className="text-white/35">Streaming lossy</span>
          )
        }
      />

      {/* --------------------------- lane: bitchord --------------------------- */}
      <Lane
        title="BitChord pipeline"
        subtitle="Starts on the fastest stream, promotes to lossless in the background."
        tone="good"
        progress={progress}
        badge={
          <motion.span
            key={upgraded ? 'flac' : 'opus'}
            initial={{ opacity: 0, y: -4, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider',
              upgraded
                ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200'
                : 'border-violet-400/30 bg-violet-400/10 text-violet-200',
            )}
          >
            {upgraded ? '1,411 kbps · FLAC' : '128 kbps · Opus'}
          </motion.span>
        }
        packets={(i, x) => ({
          opacity: 0.95,
          // Packets past the handoff carry lossless payload — drawn taller and
          // in cyan so the transition is legible at a glance.
          color: x >= HANDOFF ? 'rgba(34,211,238,0.9)' : 'rgba(167,139,250,0.85)',
          height: x >= HANDOFF ? 14 + (i % 3) * 4 : 8 + (i % 3) * 3,
        })}
        marker={
          <div
            className="absolute inset-y-0 flex items-center"
            style={{ left: pct(HANDOFF) }}
          >
            <span className="absolute inset-y-0 w-px bg-gradient-to-b from-transparent via-cyan-300 to-transparent" />
            <span className="absolute -top-1 left-1.5 whitespace-nowrap rounded bg-cyan-400/15 px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-wider text-cyan-200">
              upgrade
            </span>
          </div>
        }
        status={
          upgraded ? (
            <span className="inline-flex items-center gap-1.5 text-cyan-300">
              <Check className="size-3" aria-hidden />
              Promoted to lossless — no re-buffer
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-violet-300">
              <Zap className="size-3" aria-hidden />
              First frame out in ~180 ms
            </span>
          )
        }
      />
    </div>
  )
}

/**
 * One packet lane.
 *
 * `packets` is a callback rather than data so each lane can style a packet from
 * its index *and* its position along the timeline — which is how the FLAC handoff
 * recolours mid-lane without duplicating the lane markup.
 */
function Lane({
  title,
  subtitle,
  tone,
  progress,
  badge,
  packets,
  marker,
  status,
}: {
  title: string
  subtitle: string
  tone: 'warn' | 'good'
  progress: number
  badge: React.ReactNode
  packets: (i: number, x: number) => { opacity: number; color: string; height: number }
  marker: React.ReactNode
  status: React.ReactNode
}) {
  const COUNT = 46

  return (
    <div
      className={cn(
        'rounded-2xl border p-4 transition-colors duration-500',
        tone === 'good'
          ? 'border-cyan-400/15 bg-cyan-400/[0.035]'
          : 'border-white/[0.07] bg-white/[0.015]',
      )}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[13.5px] font-semibold tracking-[-0.01em] text-white/90">{title}</p>
          <p className="mt-0.5 text-[11.5px] leading-snug text-white/40">{subtitle}</p>
        </div>
        {badge}
      </div>

      {/* Packet track */}
      <div className="relative h-12 overflow-hidden rounded-xl border border-white/[0.06] bg-black/40">
        {/* Buffered region behind the playhead. */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 transition-none',
            tone === 'good'
              ? 'bg-gradient-to-r from-violet-500/10 to-cyan-400/10'
              : 'bg-amber-400/[0.06]',
          )}
          style={{ width: pct(progress) }}
        />

        {marker}

        {/* Packets */}
        <div className="absolute inset-0 flex items-center justify-between px-1.5">
          {Array.from({ length: COUNT }, (_, i) => {
            const x = i / (COUNT - 1)
            const { opacity, color, height } = packets(i, x)
            // Only packets already delivered (left of the playhead) are lit.
            const delivered = x <= progress
            return (
              <span
                key={i}
                className="rounded-full transition-[height,background-color] duration-200"
                style={{
                  width: 3,
                  height,
                  backgroundColor: delivered ? color : 'rgba(255,255,255,0.07)',
                  opacity: delivered ? opacity : 0.5,
                }}
              />
            )
          })}
        </div>

        {/* Playhead */}
        <div
          className="absolute inset-y-0 w-px bg-white/70 shadow-[0_0_10px_2px_rgba(255,255,255,0.35)]"
          style={{ left: pct(progress) }}
        >
          <span className="absolute -top-px left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-white" />
        </div>
      </div>

      <p className="mt-2.5 font-mono text-[10.5px] uppercase tracking-[0.12em]">{status}</p>
    </div>
  )
}
