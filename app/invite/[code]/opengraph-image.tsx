import { ImageResponse } from 'next/og'

export const alt = 'Join a BitChord Jam'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function InviteOpenGraphImage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const inviteCode = /^[A-Za-z0-9]{6}$/.test(code) ? code.toUpperCase() : '------'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#000',
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          padding: '72px 88px',
          color: '#fff',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 25,
            letterSpacing: 6,
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.48)',
          }}
        >
          BitChord Jam invite
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 26,
            maxWidth: 920,
            fontSize: 78,
            fontWeight: 800,
            letterSpacing: -3,
            lineHeight: 1.05,
          }}
        >
          You’re invited to listen together.
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            alignSelf: 'flex-start',
            marginTop: 44,
            padding: '18px 28px',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 18,
            background: 'rgba(255,255,255,0.06)',
            fontSize: 23,
            color: 'rgba(255,255,255,0.55)',
          }}
        >
          Invite code
          <span
            style={{
              marginLeft: 22,
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: 8,
              color: '#fff',
            }}
          >
            {inviteCode}
          </span>
        </div>
      </div>
    ),
    size,
  )
}
