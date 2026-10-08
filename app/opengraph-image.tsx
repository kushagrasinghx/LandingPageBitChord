import { ImageResponse } from 'next/og'
import { OG_SIZE, OgFrame, OgPill, ogFonts, ogLogo } from '@/lib/og'

export const alt = 'BitChord — Instant Stream. No Compromise.'
export const size = OG_SIZE
export const contentType = 'image/png'

const TAGLINE = 'A modern YouTube music client with clean aesthetics inspired from Apple Music'
const PLATFORMS = 'Android · Windows · Linux · macOS'

/**
 * The site's link preview, in the current hero's language: the two-tone
 * headline, the tagline from the closing section, and the same two buttons.
 * Generated at build time rather than shipped as a binary.
 */
export default async function OpengraphImage() {
  const [fonts, logo] = await Promise.all([
    ogFonts(`Instant Stream. No Compromise.${TAGLINE}Download the appStar on GitHub${PLATFORMS}BitChord`),
    ogLogo(),
  ])

  return new ImageResponse(
    (
      <OgFrame logo={logo} corner={PLATFORMS}>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', fontSize: 84, fontWeight: 800, letterSpacing: -3, lineHeight: 1.02 }}>
            <span>Instant Stream.</span>
            <span style={{ color: 'rgba(255,255,255,0.45)' }}>No Compromise.</span>
          </div>
          <div style={{ display: 'flex', marginTop: 22, maxWidth: 820, fontSize: 30, fontWeight: 500, lineHeight: 1.35, color: 'rgba(255,255,255,0.62)' }}>
            {TAGLINE}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginTop: 40 }}>
          <OgPill solid>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 12 }}>
              <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
            </svg>
            Download the app
          </OgPill>
          <div style={{ display: 'flex', width: 14 }} />
          <OgPill>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round" style={{ marginRight: 12 }}>
              <path d="M12 2.8l2.8 5.7 6.3.9-4.6 4.4 1.1 6.3L12 17.1l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z" />
            </svg>
            Star on GitHub
          </OgPill>
        </div>
      </OgFrame>
    ),
    { ...size, fonts },
  )
}
