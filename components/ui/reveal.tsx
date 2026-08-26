'use client'

import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { cn } from '@/lib/utils'

/** Shared spring — every scroll reveal on the page uses this exact curve. */
export const SPRING = { type: 'spring' as const, stiffness: 100, damping: 20 }

type RevealProps = {
  children: React.ReactNode
  className?: string
  /** Seconds of delay before this element animates in. */
  delay?: number
  /** Travel distance in px along the reveal axis. */
  distance?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  as?: 'div' | 'section' | 'span' | 'li' | 'header' | 'footer'
}

/**
 * Scroll-triggered reveal with spring physics.
 *
 * Fires once, when 20% of the element has entered the viewport with a small
 * bottom margin so content doesn't animate while already fully visible.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  distance = 26,
  direction = 'up',
  as = 'div',
}: RevealProps) {
  const reduced = useReducedMotion()
  const MotionTag = motion[as]

  const offset = reduced
    ? {}
    : direction === 'up'
      ? { y: distance }
      : direction === 'down'
        ? { y: -distance }
        : direction === 'left'
          ? { x: distance }
          : { x: -distance }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.2, margin: '0px 0px -60px 0px' }}
      transition={{ ...SPRING, delay }}
    >
      {children}
    </MotionTag>
  )
}

/**
 * Parent that staggers its `<RevealItem>` children.
 *
 * Prefer this over hand-tuned per-child delays: adding or removing a card keeps
 * the rhythm intact automatically.
 */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  stagger?: number
  delay?: number
}) {
  const variants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren: delay } },
  }

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15, margin: '0px 0px -80px 0px' }}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({
  children,
  className,
  distance = 24,
}: {
  children: React.ReactNode
  className?: string
  distance?: number
}) {
  const reduced = useReducedMotion()

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: reduced ? 0 : distance, filter: 'blur(6px)' },
        show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: SPRING },
      }}
    >
      {children}
    </motion.div>
  )
}

/** Section heading block used by every major section for vertical rhythm. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: {
  eyebrow?: string
  title: React.ReactNode
  description?: React.ReactNode
  align?: 'center' | 'left'
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        align === 'center' ? 'mx-auto max-w-2xl text-center items-center' : 'items-start',
        className,
      )}
    >
      {eyebrow ? (
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 font-mono text-[10.5px] tracking-[0.16em] text-white/55 uppercase">
            <span className="size-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_2px_rgba(6,182,212,0.6)]" />
            {eyebrow}
          </span>
        </Reveal>
      ) : null}

      <Reveal delay={0.06}>
        <h2 className="text-balance text-3xl font-semibold tracking-[-0.03em] text-gradient-soft sm:text-4xl md:text-[2.85rem] md:leading-[1.08]">
          {title}
        </h2>
      </Reveal>

      {description ? (
        <Reveal delay={0.12}>
          <p
            className={cn(
              'text-pretty text-[15px] leading-relaxed text-white/50 sm:text-base',
              align === 'center' && 'mx-auto max-w-xl',
            )}
          >
            {description}
          </p>
        </Reveal>
      ) : null}
    </div>
  )
}
