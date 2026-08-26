'use client'

import { useEffect, useRef, useState } from 'react'
import { animate, useInView, useReducedMotion } from 'framer-motion'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
const ROLL_SPRING = { type: 'spring' as const, stiffness: 100, damping: 20 }

/**
 * One vertically-rolling digit column.
 *
 * The column holds 0–9 stacked at exactly 1em each, so translating by `-value em`
 * lands the right glyph in the window. Overflow hidden gives the mechanical
 * odometer wipe rather than a crossfade.
 */
function DigitColumn({ value }: { value: number }) {
  return (
    <span
      aria-hidden
      className="relative inline-block overflow-hidden align-baseline"
      style={{ height: '1em', width: '0.615em', lineHeight: 1 }}
    >
      <motion.span
        className="absolute left-0 top-0 flex w-full flex-col items-center"
        animate={{ y: `-${value}em` }}
        transition={ROLL_SPRING}
      >
        {DIGITS.map((d) => (
          <span key={d} className="block w-full text-center" style={{ height: '1em', lineHeight: 1 }}>
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  )
}

/**
 * Animated numeric odometer that counts up from 0 the first time it scrolls into
 * view, then rolls digit-by-digit on any later value change (e.g. a live refetch
 * bumping the star count).
 *
 * Renders the true value in a screen-reader-only node, since the visual digit
 * columns are a stack of all ten glyphs and would read as gibberish.
 */
export function Odometer({
  value,
  className,
  duration = 1.5,
  /** Group with thousands separators. */
  separator = true,
  prefix,
  suffix,
}: {
  value: number
  className?: string
  duration?: number
  separator?: boolean
  prefix?: string
  suffix?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const reduced = useReducedMotion()
  const [display, setDisplay] = useState(reduced ? value : 0)
  const started = useRef(false)

  useEffect(() => {
    if (reduced) {
      setDisplay(value)
      return
    }
    if (!inView) return

    // First time in view: sweep 0 → value. Afterwards, animate from wherever we
    // are so a live update rolls the delta instead of restarting from zero.
    const from = started.current ? display : 0
    started.current = true

    const controls = animate(from, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
    // `display` is intentionally excluded: including it would restart the tween
    // on every frame it sets.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, duration, reduced])

  const text = separator ? display.toLocaleString('en-US') : String(display)

  return (
    <span ref={ref} className={cn('tnum inline-flex items-baseline', className)}>
      <span className="sr-only">
        {prefix}
        {value.toLocaleString('en-US')}
        {suffix}
      </span>
      {prefix ? <span aria-hidden>{prefix}</span> : null}
      <span aria-hidden className="inline-flex items-baseline">
        {text.split('').map((char, i) =>
          char >= '0' && char <= '9' ? (
            <DigitColumn key={`${i}-d`} value={Number(char)} />
          ) : (
            <span key={`${i}-s`} className="inline-block" style={{ width: '0.3em' }}>
              {char}
            </span>
          ),
        )}
      </span>
      {suffix ? <span aria-hidden>{suffix}</span> : null}
    </span>
  )
}
