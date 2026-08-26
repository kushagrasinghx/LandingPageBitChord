'use client'

import { cn } from '@/lib/utils'

/**
 * Animated waveform logo mark.
 *
 * Bars pulse on a staggered loop via the CSS `waveform` keyframe, so it keeps
 * moving without a JS timer or a Framer Motion subscription per bar.
 */
export function WaveformMark({
  className,
  animate = true,
}: {
  className?: string
  animate?: boolean
}) {
  const bars = [0.42, 0.78, 1, 0.62, 0.34]

  return (
    <span
      className={cn(
        'relative grid size-9 shrink-0 place-items-center rounded-[11px] hairline',
        'bg-gradient-to-br from-violet-500/25 via-cyan-400/15 to-pink-500/20',
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-[11px] bg-gradient-to-br from-violet-500/30 to-cyan-400/20 blur-md"
      />
      <span className="relative flex h-4 items-center gap-[2.5px]">
        {bars.map((h, i) => (
          <span
            key={i}
            className={cn(
              'w-[2.5px] origin-center rounded-full bg-gradient-to-t from-violet-400 to-cyan-300',
              animate && 'animate-waveform',
            )}
            style={{
              height: `${h * 100}%`,
              animationDelay: `${i * 0.13}s`,
            }}
          />
        ))}
      </span>
    </span>
  )
}
