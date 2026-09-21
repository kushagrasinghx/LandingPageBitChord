'use client'

import { useState } from 'react'
import { Check, Copy, ExternalLink, Music2 } from 'lucide-react'
import { Backdrop } from '@/components/site/backdrop'
import { LogoWordmark } from '@/components/ui/logo'

const GITHUB_REPOSITORY = 'https://github.com/kushagrasinghx/BitChord/'

export function InviteFallback({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      const input = document.createElement('textarea')
      input.value = code
      input.style.position = 'fixed'
      input.style.opacity = '0'
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      input.remove()
    }

    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Backdrop />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center px-6 py-6 sm:px-8">
        <a href="/" aria-label="Go to the BitChord homepage">
          <LogoWordmark className="-my-2 h-10" />
        </a>
      </header>

      <main className="relative z-10 grid min-h-[calc(100svh-88px)] place-items-center px-5 pb-20 pt-8 sm:px-8">
        <section className="w-full max-w-lg text-center" aria-labelledby="invite-title">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] shadow-[0_18px_60px_rgba(255,255,255,0.08)]">
            <Music2 className="size-6 text-white" aria-hidden />
          </div>

          <p className="mt-6 font-mono text-xs font-medium uppercase tracking-[0.28em] text-white/45">
            BitChord Jam invite
          </p>
          <h1
            id="invite-title"
            className="mt-4 text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl"
          >
            You’re invited to listen together.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/55 sm:text-base">
            Open BitChord and enter this invite code to join the Jam.
          </p>

          <div className="mt-9 rounded-3xl border border-white/15 bg-white/[0.045] p-3 text-left shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-4">
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/45 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35">
                  Invite code
                </p>
                <p className="mt-1.5 font-mono text-2xl font-semibold tracking-[0.24em] text-white sm:text-3xl">
                  {code}
                </p>
              </div>
              <button
                type="button"
                onClick={copyCode}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.12]"
                aria-label={copied ? 'Invite code copied' : `Copy invite code ${code}`}
              >
                {copied ? (
                  <Check className="size-4" aria-hidden />
                ) : (
                  <Copy className="size-4" aria-hidden />
                )}
                {copied ? 'Copied' : 'Copy Code'}
              </button>
            </div>

            <div className="px-2 pb-2 pt-6 text-center sm:px-4">
              <p className="text-sm leading-6 text-white/55">
                Looks like BitChord is not installed on your device.
              </p>
              <a
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition-transform hover:scale-[1.01] active:scale-[0.99]"
                href={GITHUB_REPOSITORY}
                target="_blank"
                rel="noopener noreferrer"
              >
                Install BitChord
                <ExternalLink className="size-4" aria-hidden />
              </a>
            </div>
          </div>

          <p className="sr-only" role="status" aria-live="polite">
            {copied ? `Invite code ${code} copied to clipboard.` : ''}
          </p>
        </section>
      </main>
    </>
  )
}
