'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowDownToLine, ArrowUpRight, CircleDot, ExternalLink, Tag } from 'lucide-react'
import { Reveal, SectionHeading } from '@/components/ui/reveal'
import { GlassCard } from '@/components/ui/glass-card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTelemetry } from '@/components/telemetry-provider'
import {
  RELEASES_URL,
  formatBytes,
  formatCompact,
  formatDate,
  formatRelative,
  type Release,
} from '@/lib/github'
import { cn } from '@/lib/utils'

/** How many releases the timeline shows before the "view all" affordance. */
const VISIBLE = 4

export function Changelog() {
  const { data } = useTelemetry()
  const [expanded, setExpanded] = useState(false)

  const releases = data?.releases ?? null
  const shown = releases ? (expanded ? releases : releases.slice(0, VISIBLE)) : null
  const hasMore = Boolean(releases && releases.length > VISIBLE)

  return (
    <section id="releases" className="relative scroll-mt-28 px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow="Release stream"
          title={
            <>
              Shipped, <span className="text-gradient">not promised</span>
            </>
          }
          description={
            data?.releaseCount
              ? `${data.releaseCount} published builds, pulled live from the GitHub Releases API.`
              : 'Pulled live from the GitHub Releases API.'
          }
        />

        <div className="relative mt-14">
          {/* Spine */}
          <div
            aria-hidden
            className="absolute bottom-0 left-[15px] top-2 w-px bg-gradient-to-b from-white/45 via-white/20 to-transparent sm:left-[19px]"
          />

          <div className="flex flex-col gap-4">
            {shown === null
              ? // Skeleton timeline — same geometry as the real thing, so nothing
                // shifts when data lands.
                Array.from({ length: 3 }, (_, i) => <TimelineSkeleton key={i} index={i} />)
              : shown.map((release, i) => (
                  <TimelineEntry key={release.tag} release={release} index={i} isLatest={i === 0} />
                ))}
          </div>
        </div>

        {/* Footer actions */}
        <Reveal delay={0.1}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {hasMore ? (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full glass px-5 py-2.5 text-[13px] text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white"
              >
                {expanded
                  ? 'Show fewer'
                  : `Show all ${releases?.length ?? ''} releases`.trim()}
              </button>
            ) : null}

            <a
              href={RELEASES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] text-white/45 transition-colors hover:text-white"
            >
              Full history on GitHub
              <ArrowUpRight
                className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function TimelineEntry({
  release,
  index,
  isLatest,
}: {
  release: Release
  index: number
  isLatest: boolean
}) {
  const apk = release.apk

  return (
    <motion.div
      className="relative pl-11 sm:pl-14"
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: index * 0.07 }}
    >
      {/* Node */}
      <span
        className={cn(
          'absolute left-0 top-5 grid size-[31px] place-items-center rounded-full border sm:size-[39px]',
          isLatest
            ? 'border-white/35 bg-white/12 text-white'
            : 'border-line bg-white/[0.03] text-white/40',
        )}
      >
        {isLatest ? (
          <>
            <CircleDot className="size-3.5 sm:size-4" aria-hidden />
            <span
              aria-hidden
              className="absolute inset-0 animate-pulse-ring rounded-full border border-white/45"
            />
          </>
        ) : (
          <Tag className="size-3 sm:size-3.5" aria-hidden />
        )}
      </span>

      <GlassCard>
        <div className="p-5">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span
              className={cn(
                'rounded-md border px-2 py-0.5 font-mono text-[11.5px] font-medium',
                isLatest
                  ? 'border-white/30 bg-white/10 text-white'
                  : 'border-line bg-white/[0.03] text-white/70',
              )}
            >
              {release.tag}
            </span>

            {isLatest ? (
              <span className="rounded-full bg-white px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-canvas">
                latest
              </span>
            ) : null}

            {release.prerelease ? (
              <span className="rounded-full border border-line bg-white/[0.04] px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-white/60">
                beta
              </span>
            ) : null}

            <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-white/30">
              {formatDate(release.publishedAt)}
              {formatRelative(release.publishedAt)
                ? ` · ${formatRelative(release.publishedAt)}`
                : ''}
            </span>
          </div>

          <h3 className="mt-2.5 text-[15.5px] font-semibold tracking-[-0.015em] text-white/90">
            {release.name}
          </h3>

          {/* Changelog bullets */}
          {release.highlights.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-1.5">
              {release.highlights.map((line, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-white/50">
                  <span
                    aria-hidden
                    className="mt-[7px] size-1 shrink-0 rounded-full bg-white/45"
                  />
                  <span className="text-pretty">{line}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {/* Per-release download */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            {apk ? (
              <a
                href={apk.downloadUrl}
                download=""
                className="group inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-3.5 py-2 text-[12.5px] text-white/80 transition-colors hover:border-white/25 hover:bg-white/[0.1] hover:text-white"
                aria-label={`Download ${apk.name}, ${formatBytes(apk.size)}`}
              >
                <ArrowDownToLine
                  className="size-3.5 transition-transform duration-300 group-hover:translate-y-0.5"
                  aria-hidden
                />
                APK
                <span className="font-mono text-[10.5px] text-white/40">
                  {formatBytes(apk.size)}
                </span>
              </a>
            ) : null}

            <a
              href={release.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] text-white/40 transition-colors hover:text-white"
            >
              <ExternalLink className="size-3" aria-hidden />
              Release notes
            </a>

            {apk && apk.downloadCount > 0 ? (
              <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.12em] text-white/25">
                {formatCompact(apk.downloadCount)} downloads
              </span>
            ) : null}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}

function TimelineSkeleton({ index }: { index: number }) {
  return (
    <div className="relative pl-11 sm:pl-14" style={{ opacity: 1 - index * 0.22 }}>
      <span className="absolute left-0 top-5 size-[31px] rounded-full border border-white/10 bg-white/[0.03] sm:size-[39px]" />
      <div className="rounded-[22px] glass p-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-14 rounded-md" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="mt-3.5 h-4 w-48" />
        <div className="mt-4 flex flex-col gap-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-[86%]" />
          <Skeleton className="h-3 w-[72%]" />
        </div>
        <Skeleton className="mt-5 h-8 w-28 rounded-full" />
      </div>
    </div>
  )
}
