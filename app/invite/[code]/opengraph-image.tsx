import { ImageResponse } from 'next/og'
import { OG_SIZE, OgFrame, ogFonts, ogLogo } from '@/lib/og'

export const alt = 'Join a BitChord Jam'
export const size = OG_SIZE
export const contentType = 'image/png'

/**
 * A Jam invite's preview. The code is the one thing the recipient needs, so it
 * is the biggest thing on the card: one large mono tile per character, above
 * a smaller line saying what it is for.
 */
export default async function InviteOpenGraphImage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const inviteCode = /^[A-Za-z0-9]{6}$/.test(code) ? code.toUpperCase() : '------'

  const [fonts, logo] = await Promise.all([
    ogFonts('BitChord JamYou’re invited to listen together.Invite code', inviteCode),
    ogLogo(),
  ])

  return new ImageResponse(
    (
      <OgFrame logo={logo}>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto' }}>
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>
            BitChord Jam
          </div>
          <div style={{ display: 'flex', marginTop: 12, fontSize: 56, fontWeight: 800, letterSpacing: -1.8, lineHeight: 1.08 }}>
            You’re invited to listen together.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 34 }}>
          <div style={{ display: 'flex', fontSize: 26, fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>
            Invite code
          </div>
          <div style={{ display: 'flex', marginTop: 14 }}>
            {inviteCode.split('').map((char, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 112,
                  height: 132,
                  marginLeft: i ? 14 : 0,
                  borderRadius: 22,
                  border: '1.5px solid rgba(255,255,255,0.2)',
                  background: 'rgba(0,0,0,0.4)',
                  fontFamily: 'JetBrains Mono',
                  fontSize: 84,
                  fontWeight: 600,
                  color: '#fff',
                }}
              >
                {char}
              </div>
            ))}
          </div>
        </div>
      </OgFrame>
    ),
    { ...size, fonts },
  )
}
