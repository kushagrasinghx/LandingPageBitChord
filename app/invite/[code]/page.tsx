import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { InviteFallback } from './invite-fallback'

const JAM_CODE = /^[A-Za-z0-9]{6}$/
const TITLE = 'Join my BitChord Jam'
const DESCRIPTION = 'Open this invite in BitChord and listen together in sync.'

type InvitePageProps = {
  params: Promise<{ code: string }>
}

export async function generateMetadata({ params }: InvitePageProps): Promise<Metadata> {
  const { code } = await params
  if (!JAM_CODE.test(code)) return { robots: { index: false, follow: false } }

  const path = `/invite/${code.toUpperCase()}`
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: path },
    robots: { index: false, follow: true },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: path,
      siteName: 'BitChord',
      type: 'website',
      images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: TITLE,
      description: DESCRIPTION,
      images: ['/opengraph-image'],
    },
  }
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { code } = await params
  if (!JAM_CODE.test(code)) notFound()

  return <InviteFallback />
}
