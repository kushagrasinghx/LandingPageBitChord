import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a 0–1 ratio as a CSS percentage that survives a DOM round trip.
 *
 * Unrounded floats in inline styles break hydration. React compares its own prop
 * string against the browser's parsed CSSOM value, and Chrome serialises CSS
 * numbers to six significant digits — so `height:82.99959171746654%` comes back
 * as `82.9996%` and the two no longer agree.
 *
 * Rounding alone isn't enough either: `toFixed` pads trailing zeros, and Chrome
 * drops them, turning `83.000%` back into `83%`. `Number()` normalises the value
 * to its shortest exact representation so both sides emit the same string.
 *
 * Three decimals sits exactly at the six-digit limit for values up to 100, and is
 * far below one device pixel at any realistic element size — nothing moves.
 */
export function pct(ratio: number, digits = 3): string {
  return `${Number((ratio * 100).toFixed(digits))}%`
}

/**
 * Same round-trip guarantee for CSS time values. `i * 0.15` is not exact in
 * binary floating point — at i=3 it yields 0.44999999999999996 — so staggered
 * animation delays need the same treatment as percentages.
 */
export function secs(value: number, digits = 3): string {
  return `${Number(value.toFixed(digits))}s`
}
