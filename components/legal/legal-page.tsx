import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { LogoWordmark } from '@/components/ui/logo'
import { REPO_URL } from '@/lib/github'

/**
 * The frame for the privacy policy and terms of service: the docs page's slim
 * header, then one readable column of prose. Server-rendered and static — a
 * legal page has nothing to do in the browser.
 */
export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string
  /** When the text last changed, as it should read on the page. */
  updated: string
  intro: ReactNode
  children: ReactNode
}) {
  return (
    <div className="min-h-dvh bg-canvas text-fg">
      <header className="sticky top-0 z-50 h-14 border-b border-line bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-[1200px] items-center gap-4 px-6">
          <Link href="/" aria-label="BitChord home" className="inline-flex">
            {/* -my-1.5 absorbs the artwork's transparent padding; see LogoWordmark. */}
            <LogoWordmark className="-my-1.5 h-[34px] w-auto" />
          </Link>
          <nav aria-label="Site" className="ml-auto flex items-center gap-5 text-[14px]">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-fg-2 transition-colors hover:text-fg max-sm:hidden"
            >
              GitHub
            </a>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-fg-2 transition-colors hover:text-fg"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Back to site
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[760px] px-6 pb-24 pt-14">
        <h1 className="text-[34px] font-bold leading-tight tracking-[-0.02em] sm:text-[40px]">
          {title}
        </h1>
        <p className="mt-2 text-[13px] text-fg-2">Last updated {updated}</p>
        <div className="mt-8 text-[16px] leading-[26px] text-white/80">{intro}</div>
        <div className="legal-prose mt-10">{children}</div>

        <div className="mt-16 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-6 text-[13px] text-fg-2">
          <Link href="/privacy" className="transition-colors hover:text-fg">
            Privacy Policy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-fg">
            Terms of Service
          </Link>
          <Link href="/docs" className="transition-colors hover:text-fg">
            Addon Docs
          </Link>
          <a
            href={`${REPO_URL}/blob/main/LICENSE`}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-fg"
          >
            GPL-3.0
          </a>
        </div>
      </main>
    </div>
  )
}

/** A numbered section with an anchor, so a clause can be linked to directly. */
export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2>
        <a href={`#${id}`}>{title}</a>
      </h2>
      {children}
    </section>
  )
}
