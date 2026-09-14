'use client'

import { useEffect } from 'react'

const GITHUB_REPOSITORY = 'https://github.com/kushagrasinghx/BitChord/'

/**
 * Social crawlers keep the server-rendered BitChord metadata because they do
 * not run this effect. A person whose device did not hand the link to the app
 * is forwarded to the download/source page as soon as the HTML is hydrated.
 */
export function InviteFallback() {
  useEffect(() => {
    window.location.replace(GITHUB_REPOSITORY)
  }, [])

  return (
    <main className="grid min-h-screen place-items-center bg-black px-6 text-white">
      <div className="max-w-md text-center">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-white/40">BitChord Jam</p>
        <h1 className="mt-5 text-4xl font-bold tracking-tight">Opening your invite…</h1>
        <p className="mt-4 text-sm leading-relaxed text-white/50">
          BitChord is not available on this device. Continue to GitHub to download the Android app.
        </p>
        <a
          className="mt-8 inline-flex rounded-full border border-white/20 bg-white px-6 py-3 text-sm font-semibold text-black"
          href={GITHUB_REPOSITORY}
        >
          Get BitChord on GitHub
        </a>
      </div>
    </main>
  )
}
