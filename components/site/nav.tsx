'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowDownToLine, Star } from 'lucide-react'
import { MagneticButton } from '@/components/ui/magnetic-button'
import { LiveMetric } from '@/components/ui/live-metric'
import { LogoWordmark } from '@/components/ui/logo'
import { useTelemetry } from '@/components/telemetry-provider'
import { REPO_URL, resolveDownload } from '@/lib/github'

/**
 * Page header.
 *
 * Fully transparent — no background, no blur, no shadow — and not pinned: it
 * sits in the document at the top of the page and scrolls away with everything
 * else. That removed the whole condensed-on-scroll apparatus: the scroll
 * listener, the glass plate and the drop shadow all existed only to keep a
 * floating bar legible over the content passing beneath it.
 *
 * The scroll-progress hairline used to sit inside the bar, inset from its
 * rounded edges, and would have scrolled away with it. It is now full-bleed and
 * fixed to the very top of the viewport — the one element that stays — so there
 * is still a persistent read on how far down the page you are.
 *
 * The section links are gone too, so there is no navigation to collapse into a
 * mobile sheet; the hamburger and its sheet went with them. The star link,
 * previously hidden below `sm` because the sheet carried a GitHub entry, is now
 * shown at every width — otherwise small screens would have no route to the
 * repository at all.
 */
export function Nav() {
  const { data } = useTelemetry()
  const { scrollYProgress } = useScroll()
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  const stars = data?.repo?.stars ?? null
  const download = resolveDownload(data?.latest ?? null)
  const tag = data?.latest?.tag

  return (
    <>
      {/* Scroll progress — full-bleed, pinned to the top of the viewport. */}
      <motion.span
        aria-hidden
        className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-white/80"
        style={{ width: progressWidth }}
      />

      <header className="relative z-40 flex justify-center px-4 pt-5">
        <div className="flex w-full max-w-6xl items-center gap-3 px-3 py-2.5">
          {/* Brand. The lockup carries its own wordmark, so no text beside it. */}
          <a href="#top" className="flex items-center pr-1" aria-label="BitChord home">
            {/* -my-2 absorbs the artwork's transparent padding so the bar keeps
                its height; see LogoWordmark. */}
            <LogoWordmark className="-my-2 h-10" />
          </a>

          <div className="ml-auto flex items-center gap-2">
            {/* Live star count */}
            <a
              href={`${REPO_URL}/stargazers`}
              target="_blank"
              rel="noopener noreferrer"
              // No resting fill: the header is fully transparent, so the only
              // thing separating this control from the page is its hairline.
              className="group inline-flex items-center gap-2 rounded-full border border-line px-3 py-2 text-[13px] text-white/75 transition-all duration-300 hover:bg-white/[0.07] hover:text-white"
            >
              <Star
                className="size-3.5 text-white/70 transition-transform duration-300 group-hover:scale-110 group-hover:fill-white"
                aria-hidden
              />
              <span className="hidden md:inline">Star</span>
              <span className="h-3.5 w-px bg-white/15" aria-hidden />
              <LiveMetric
                value={stars}
                digits={3}
                separator={false}
                className="font-mono text-[12.5px]"
              />
            </a>

            {/* Primary CTA */}
            <MagneticButton
              href={download.url}
              external
              download={download.isDirect}
              strength={4}
              className="!px-4 !py-2 !text-[13px]"
              aria-label={
                download.isDirect ? `Download BitChord APK ${tag ?? ''}` : 'View BitChord releases'
              }
            >
              <ArrowDownToLine className="size-3.5" aria-hidden />
              Get APK
            </MagneticButton>
          </div>
        </div>
      </header>
    </>
  )
}
