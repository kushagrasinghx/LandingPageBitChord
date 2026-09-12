/**
 * Global background stack, rendered once behind the whole page.
 *
 * Three layers, bottom to top: the black canvas, a sub-pixel dot matrix and the
 * architectural grid. The grid is drawn at full strength and edge to edge —
 * it used to be a barely-there texture that faded out down the viewport, which
 * left the hero looking like the only part of the page with any structure.
 *
 * Because this layer is `fixed`, the grid stays put while content scrolls over
 * it, so it reads as the surface the page sits on rather than as decoration
 * attached to any one section.
 */
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-50 overflow-hidden">
      <div className="absolute inset-0 bg-canvas" />

      {/* Sub-pixel dot matrix, faded out toward the bottom of the viewport. */}
      <div className="absolute inset-0 dot-matrix opacity-40 mask-fade-b" />

      {/* Architectural grid — unmasked, so it carries across every section. */}
      <div className="absolute inset-0 grid-lines-strong" />

      {/* A single soft wash so the top of the page isn't dead flat. */}
      <div
        className="absolute -top-[26rem] left-1/2 h-[60rem] w-[76rem] -translate-x-1/2 rounded-full opacity-[0.18] blur-[130px]"
        style={{
          background:
            'radial-gradient(closest-side, rgba(255,255,255,0.5), rgba(255,255,255,0) 70%)',
        }}
      />

      {/* Vignette. Kept shallow and pushed to the corners — at its old strength
          it swallowed the grid everywhere except the middle of the screen. */}
      <div className="absolute inset-0 bg-[radial-gradient(125%_105%_at_50%_0%,transparent_62%,rgba(0,0,0,0.72)_100%)]" />
    </div>
  )
}
