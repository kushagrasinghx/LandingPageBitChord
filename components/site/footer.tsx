'use client'

import { ArrowUpRight, Bug, Github, Heart, Scale, Star } from 'lucide-react'
import { WaveformMark } from '@/components/ui/waveform-mark'
import { LiveMetric } from '@/components/ui/live-metric'
import { Reveal } from '@/components/ui/reveal'
import { useTelemetry } from '@/components/telemetry-provider'
import { ISSUES_URL, RELEASES_URL, REPO_URL } from '@/lib/github'

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Audio Engine', href: '#audio-engine' },
      { label: 'Releases', href: '#releases' },
      { label: 'Install guide', href: '#install' },
    ],
  },
  {
    title: 'Project',
    links: [
      { label: 'Source on GitHub', href: REPO_URL, external: true },
      { label: 'All releases', href: RELEASES_URL, external: true },
      { label: 'Issue tracker', href: ISSUES_URL, external: true },
      { label: 'GPL-3.0 license', href: `${REPO_URL}/blob/main/LICENSE`, external: true },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Discord', href: 'https://discord.gg/pSafNTyKZx', external: true },
      { label: 'Ko-fi', href: 'https://ko-fi.com/kushagrasinghx', external: true },
      { label: 'PayPal', href: 'https://paypal.me/kuxhagrasingh', external: true },
      { label: '@kushagrasinghx', href: 'https://github.com/kushagrasinghx', external: true },
    ],
  },
] as const

export function Footer() {
  const { data } = useTelemetry()
  const stars = data?.repo?.stars ?? null
  const year = 2026

  return (
    <footer className="relative mt-8 border-t border-white/[0.07] px-6 pb-10 pt-16">
      {/* Ambient wash so the page doesn't just stop. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 opacity-50"
        style={{
          background:
            'radial-gradient(70% 100% at 50% 100%, rgba(124,58,237,0.28), transparent 70%)',
        }}
      />

      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="col-span-2 flex flex-col gap-4 sm:col-span-4 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <WaveformMark />
              <span className="text-[15px] font-bold tracking-[-0.02em] text-white">BitChord</span>
            </div>

            <p className="max-w-xs text-pretty text-[13px] leading-relaxed text-white/40">
              An aesthetic, open-source YouTube Music client with Hi-Res lossless playback,
              beat-matched Automix and word-synced lyrics. Free forever.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-[12.5px] text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white"
              >
                <Github className="size-3.5" aria-hidden />
                Star
                <span className="inline-flex items-center gap-1 font-mono text-[11.5px] text-amber-300">
                  <Star className="size-2.5 fill-amber-300" aria-hidden />
                  <LiveMetric value={stars} digits={3} />
                </span>
              </a>

              <a
                href={ISSUES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-[12.5px] text-white/60 transition-colors hover:bg-white/[0.07] hover:text-white"
              >
                <Bug className="size-3.5" aria-hidden />
                Report a bug
              </a>
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title} className="flex flex-col gap-3">
              <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-white/30">
                {col.title}
              </p>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      {...('external' in link && link.external
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                      className="group inline-flex items-center gap-1 text-[13px] text-white/45 transition-colors hover:text-white"
                    >
                      {link.label}
                      {'external' in link && link.external ? (
                        <ArrowUpRight
                          className="size-3 opacity-0 transition-all duration-300 group-hover:opacity-60"
                          aria-hidden
                        />
                      ) : null}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Legal */}
        <Reveal delay={0.05}>
          <div className="mt-14 flex flex-col gap-5 border-t border-white/[0.07] pt-7">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-white/30">
              <span className="inline-flex items-center gap-1.5">
                <Scale className="size-3" aria-hidden />
                GPL-3.0 · copyleft
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Heart className="size-3 text-pink-400/70" aria-hidden />
                Built by{' '}
                <a
                  href="https://github.com/kushagrasinghx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/55 underline decoration-white/20 underline-offset-2 transition-colors hover:text-white"
                >
                  @kushagrasinghx
                </a>
              </span>
              <span>© {year} BitChord</span>
            </div>

            <p className="max-w-4xl text-pretty text-[11.5px] leading-relaxed text-white/25">
              Independent, non-commercial project. Not affiliated with, endorsed by, or connected to
              YouTube, Google LLC, Deezer, Telegram, or any of their parent companies. BitChord does
              not host, upload, or store copyrighted media — it acts strictly as an interface to
              local device storage and public or user-authenticated APIs. You are responsible for
              ensuring your use complies with local copyright law and the terms of service of any
              platform you connect to. Distributed under the GNU General Public License v3.0; any
              redistribution must include the corresponding source under the same license.
            </p>

            <p className="text-[11px] text-white/20">
              Repository metrics on this page are fetched live from the GitHub REST API and cached
              for five minutes. Audio specifications shown in the player mockup are illustrative —
              actual bit depth and sample rate depend on your configured source.
            </p>
          </div>
        </Reveal>
      </div>
    </footer>
  )
}
