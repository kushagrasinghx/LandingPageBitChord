import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { ReactNode } from 'react'

/**
 * Shared look for every link preview (Open Graph / Twitter card): the site's
 * current surface — a black canvas holding a rounded panel lit by the hero's
 * dark amber mesh, the wordmark in its corner — so a shared link and the page
 * it opens read as the same product.
 *
 * Previews are shown at thumbnail size in feeds and chats, so everything here
 * is large: nothing under 26px.
 */

export const OG_SIZE = { width: 1200, height: 630 }

/** The hero's mesh colours, as on the site. */
const MESH = [
  { color: '74,42,6', x: '12%', y: '8%', r: '58%' },
  { color: '58,29,5', x: '86%', y: '18%', r: '52%' },
  { color: '42,36,8', x: '30%', y: '96%', r: '50%' },
  { color: '61,34,7', x: '92%', y: '92%', r: '50%' },
]

/**
 * A Google font as TrueType, which is what the image renderer takes. Asked
 * for only the characters actually drawn, so each request is tiny. Null when
 * Google cannot be reached; the card then falls back to the default face.
 */
async function googleFont(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(
        `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weight}&text=${encodeURIComponent(text)}`,
      )
    ).text()
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1]
    if (!url) return null
    const res = await fetch(url)
    return res.ok ? await res.arrayBuffer() : null
  } catch {
    return null
  }
}

type OgFont = { name: string; data: ArrayBuffer; weight: 400 | 500 | 600 | 700 | 800; style: 'normal' }

/** The site's faces: Plus Jakarta Sans for text, JetBrains Mono for code. */
export async function ogFonts(text: string, monoText = ''): Promise<OgFont[]> {
  const wanted = [
    ...(text
      ? ([
          ['Plus Jakarta Sans', 500, text],
          ['Plus Jakarta Sans', 700, text],
          ['Plus Jakarta Sans', 800, text],
        ] as const)
      : []),
    ...(monoText ? ([['JetBrains Mono', 600, monoText]] as const) : []),
  ]
  const loaded = await Promise.all(wanted.map(([family, weight, chars]) => googleFont(family, weight, chars)))
  return loaded.flatMap((data, i) =>
    data
      ? [{ name: wanted[i]![0], data, weight: wanted[i]![1] as OgFont['weight'], style: 'normal' as const }]
      : [],
  )
}

/** The wordmark from /public, inlined so the renderer needs no network for it. */
export async function ogLogo(): Promise<string | null> {
  try {
    const png = await readFile(join(process.cwd(), 'public', 'FullLogoTransparent.png'))
    return `data:image/png;base64,${png.toString('base64')}`
  } catch {
    return null
  }
}

/** The rounded, mesh-lit panel every card is drawn in. */
export function OgFrame({ logo, corner, children }: { logo: string | null; corner?: ReactNode; children: ReactNode }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        padding: 28,
        background: '#000',
        fontFamily: 'Plus Jakarta Sans',
        color: '#fff',
      }}
    >
      <div
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '52px 64px 56px',
          borderRadius: 36,
          border: '1.5px solid rgba(255,255,255,0.12)',
          backgroundColor: '#060504',
          backgroundImage: [
            ...MESH.map(({ color, x, y, r }) => `radial-gradient(circle at ${x} ${y}, rgba(${color},0.95) 0%, rgba(${color},0) ${r})`),
            // Keeps the field on the dark side, deepest at the edges.
            'radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 100%)',
          ].join(', '),
          overflow: 'hidden',
        }}
      >
        {/* Head: the wordmark, and an optional line opposite it. */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" width={168} height={52} style={{ marginLeft: -6 }} />
          ) : (
            <div style={{ display: 'flex', fontSize: 34, fontWeight: 800 }}>BitChord</div>
          )}
          {corner ? (
            <div style={{ display: 'flex', fontSize: 26, fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>{corner}</div>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  )
}

/** A button-shaped label, filled like the site's Download or outlined like its Star. */
export function OgPill({ children, solid = false }: { children: ReactNode; solid?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 60,
        padding: '0 28px',
        borderRadius: 999,
        fontSize: 26,
        fontWeight: 700,
        ...(solid
          ? { background: '#fff', color: '#000' }
          : { border: '1.5px solid rgba(255,255,255,0.3)', color: '#fff' }),
      }}
    >
      {children}
    </div>
  )
}
