import { ImageResponse } from 'next/og'

export const alt = 'BitChord — the open-source YouTube Music client for Android'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * Social card, generated at build time rather than shipped as a binary.
 *
 * Deliberately plain: link previews are rendered at thumbnail size in a feed,
 * so anything smaller than the headline is unreadable and only adds noise. The
 * grid echoes the page's own backdrop so the card and the destination read as
 * the same surface.
 */
export default function OpengraphImage() {
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
          padding: '0 88px',
          color: '#fff',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 26,
            letterSpacing: 6,
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          BitChord
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 24,
            fontSize: 92,
            fontWeight: 800,
            letterSpacing: -4,
            lineHeight: 1.04,
          }}
        >
          <span>Instant Stream.</span>
          <span style={{ color: 'rgba(255,255,255,0.45)' }}>No Compromise.</span>
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 34,
            fontSize: 30,
            color: 'rgba(255,255,255,0.62)',
          }}
        >
          The open-source YouTube Music client for people who actually listen.
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 44,
            fontSize: 22,
            letterSpacing: 3,
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.35)',
          }}
        >
          Android · Free · GPL-3.0 · No ads · No tracking
        </div>
      </div>
    ),
    size,
  )
}
