/**
 * Global background stack, rendered once behind the whole page.
 *
 * Four layers, bottom to top: the void base, a sub-pixel dot matrix, coarse grid
 * lines, and three large radial mesh gradients in the signal palette. Fixed and
 * inert so it costs nothing on scroll.
 */
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-50 overflow-hidden">
      <div className="absolute inset-0 bg-void" />

      {/* Sub-pixel dot matrix, faded out toward the bottom of the viewport. */}
      <div className="absolute inset-0 dot-matrix opacity-[0.55] mask-fade-b" />

      {/* Coarse architectural grid. */}
      <div className="absolute inset-0 grid-lines opacity-40 mask-fade-b" />

      {/* Multi-layer radial mesh. */}
      <div
        className="absolute -top-[28rem] left-1/2 h-[70rem] w-[80rem] -translate-x-1/2 rounded-full opacity-55 blur-[120px]"
        style={{
          background:
            'radial-gradient(closest-side, rgba(124,58,237,0.5), rgba(124,58,237,0) 70%)',
        }}
      />
      <div
        className="absolute -left-64 top-[26rem] h-[46rem] w-[46rem] rounded-full opacity-40 blur-[130px]"
        style={{
          background: 'radial-gradient(closest-side, rgba(6,182,212,0.45), rgba(6,182,212,0) 70%)',
        }}
      />
      <div
        className="absolute -right-56 top-[62rem] h-[42rem] w-[42rem] rounded-full opacity-35 blur-[130px]"
        style={{
          background:
            'radial-gradient(closest-side, rgba(236,72,153,0.42), rgba(236,72,153,0) 70%)',
        }}
      />

      {/* Vignette to keep the edges from feeling washed out. */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,transparent_35%,rgba(7,7,9,0.85)_100%)]" />
    </div>
  )
}
