import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { SITE_URL } from '@/lib/site'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700', '800'],
})

/**
 * The docs page's typeface, and the stand-in for SF Pro Display (the BitChord
 * app's typeface) on the hero's phone screen. SF Pro itself is only used where
 * the OS provides it (Apple devices); its license does not allow serving it as
 * a web font.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800'],
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono-jb',
  weight: ['400', '500', '600'],
})

const TITLE = 'BitChord - Aesthetic Music Streaming'
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
    'aesthetic music streaming',
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
  // Icons come from the file conventions in `app/`: `favicon.ico` (16/32/48,
  // served at the root where Google's favicon crawler always looks),
  // `icon.svg` and `apple-icon.png`. Next emits their <link> tags with a
  // content hash in the URL, so replacing the artwork busts every cache.
}

export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${inter.variable} ${jetbrains.variable}`}>
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
