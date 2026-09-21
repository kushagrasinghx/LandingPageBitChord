import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import { DocsPage } from '@/components/docs/docs-page'

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-docs',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Addon developer guide',
  description:
    'Build a BitChord addon with the manifest, search, stream, quality, and Dolby Atmos contracts.',
  alternates: { canonical: '/docs' },
}

export default function Page() {
  return (
    <div className={dmSans.variable}>
      <DocsPage />
    </div>
  )
}
