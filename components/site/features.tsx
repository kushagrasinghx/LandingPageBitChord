'use client'

import { AudioLines, Cast, CloudDownload, Mic2, Waves } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { RevealGroup, RevealItem, SectionHeading } from '@/components/ui/reveal'
import { PipelineVisualizer } from '@/components/features/pipeline-visualizer'
import { LyricsCard } from '@/components/features/lyrics-card'
import { AutomixCard } from '@/components/features/automix-card'
import { PresenceCard } from '@/components/features/presence-card'
import { OfflineCard } from '@/components/features/offline-card'
import { cn } from '@/lib/utils'

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-28 px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="The engine room"
          title={
            <>
              Built for people who can{' '}
              <span className="text-gradient">hear the difference</span>
            </>
          }
          description="Every feature below ships in the current build — not a roadmap. Poke at the cards; they're all live."
        />

        <RevealGroup className="mt-14 grid grid-cols-1 gap-3.5 lg:grid-cols-6" stagger={0.1}>
          {/* Card 1 — full width */}
          <RevealItem className="lg:col-span-6">
            <FeatureCard
              id="audio-engine"
              accent="cyan"
              icon={<AudioLines className="size-4 text-cyan-300" aria-hidden />}
              kicker="Auto-upgrade pipeline"
              title="Start instantly. Land on lossless."
              body="Playback opens on whichever stream resolves fastest, then a background fetch promotes the track to FLAC/ALAC from your configured source and swaps it in-place. Separate quality ceilings for Wi-Fi and mobile data mean it never fights your data plan."
              className="lg:grid lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:gap-8"
            >
              <PipelineVisualizer />
            </FeatureCard>
          </RevealItem>

          {/* Card 2 */}
          <RevealItem className="lg:col-span-3">
            <FeatureCard
              accent="violet"
              icon={<Mic2 className="size-4 text-violet-300" aria-hidden />}
              kicker="Word-synced lyrics"
              title="Karaoke-grade timing"
              body="Word and syllable-level highlighting pulled from four providers, with a translation track and adjustable type. Tap any line to seek straight to it."
            >
              <LyricsCard />
            </FeatureCard>
          </RevealItem>

          {/* Card 3 */}
          <RevealItem className="lg:col-span-3">
            <FeatureCard
              accent="magenta"
              icon={<Waves className="size-4 text-pink-300" aria-hidden />}
              kicker="Automix [Beta]"
              title="A DJ, not a fader"
              body="An on-device analyzer reads tempo, beat grid, key and vocal activity, then beat-matches and phrase-aligns the transition — falling back to equal-power crossfade when a track won't mix cleanly."
            >
              <AutomixCard />
            </FeatureCard>
          </RevealItem>

          {/* Card 4 */}
          <RevealItem className="lg:col-span-3">
            <FeatureCard
              accent="violet"
              icon={<Cast className="size-4 text-violet-300" aria-hidden />}
              kicker="Ecosystem sync"
              title="Your taste, everywhere"
              body="In-app Discord login with live track, artist, album and progress — plus configurable status, activity type and two custom buttons. Scrobbles to Last.fm and ListenBrainz as you listen."
            >
              <PresenceCard />
            </FeatureCard>
          </RevealItem>

          {/* Card 5 */}
          <RevealItem className="lg:col-span-3">
            <FeatureCard
              accent="cyan"
              icon={<CloudDownload className="size-4 text-cyan-300" aria-hidden />}
              kicker="Offline library"
              title="Keep the good stuff"
              body="Downloads land in Music/BitChord with lyrics, Hi-Res cover art and full metadata written into the file — then merge into a local library that also scans whatever's already on your device."
            >
              <OfflineCard />
            </FeatureCard>
          </RevealItem>
        </RevealGroup>
      </div>
    </section>
  )
}

function FeatureCard({
  id,
  icon,
  kicker,
  title,
  body,
  children,
  accent,
  className,
}: {
  id?: string
  icon: React.ReactNode
  kicker: string
  title: string
  body: string
  children: React.ReactNode
  accent: 'violet' | 'cyan' | 'magenta'
  className?: string
}) {
  return (
    <GlassCard accent={accent} className="h-full">
      <div id={id} className={cn('scroll-mt-28 p-6 sm:p-7', className)}>
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
              {icon}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
              {kicker}
            </span>
          </div>

          <h3 className="mt-4 text-balance text-xl font-semibold tracking-[-0.025em] text-white sm:text-[1.4rem]">
            {title}
          </h3>

          <p className="mt-2.5 text-pretty text-[13.5px] leading-relaxed text-white/45">{body}</p>
        </div>

        <div className="mt-6 lg:mt-0">{children}</div>
      </div>
    </GlassCard>
  )
}
