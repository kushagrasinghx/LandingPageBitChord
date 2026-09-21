import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { InviteFallback } from './invite-fallback'

const JAM_CODE = /^[A-Za-z0-9]{6}$/

type InvitePageProps = {
  params: Promise<{ code: string }>
}

export async function generateMetadata({ params }: InvitePageProps): Promise<Metadata> {
  const { code } = await params
  if (!JAM_CODE.test(code)) return { robots: { index: false, follow: false } }

  const inviteCode = code.toUpperCase()
  const path = `/invite/${inviteCode}`
  const title = `Join a BitChord Jam · ${inviteCode}`
  const description = `You’ve been invited to listen together on BitChord. Use invite code ${inviteCode} to join the Jam.`

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: path,
      siteName: 'BitChord',
      type: 'website',
      images: [
        {
          url: `${path}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `Join a BitChord Jam with invite code ${inviteCode}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${path}/opengraph-image`],
    },
  }
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { code } = await params
  if (!JAM_CODE.test(code)) notFound()

  return <InviteFallback code={code.toUpperCase()} />
}
