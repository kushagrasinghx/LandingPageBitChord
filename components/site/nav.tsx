'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import { LogoWordmark } from '@/components/ui/logo'

/**
 * Page header: the logo on the left, the addon docs link on the right.
 *
 * Fully transparent and not pinned — it scrolls away with the page. The
 * scroll-progress hairline is the one fixed element, so there is still a
 * persistent read on how far down the page you are.
 */
export function Nav() {
  const { scrollYProgress } = useScroll()
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  return (
    <>
      {/* Scroll progress — full-bleed, pinned to the top of the viewport. */}
      <motion.span
        aria-hidden
        className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-white/80"
        style={{ width: progressWidth }}
      />

      <header id="top" className="relative z-40 pt-5">
        <div className="page-container flex items-center justify-between gap-3 py-2.5">
          <a href="#top" className="flex items-center" aria-label="BitChord home">
            {/* -my-2 absorbs the artwork's transparent padding so the bar keeps
                its height; see LogoWordmark. */}
            <LogoWordmark className="-my-2 h-10" />
          </a>

          <Link
            href="/docs"
            className="py-2 text-[13.5px] text-white/60 transition-colors hover:text-white"
          >
            Addon Docs
          </Link>
        </div>
      </header>
    </>
  )
}
