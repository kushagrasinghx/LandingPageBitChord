'use client'

import { Odometer } from '@/components/ui/odometer'
import { SkeletonNumber } from '@/components/ui/skeleton'

/**
 * A telemetry number that shows a shimmer until real data arrives.
 *
 * `value === null` means "not loaded" rather than zero — the distinction matters,
 * since rendering `0` stars during a rate limit would be an outright false claim.
 */
export function LiveMetric({
  value,
  digits = 3,
  className,
  separator = true,
  suffix,
}: {
  value: number | null
  digits?: number
  className?: string
  separator?: boolean
  suffix?: string
}) {
  if (value === null) return <SkeletonNumber digits={digits} className={className} />
  return <Odometer value={value} className={className} separator={separator} suffix={suffix} />
}
