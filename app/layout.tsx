import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { SITE_URL } from '@/lib/site'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700', '800'],
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono-jb',
  weight: ['400', '500', '600'],
})

const TITLE = 'BitChord — Instant Stream. No Compromise.'
const DESCRIPTION =
  'The open-source YouTube Music client for Android. Beat-matched Automix, character-synced lyrics, Discord Rich Presence and a monthly Replay of everything you played. Free, GPLv3, no ads, no tracking.'

export const metadata: Metadata = {
  // Resolves every relative URL below — and the generated OG image — against
  // the deployed origin. Without it Next emits relative social tags, which
  // crawlers cannot follow.
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    // Any future route gets the brand appended rather than restating it.
    template: '%s · BitChord',
  },
  description: DESCRIPTION,
  applicationName: 'BitChord',
  category: 'music',
  keywords: [
    'BitChord',
    'YouTube Music client',
    'Android music player',
    'open source music player',
    'Automix',
    'synced lyrics',
    'Replay',
    'Discord Rich Presence',
    'Last.fm scrobbler',
    'APK download',
  ],
  authors: [{ name: 'kushagrasinghx', url: 'https://github.com/kushagrasinghx' }],
  creator: 'kushagrasinghx',
  publisher: 'kushagrasinghx',
  // One page, one canonical. Stops preview deployments and any ?query variant
  // from competing with production in the index.
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    // The site itself, not the repository — this is what gets crawled and
    // unfurled, and pointing it at GitHub handed the link equity away.
    url: '/',
    siteName: 'BitChord',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    creator: '@kushagrasinghx',
  },
  icons: {
    // `public/LogoTransparent.png` is misnamed — its bytes are an SVG, not a
    // PNG. Serving it as `image/png` is why no favicon rendered at all:
    // browsers trust the declared type and fail to decode. `favicon.svg` is
    // that same artwork under the right extension, plus a media query that
    // flips the white mark to black on a light tab strip so it stays visible
    // without giving it an opaque plate.
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${jetbrains.variable}`}>
      <body className="antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-black"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  )
}
