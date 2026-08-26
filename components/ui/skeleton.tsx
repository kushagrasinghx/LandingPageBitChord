import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

/**
 * Shimmer placeholder for in-flight GitHub telemetry.
 *
 * Callers pass an explicit width so the layout doesn't reflow when the real
 * number lands.
 */
export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      style={style}
      className={cn('skeleton inline-block align-middle', className)}
    />
  )
}

/**
 * Skeleton sized to roughly N digits of the inherited font, for swapping in
 * where an `<Odometer>` will land.
 */
export function SkeletonNumber({ digits = 3, className }: { digits?: number; className?: string }) {
  return (
    <Skeleton
      className={cn('h-[0.7em] rounded-md', className)}
      // 0.615em per digit column matches the Odometer's digit width exactly.
      style={{ width: `${(digits * 0.615).toFixed(2)}em` }}
    />
  )
}
