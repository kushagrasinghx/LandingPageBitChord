import type { Metadata } from 'next'
import { DocsPage } from '@/components/docs/docs-page'

export const metadata: Metadata = {
  title: 'Addon developer guide',
  description:
    'Build a BitChord addon with the manifest, search, stream, quality, Dolby Atmos, download permission, and lossless output contracts.',
  alternates: { canonical: '/docs' },
}

export default function Page() {
  // Inter and JetBrains Mono come from the root layout; no extra font here.
  return <DocsPage />
}
