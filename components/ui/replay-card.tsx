'use client'

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { artworkMesh, FALLBACK_MESH, type MeshColors } from '@/lib/artwork-palette'
import { cn } from '@/lib/utils'

/**
 * The Replay card from the BitChord app's Library page, rebuilt for the web
 * from its source (sharedUi/.../ui/replay/ReplayCard.kt, ReplayCreditCard;
 * MeshGradient.kt for the background, ReplayModel.kt for the content).
 *
 * Kept exactly: 85.6×54mm proportions (1.586:1), 20dp corners and a 16dp
 * shadow; the artwork's own mesh, drawn once and held still, deepened towards
 * the foot; "YOUR LISTENING EXPERIENCE" and the logo across the head; the
 * figure in polished ink with its emboss shadow and the label under it; the
 * cardholder and member-since date embossed in a monospace face.
 *
 * Added for the web: a spotlight that follows the cursor across the card and
 * lights its border, after React Bits' Spotlight Card
 * (reactbits.dev/components/spotlight-card).
 * The pointer position is written to CSS variables, not React state, so moving
 * over a card never re-renders it.
 */

export type ReplayCardData = {
  label: string
  value: string
  detail: string | null
  /** Same-origin image the mesh is sampled from. */
  artwork: string
}

/** The app's typeface (see the hero's phone screen); Inter elsewhere. */
const SF_STACK = '"SF Pro Display", -apple-system, BlinkMacSystemFont, var(--font-inter), system-ui, sans-serif'

/** FontFamily.Monospace on Android is Droid Sans Mono. */
const MONO_STACK = '"Droid Sans Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, var(--font-mono-jb), monospace'

/** PolishedInk: bright along the top edge, cooler below. */
const POLISHED_INK: CSSProperties = {
  backgroundImage: 'linear-gradient(to bottom, #FFFFFF, #F3F4F8, #C9CCD6)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  // EmbossShadow: #99000000 offset 2.5px, blur 4px. A text-shadow would paint
  // over the clipped gradient, so the shadow follows the glyphs as a filter.
  filter: 'drop-shadow(0 2.5px 2px rgb(0 0 0 / 0.6))',
}

/** MeshGradient anchors and their phase-0 offsets (drift held still). */
const ANCHORS = [
  [0.2, 0.25],
  [0.8, 0.2],
  [0.75, 0.8],
  [0.25, 0.75],
].map(([x, y], i) => [x! + 0.16 * Math.cos(i * 1.7), y! + 0.16 * Math.sin(i * 2.3)] as const)

const LOGO_PATH =
  'M6.73729,316.937C20.201,294.159 49.6986,286.649 72.4033,300.174H72.4277C237.603,398.282 510.121,407.302 667.823,359.439C693.147,351.759 719.927,366.055 727.602,391.378C735.276,416.715 720.992,443.477 695.649,451.176C514.618,506.132 213.674,495.514 23.5058,382.622C0.678772,369.103 -6.78757,339.685 6.73729,316.937ZM77.8135,154.865C89.38,136.046 113.982,130.11 132.77,141.676C270.528,226.369 480.519,250.891 643.46,201.43C664.592,195.047 686.911,206.957 693.324,228.052C699.689,249.184 687.774,271.46 666.679,277.886C480.555,334.36 249.169,307.004 90.9707,209.79C72.1827,198.224 66.247,173.628 77.8135,154.865ZM140.542,15.3012C149.722,0.246392 169.428,-4.52761 184.482,4.71335C304.811,78.2128 456.29,94.8593 634.684,54.101C651.874,50.1843 669.01,60.9551 672.927,78.1518C676.862,95.3486 666.134,112.484 648.9,116.401C453.677,161.021 286.219,141.799 151.129,59.2417C136.074,50.0006 131.301,30.3561 140.542,15.3012Z'

export function ReplayCreditCard({
  card,
  holder,
  memberSince,
  href,
  className,
}: {
  card: ReplayCardData
  holder: string
  memberSince: string | null
  href: string
  className?: string
}) {
  const ref = useRef<HTMLAnchorElement>(null)
  const [mesh, setMesh] = useState<MeshColors>(FALLBACK_MESH)

  useEffect(() => {
    let live = true
    artworkMesh(card.artwork).then((m) => live && setMesh(m))
    return () => {
      live = false
    }
  }, [card.artwork])

  const onMove = (e: PointerEvent<HTMLAnchorElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--spot-x', `${e.clientX - r.left}px`)
    el.style.setProperty('--spot-y', `${e.clientY - r.top}px`)
  }

  return (
    <a
      ref={ref}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onPointerMove={onMove}
      aria-label={`${card.label}: ${card.value}${card.detail ? `, ${card.detail}` : ''}`}
      className={cn(
        'group relative block aspect-[1.586] w-[300px] shrink-0 overflow-hidden rounded-[20px] shadow-[0_8px_24px_rgb(0_0_0/0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
        className,
      )}
      style={{ fontFamily: SF_STACK }}
    >
      {/* ---------------- MeshGradientBackground, animated = false ---------------- */}
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 scale-[1.3]"
          // blurRadius 34dp → a Gaussian sigma of about 20px.
          style={{ backgroundColor: mesh.base, filter: 'blur(20px)' }}
        >
          {mesh.colors.map((color, i) => (
            <div
              key={i}
              className="absolute aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: `${ANCHORS[i]![0] * 100}%`,
                top: `${ANCHORS[i]![1] * 100}%`,
                // radius = 0.62 × the card's longest side; width is the longest.
                width: '124%',
                background: `radial-gradient(closest-side, ${color}D9, ${color}00)`,
              }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/[0.38]" />
        </div>
      </div>

      {/* Deepened towards the foot, where the embossed lines are. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgb(0 0 0 / 0.18) 0%, rgb(0 0 0 / 0.30) 55%, rgb(0 0 0 / 0.55) 100%)',
        }}
      />

      {/* Spotlight that follows the cursor (React Bits Spotlight Card). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(260px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgb(255 255 255 / 0.22), transparent 70%)',
        }}
      />

      {/* The card's edge, as on React Bits' Spotlight Card: a faint hairline
          at rest, and the same spotlight drawn on the edge alone (masked to a
          1px ring), so the border lights up wherever the cursor is near it. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] p-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(180px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgb(255 255 255 / 0.9), transparent 70%)',
          mask: 'linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)',
          WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
        }}
      />

      <div className="relative flex h-full flex-col px-[18px] py-4 text-white">
        <div className="flex items-start">
          <p className="flex-1 text-[11px] font-bold uppercase leading-[13px] tracking-[1.4px] text-white/[0.72]">
            Your listening experience
          </p>
          <svg viewBox="0 0 730 484" className="ml-2.5 h-[22px] w-[34px] shrink-0 fill-white" aria-hidden>
            <path d={LOGO_PATH} />
          </svg>
        </div>

        <div className="flex-1" />

        <p className="line-clamp-2 text-[27px] font-extrabold leading-[30px]" style={POLISHED_INK}>
          {card.value}
        </p>
        <p className="text-[11px] font-bold uppercase tracking-[1.8px] text-white/65">{card.label}</p>

        <div style={{ flex: 0.85 }} />

        <div className="flex items-end">
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-[13px] font-semibold uppercase tracking-[1.6px]"
              style={{ ...POLISHED_INK, fontFamily: MONO_STACK }}
            >
              {holder}
            </p>
            {card.detail ? <p className="truncate text-[11px] font-medium text-white/60">{card.detail}</p> : null}
          </div>
          {memberSince ? (
            <div className="ml-2.5 flex flex-col items-end">
              <p className="text-right text-[7px] font-medium uppercase leading-[8px] tracking-[0.8px] text-white/55">
                Member
                <br />
                since
              </p>
              <p className="text-[12px] font-semibold tracking-[1.6px]" style={{ ...POLISHED_INK, fontFamily: MONO_STACK }}>
                {memberSince}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </a>
  )
}
