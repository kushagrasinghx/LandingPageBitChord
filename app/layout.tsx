import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { REPO_URL } from '@/lib/github'

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

const TITLE = 'BitChord — Instant Stream. Seamless Lossless. No Compromise.'
const DESCRIPTION =
  'The open-source YouTube Music client that starts playback instantly, then promotes your track to Hi-Res FLAC mid-playback without a single hitch. Beat-matched Automix, word-synced lyrics, Discord Rich Presence. Free, GPLv3, no ads, no tracking.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  applicationName: 'BitChord',
  keywords: [
    'BitChord',
    'YouTube Music client',
    'FLAC',
    'lossless audio',
    'Android music player',
    'open source',
    'Automix',
    'synced lyrics',
    'Discord Rich Presence',
  ],
  authors: [{ name: 'kushagrasinghx', url: 'https://github.com/kushagrasinghx' }],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: REPO_URL,
    siteName: 'BitChord',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
  icons: {
    // Inline SVG favicon: a waveform mark, no binary asset to ship.
    icon: [
      {
        url:
          'data:image/svg+xml,' +
          encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="g" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#7C3AED"/><stop offset=".5" stop-color="#06B6D4"/><stop offset="1" stop-color="#EC4899"/></linearGradient></defs><rect width="32" height="32" rx="8" fill="#070709"/><g fill="url(#g)"><rect x="6" y="13" width="3" height="6" rx="1.5"/><rect x="11.5" y="9" width="3" height="14" rx="1.5"/><rect x="17" y="6" width="3" height="20" rx="1.5"/><rect x="22.5" y="11" width="3" height="10" rx="1.5"/></g></svg>`,
          ),
        type: 'image/svg+xml',
      },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#070709',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${jetbrains.variable}`}>
      <body className="antialiased">
        <a
          href="#features"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-black"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  )
}
