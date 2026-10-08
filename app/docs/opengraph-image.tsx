import { ImageResponse } from 'next/og'
import { OG_SIZE, OgFrame, ogFonts, ogLogo } from '@/lib/og'

export const alt = 'BitChord Docs — Build an addon for BitChord'
export const size = OG_SIZE
export const contentType = 'image/png'

const ROUTES = ['GET /manifest.json', 'GET /search', 'GET /stream/:id']

/**
 * The docs' own preview, so a shared guide link says what it is rather than
 * repeating the home page: the guide's title, its one-line summary, and the
 * three routes an addon serves, as code.
 */
export default async function DocsOpengraphImage() {
  const [fonts, logo] = await Promise.all([
    ogFonts(
      'Addon developer guideBuild an addon for BitChordConnect your own audio catalogue with three small JSON endpoints.',
      ROUTES.join(''),
    ),
    ogLogo(),
  ])

  return new ImageResponse(
    (
      <OgFrame logo={logo}>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto' }}>
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>
            Addon developer guide
          </div>
          <div style={{ display: 'flex', marginTop: 14, fontSize: 76, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1.05 }}>
            Build an addon for BitChord
          </div>
          <div style={{ display: 'flex', marginTop: 20, maxWidth: 860, fontSize: 30, fontWeight: 500, lineHeight: 1.35, color: 'rgba(255,255,255,0.62)' }}>
            Connect your own audio catalogue with three small JSON endpoints.
          </div>
        </div>

        <div style={{ display: 'flex', marginTop: 40 }}>
          {ROUTES.map((route, i) => (
            <div
              key={route}
              style={{
                display: 'flex',
                alignItems: 'center',
                height: 58,
                marginLeft: i ? 14 : 0,
                padding: '0 22px',
                borderRadius: 14,
                border: '1.5px solid rgba(255,255,255,0.16)',
                background: 'rgba(0,0,0,0.35)',
                fontFamily: 'JetBrains Mono',
                fontSize: 26,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.85)',
              }}
            >
              {route}
            </div>
          ))}
        </div>
      </OgFrame>
    ),
    { ...size, fonts },
  )
}
