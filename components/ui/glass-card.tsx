'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * Frosted-glass panel with a dynamic specular highlight that tracks the pointer.
 *
 * Two stacked layers do the work: a soft radial wash inside the card, and a
 * border-mask layer that lights only the 1px hairline edge nearest the cursor.
 * The second is what makes the border read as a physical glass lip rather than a
 * flat stroke.
 */
export function GlassCard({
  children,
  className,
  /** Tint of the specular wash — pick per card so the grid isn't monochrome. */
  accent = 'violet',
  interactive = true,
}: {
  children: ReactNode
  className?: string
  accent?: 'violet' | 'cyan' | 'magenta'
  interactive?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(-400)
  const y = useMotionValue(-400)

  const rgb =
    accent === 'cyan' ? '6,182,212' : accent === 'magenta' ? '236,72,153' : '124,58,237'

  const wash = useMotionTemplate`radial-gradient(420px circle at ${x}px ${y}px, rgba(${rgb},0.14), transparent 65%)`
  const edge = useMotionTemplate`radial-gradient(320px circle at ${x}px ${y}px, rgba(255,255,255,0.42), transparent 70%)`

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!interactive) return
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    x.set(e.clientX - rect.left)
    y.set(e.clientY - rect.top)
  }

  function onLeave() {
    x.set(-400)
    y.set(-400)
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn(
        'group/card relative overflow-hidden rounded-[22px] glass',
        'transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)]',
        interactive && 'hover:-translate-y-1',
        className,
      )}
    >
      {/* Interior specular wash. */}
      {interactive ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
          style={{ background: wash }}
        />
      ) : null}

      {/* Lit hairline edge: the gradient is masked to a 1px inset ring. */}
      {interactive ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 rounded-[22px] opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
          style={{
            background: edge,
            padding: 1,
            WebkitMask:
              'linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)',
            mask: 'linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)',
          }}
        />
      ) : null}

      {/* Static top-edge sheen — present even without a pointer (touch devices). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />

      <div className="relative z-10 h-full">{children}</div>
    </div>
  )
}
