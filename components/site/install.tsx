'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowDownToLine, ShieldCheck, Sparkles } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { MagneticButton } from '@/components/ui/magnetic-button'
import { SectionHeading, Reveal } from '@/components/ui/reveal'
import { useTelemetry } from '@/components/telemetry-provider'
import { resolveDownload } from '@/lib/github'
import { cn } from '@/lib/utils'

const STEPS = [
  {
    icon: ArrowDownToLine,
    title: 'Grab the signed APK',
    body: 'Download the latest build straight from GitHub Releases. Every release is signed with the same key, so it installs cleanly over your existing copy — session and settings intact.',
    detail: 'Requires Android 8.0 (API 26) or newer.',
    accent: 'cyan' as const,
  },
  {
    icon: ShieldCheck,
    title: 'Allow the installer',
    body: 'Android will ask you to permit installs from whichever app you downloaded with. Enable "Install unknown apps" for your browser or file manager, then confirm.',
    detail: 'Settings → Apps → Special access → Install unknown apps.',
    accent: 'violet' as const,
  },
  {
    icon: Sparkles,
    title: 'Press play',
    body: 'Sign in with Google for personalized content, point BitChord at a module source for lossless, and you are listening. No subscription, no ads, no account required to start.',
    detail: 'Nothing is upsold. There is nothing to buy.',
    accent: 'magenta' as const,
  },
]

export function Install() {
  const { data } = useTelemetry()
  const [active, setActive] = useState(0)
  const download = resolveDownload(data?.latest ?? null)
  const tag = data?.latest?.tag

  return (
    <section id="install" className="relative scroll-mt-28 px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="Sideloading"
          title={
            <>
              Three steps, <span className="text-gradient">about ninety seconds</span>
            </>
          }
          description="No store listing, no waiting on review. Sideload it and go."
        />

        <div className="mt-14 grid grid-cols-1 gap-3.5 md:grid-cols-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            const isActive = active === i
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ type: 'spring', stiffness: 100, damping: 20, delay: i * 0.1 }}
                onMouseEnter={() => setActive(i)}
                onFocusCapture={() => setActive(i)}
              >
                <GlassCard
                  accent={step.accent}
                  className={cn(
                    'h-full transition-colors duration-500',
                    isActive && 'border-white/20 bg-white/[0.055]',
                  )}
                >
                  <div className="flex h-full flex-col p-6">
                    {/* Step index + icon */}
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'grid size-9 place-items-center rounded-xl border transition-colors duration-500',
                          isActive
                            ? 'border-white/20 bg-white/[0.09]'
                            : 'border-white/[0.08] bg-white/[0.03]',
                        )}
                      >
                        <Icon
                          className={cn(
                            'size-4 transition-colors duration-500',
                            step.accent === 'cyan' && 'text-cyan-300',
                            step.accent === 'violet' && 'text-violet-300',
                            step.accent === 'magenta' && 'text-pink-300',
                          )}
                          aria-hidden
                        />
                      </span>

                      <span className="font-mono text-[2rem] font-bold leading-none tracking-tighter text-white/[0.07]">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>

                    <h3 className="mt-5 text-[16.5px] font-semibold tracking-[-0.02em] text-white">
                      {step.title}
                    </h3>

                    <p className="mt-2.5 text-pretty text-[13.5px] leading-relaxed text-white/45">
                      {step.body}
                    </p>

                    <p className="mt-auto pt-5 font-mono text-[10px] uppercase leading-relaxed tracking-[0.1em] text-white/25">
                      {step.detail}
                    </p>

                    {/* Progress rail — fills on the active card. */}
                    <div className="mt-4 h-px w-full overflow-hidden bg-white/[0.07]">
                      <motion.div
                        className="h-full bg-gradient-to-r from-violet-400 via-cyan-300 to-pink-300"
                        animate={{ width: isActive ? '100%' : '0%' }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )
          })}
        </div>

        <Reveal delay={0.15}>
          <div className="mt-10 flex flex-col items-center gap-3">
            <MagneticButton
              href={download.url}
              external
              download={download.isDirect}
              className="!px-7 !py-3.5"
              aria-label={
                download.isDirect
                  ? `Download BitChord APK ${tag ?? 'latest'}, ${download.size}`
                  : 'View BitChord releases on GitHub'
              }
            >
              <ArrowDownToLine className="size-4 transition-transform duration-300 group-hover/btn:translate-y-0.5" aria-hidden />
              {download.isDirect ? `Download ${tag ?? 'latest'} APK` : 'Open Releases'}
              {download.isDirect ? (
                <span className="ml-1 rounded-full bg-black/10 px-2 py-0.5 font-mono text-[10.5px] font-medium text-black/55">
                  {download.size}
                </span>
              ) : null}
            </MagneticButton>

            <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-white/25">
              {download.fileName ?? 'Signed release build'}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
