'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, Terminal as TerminalIcon } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { Reveal, SectionHeading } from '@/components/ui/reveal'
import { REPO_SLUG, REPO_URL } from '@/lib/github'
import { cn } from '@/lib/utils'

/**
 * A single rendered terminal line. `kind` drives colour only — `text` is what
 * gets copied, and comment/output lines are excluded from the copy payload so
 * pasting into a shell actually works.
 */
type Line =
  | { kind: 'comment'; text: string }
  | { kind: 'cmd'; text: string }
  | { kind: 'out'; text: string }
  | { kind: 'ok'; text: string }

const TABS: { id: string; label: string; lines: Line[] }[] = [
  {
    id: 'clone',
    label: 'Clone',
    lines: [
      { kind: 'comment', text: '# Grab the source (Kotlin + a native C++ analyzer)' },
      { kind: 'cmd', text: `git clone https://github.com/${REPO_SLUG}.git` },
      { kind: 'cmd', text: 'cd BitChord' },
      { kind: 'out', text: 'Cloning into \'BitChord\'...' },
      { kind: 'ok', text: '✓ resolved deltas, working tree clean' },
    ],
  },
  {
    id: 'build',
    label: 'Build APK',
    lines: [
      { kind: 'comment', text: '# Signing config is read from keystore.properties' },
      { kind: 'cmd', text: 'cp keystore.properties.example keystore.properties' },
      { kind: 'comment', text: '# Assemble the release variant (bundles the ONNX models)' },
      { kind: 'cmd', text: './gradlew assembleRelease' },
      { kind: 'out', text: '> Task :native:externalNativeBuildRelease' },
      { kind: 'out', text: '> Task :app:assembleRelease' },
      { kind: 'ok', text: '✓ app/build/outputs/apk/release/app-release.apk' },
    ],
  },
  {
    id: 'run',
    label: 'Run',
    lines: [
      { kind: 'comment', text: '# Install straight onto a connected device' },
      { kind: 'cmd', text: './gradlew installDebug' },
      { kind: 'comment', text: '# ...or sideload a built APK by hand' },
      { kind: 'cmd', text: 'adb install -r app/build/outputs/apk/release/app-release.apk' },
      { kind: 'ok', text: '✓ Success · BitChord launched' },
    ],
  },
]

export function Terminal() {
  const [tab, setTab] = useState(0)
  const [copied, setCopied] = useState(false)

  const active = TABS[tab]!

  /** Only the runnable lines — comments and simulated output are stripped. */
  const copyPayload = active.lines
    .filter((l) => l.kind === 'cmd')
    .map((l) => l.text)
    .join('\n')

  async function copy() {
    try {
      await navigator.clipboard.writeText(copyPayload)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard blocked (insecure context or denied permission). Fall back to a
      // selection-based copy so the button still does something useful.
      const ta = document.createElement('textarea')
      ta.value = copyPayload
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1800)
      } catch {
        /* Nothing more we can do — the text is visible and selectable. */
      }
      document.body.removeChild(ta)
    }
  }

  return (
    <section id="tech-stack" className="relative scroll-mt-28 px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="Build it yourself"
          title={
            <>
              Fully auditable, <span className="text-gradient">GPLv3 all the way down</span>
            </>
          }
          description="Nothing here is a black box. Clone it, read it, build it, ship your own fork — the license guarantees you can."
        />

        <div className="mt-14 grid grid-cols-1 gap-3.5 lg:grid-cols-[minmax(0,1fr)_260px]">
          {/* ------------------------------ terminal ------------------------------ */}
          <Reveal>
            <GlassCard accent="cyan" interactive={false} className="overflow-hidden">
              {/* Chrome */}
              <div className="flex items-center gap-3 border-b border-white/[0.07] bg-white/[0.02] px-4 py-2.5">
                <div className="flex gap-1.5" aria-hidden>
                  <span className="size-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="size-2.5 rounded-full bg-[#febc2e]" />
                  <span className="size-2.5 rounded-full bg-[#28c840]" />
                </div>

                <span className="ml-1 inline-flex items-center gap-1.5 font-mono text-[10.5px] text-white/35">
                  <TerminalIcon className="size-3" aria-hidden />
                  bitchord — zsh
                </span>

                <button
                  type="button"
                  onClick={copy}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-white/55 transition-colors hover:bg-white/[0.09] hover:text-white"
                  aria-label={`Copy ${active.label} commands to clipboard`}
                >
                  {copied ? (
                    <>
                      <Check className="size-3 text-emerald-400" aria-hidden />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" aria-hidden />
                      Copy
                    </>
                  )}
                </button>
              </div>

              {/* Tabs */}
              <div
                className="flex gap-1 border-b border-white/[0.07] px-2 pt-2"
                role="tablist"
                aria-label="Developer commands"
              >
                {TABS.map((t, i) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    id={`tab-${t.id}`}
                    aria-selected={tab === i}
                    aria-controls={`panel-${t.id}`}
                    onClick={() => {
                      setTab(i)
                      setCopied(false)
                    }}
                    className={cn(
                      'relative rounded-t-lg px-3.5 py-2 font-mono text-[11px] transition-colors',
                      tab === i ? 'text-white' : 'text-white/35 hover:text-white/70',
                    )}
                  >
                    {t.label}
                    {tab === i ? (
                      <motion.span
                        layoutId="terminal-tab"
                        className="absolute inset-x-1 -bottom-px h-px bg-gradient-to-r from-violet-400 via-cyan-300 to-pink-300"
                        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                      />
                    ) : null}
                  </button>
                ))}
              </div>

              {/* Body */}
              <div
                role="tabpanel"
                id={`panel-${active.id}`}
                aria-labelledby={`tab-${active.id}`}
                className="min-h-[232px] bg-black/45 p-4"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-1.5 font-mono text-[12px] leading-relaxed"
                  >
                    {active.lines.map((line, i) => (
                      <motion.p
                        key={i}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 + i * 0.06, duration: 0.25 }}
                        className={cn(
                          'flex gap-2',
                          line.kind === 'comment' && 'text-white/25',
                          line.kind === 'cmd' && 'text-white/90',
                          line.kind === 'out' && 'text-white/40',
                          line.kind === 'ok' && 'text-emerald-400/90',
                        )}
                      >
                        {line.kind === 'cmd' ? (
                          <span className="shrink-0 select-none text-cyan-400" aria-hidden>
                            ❯
                          </span>
                        ) : (
                          <span className="shrink-0 select-none opacity-0" aria-hidden>
                            ❯
                          </span>
                        )}
                        <span className="break-all">{line.text}</span>
                      </motion.p>
                    ))}

                    {/* Cursor */}
                    <p className="flex gap-2">
                      <span className="shrink-0 select-none text-cyan-400" aria-hidden>
                        ❯
                      </span>
                      <span
                        aria-hidden
                        className="inline-block h-[15px] w-[7px] animate-pulse bg-white/70"
                      />
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </GlassCard>
          </Reveal>

          {/* ------------------------------ stack list ---------------------------- */}
          <Reveal delay={0.12}>
            <GlassCard accent="violet" className="h-full">
              <div className="flex h-full flex-col p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
                  Under the hood
                </p>

                <dl className="mt-4 flex flex-col gap-3">
                  {[
                    ['Language', 'Kotlin'],
                    ['UI', 'Jetpack Compose · Material 3'],
                    ['Playback', 'Media3 · ExoPlayer'],
                    ['Analysis', 'C++ / JNI · ONNX Runtime'],
                    ['Sources', 'QuickJS modules'],
                    ['License', 'GPL-3.0'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex flex-col gap-0.5 border-b border-white/[0.05] pb-2.5 last:border-0">
                      <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/30">
                        {k}
                      </dt>
                      <dd className="text-[12.5px] font-medium text-white/80">{v}</dd>
                    </div>
                  ))}
                </dl>

                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2.5 text-[12.5px] text-white/75 transition-colors hover:bg-white/[0.09] hover:text-white"
                >
                  Read the source
                </a>
              </div>
            </GlassCard>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
