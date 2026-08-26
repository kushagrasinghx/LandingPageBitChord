'use client'

import { GitFork, Package, ShieldCheck, Star } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { LiveMetric } from '@/components/ui/live-metric'
import { Skeleton } from '@/components/ui/skeleton'
import { RevealGroup, RevealItem } from '@/components/ui/reveal'
import { useTelemetry } from '@/components/telemetry-provider'
import { RELEASES_URL, REPO_URL, formatCompact } from '@/lib/github'
import { cn } from '@/lib/utils'

export function Metrics() {
  const { data } = useTelemetry()

  const stars = data?.repo?.stars ?? null
  const forks = data?.repo?.forks ?? null
  const issues = data?.repo?.openIssues ?? null
  const releases = data?.releaseCount ?? null
  const downloads = data?.totalDownloads ?? null
  const license = data?.repo?.license ?? null

  return (
    <section aria-label="Live project metrics" className="relative px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <RevealGroup
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
          stagger={0.09}
        >
          {/* Stars */}
          <RevealItem>
            <MetricTile
              href={`${REPO_URL}/stargazers`}
              accent="violet"
              icon={<Star className="size-4 text-amber-300" aria-hidden />}
              value={<LiveMetric value={stars} digits={3} />}
              label="Stargazers on GitHub"
              foot={
                <>
                  <span className="text-amber-300/80">★</span> growing daily
                </>
              }
            />
          </RevealItem>

          {/* Releases */}
          <RevealItem>
            <MetricTile
              href={RELEASES_URL}
              accent="cyan"
              icon={<Package className="size-4 text-cyan-300" aria-hidden />}
              value={<LiveMetric value={releases} digits={1} />}
              label="Production & Beta Releases"
              foot={
                downloads === null ? (
                  <Skeleton className="h-2.5 w-28" />
                ) : (
                  <>
                    <span className="font-mono text-white/70">
                      {formatCompact(downloads)}
                    </span>{' '}
                    APK downloads
                  </>
                )
              }
            />
          </RevealItem>

          {/* Forks */}
          <RevealItem>
            <MetricTile
              href={`${REPO_URL}/forks`}
              accent="magenta"
              icon={<GitFork className="size-4 text-pink-300" aria-hidden />}
              value={<LiveMetric value={forks} digits={2} />}
              label="Open Source Contributors & Forks"
              foot={
                issues === null ? (
                  <Skeleton className="h-2.5 w-24" />
                ) : (
                  // Plain text, not a link: this sits inside the tile's own
                  // anchor and nesting <a> inside <a> is invalid HTML.
                  <>
                    <span className="font-mono text-white/70">{issues}</span> open issues
                  </>
                )
              }
            />
          </RevealItem>

          {/* Free / license — the one static tile, and deliberately so. */}
          <RevealItem>
            <MetricTile
              href={`${REPO_URL}/blob/main/LICENSE`}
              accent="cyan"
              icon={<ShieldCheck className="size-4 text-emerald-300" aria-hidden />}
              value={<span className="tnum">100%</span>}
              label="Free — no ads, no tracking"
              foot={
                <span className="font-mono text-white/70">
                  {license ?? 'GPL-3.0'} copyleft
                </span>
              }
            />
          </RevealItem>
        </RevealGroup>
      </div>
    </section>
  )
}

function MetricTile({
  href,
  icon,
  value,
  label,
  foot,
  accent,
}: {
  href: string
  icon: React.ReactNode
  value: React.ReactNode
  label: string
  foot: React.ReactNode
  accent: 'violet' | 'cyan' | 'magenta'
}) {
  return (
    <GlassCard accent={accent} className="h-full">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-full flex-col gap-3 p-5"
      >
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
            {icon}
          </span>
        </div>

        <p className="text-[2.15rem] font-bold leading-none tracking-[-0.04em] text-white">
          {value}
        </p>

        <p className="text-[13px] leading-snug text-white/45">{label}</p>

        <p className="mt-auto pt-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-white/30">
          {foot}
        </p>
      </a>
    </GlassCard>
  )
}
