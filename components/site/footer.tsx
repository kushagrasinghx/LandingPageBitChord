import Link from 'next/link'
import { Star } from 'lucide-react'
import { LogoWordmark } from '@/components/ui/logo'
import { RELEASES_URL, REPO_URL } from '@/lib/github'

const PROFILE_URL = 'https://github.com/kushagrasinghx'

type FooterLink = { label: string; href: string; external?: boolean; star?: boolean }

/**
 * Minimal site footer: logo and a single row of text links, the legal fine
 * print, and a sign-off.
 */
export function Footer({ stars }: { stars: number | null }) {
  const links: FooterLink[] = [
    {
      label: stars !== null ? `Star this repo (${stars.toLocaleString('en-US')})` : 'Star this repo',
      href: REPO_URL,
      external: true,
      star: true,
    },
    { label: 'Releases', href: RELEASES_URL, external: true },
    { label: 'GitHub', href: REPO_URL, external: true },
    { label: 'Addon Docs', href: '/docs' },
    { label: 'Discord', href: 'https://discord.gg/pSafNTyKZx', external: true },
    { label: 'Ko-fi', href: 'https://ko-fi.com/kushagrasinghx', external: true },
    { label: 'PayPal', href: 'https://paypal.me/kuxhagrasingh', external: true },
    { label: 'GPL-3.0', href: `${REPO_URL}/blob/main/LICENSE`, external: true },
  ]

  return (
    <footer className="mt-20 border-t-[0.8px] border-white/10">
      <div className="page-container pb-12 pt-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Link href="#top" aria-label="BitChord home" className="inline-flex w-fit">
            {/* -my-2 absorbs the artwork's transparent padding; see LogoWordmark. */}
            <LogoWordmark className="-my-2 h-8" />
          </Link>

          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
              {links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="inline-flex items-center gap-1.5 text-white/50 transition-colors hover:text-white"
                  >
                    {link.star ? <Star className="size-3.5" aria-hidden /> : null}
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-6 max-w-[760px] space-y-2 text-[12px] leading-[18px] text-white/40">
          <p>
            BitChord is not affiliated with, endorsed by, or connected to YouTube or Google in any
            way. Use it at your own discretion.
          </p>
          <p>
            The album artwork, titles and artist names shown on this site are taken from publicly
            available Apple Music pages and are displayed for illustration only. All of it remains
            the property of Apple and the respective artists, labels and rights holders. BitChord
            does not own this content and is not affiliated with Apple.
          </p>
        </div>

        <p className="mt-6 text-[12px] italic text-white/50">
          Built with <span role="img" aria-label="love">❤️</span> by{' '}
          <a
            href={PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            @kushagrasinghx
          </a>
        </p>
      </div>
    </footer>
  )
}
