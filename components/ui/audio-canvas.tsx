'use client'

import { useEffect, useRef } from 'react'

type Node = {
  /** Rest position — particles always spring back here. */
  homeX: number
  homeY: number
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  /** Phase offset so the idle bob isn't synchronized across the field. */
  phase: number
  /** Drift speed multiplier. */
  drift: number
  /** 0 violet · 1 cyan · 2 magenta */
  tint: number
}

const TINTS = [
  [167, 139, 250], // violet-400
  [34, 211, 238], // cyan-400
  [244, 114, 182], // pink-400
] as const

/** Pointer influence radius, px. */
const CURSOR_RADIUS = 190
/** Max px a node is displaced by the cursor. */
const PUSH = 46
/** Spring constant pulling nodes home. */
const K = 0.045
const DAMPING = 0.86
/** Draw a link when two nodes are closer than this, px. */
const LINK_DIST = 108
/** Bars in the synthetic spectrum band. */
const BAR_COUNT = 72

/**
 * Hero background: a field of floating audio-spectrum nodes with cursor physics,
 * plus a synthetic spectrum band along the bottom edge.
 *
 * Everything is one `<canvas>` and one rAF loop. Deliberately synthetic — there's
 * no audio to analyse on a landing page, so the "spectrum" is a sum of sines
 * shaped like a real music FFT (loud low end, decaying highs) and nudged by the
 * pointer's x position.
 *
 * Costs are kept bounded: node count scales with viewport area but caps out, DPR
 * caps at 2, the loop stops when the canvas scrolls out of view, and the whole
 * thing renders a single static frame under `prefers-reduced-motion`.
 */
export function AudioCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let dpr = 1
    let nodes: Node[] = []
    let raf = 0
    let running = true
    let t = 0

    // Pointer state. Kept off-screen until the user actually moves, so the field
    // starts calm rather than clumped around a phantom cursor at 0,0.
    const pointer = { x: -9999, y: -9999, active: false }
    // Smoothed pointer, so a fast flick doesn't snap the field.
    const smooth = { x: -9999, y: -9999 }

    function build() {
      const rect = canvas!.getBoundingClientRect()
      width = Math.max(1, rect.width)
      height = Math.max(1, rect.height)
      dpr = Math.min(2, window.devicePixelRatio || 1)

      canvas!.width = Math.floor(width * dpr)
      canvas!.height = Math.floor(height * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)

      // ~1 node per 13k px², clamped so phones stay light and ultrawides stay sane.
      const count = Math.round(Math.min(110, Math.max(34, (width * height) / 13000)))

      nodes = Array.from({ length: count }, (_, i) => {
        const homeX = Math.random() * width
        // Bias upward: the lower band is occupied by the spectrum bars.
        const homeY = Math.random() ** 0.85 * height * 0.92
        return {
          homeX,
          homeY,
          x: homeX,
          y: homeY,
          vx: 0,
          vy: 0,
          radius: 0.7 + Math.random() * 1.9,
          phase: Math.random() * Math.PI * 2,
          drift: 0.35 + Math.random() * 0.9,
          tint: i % 7 === 0 ? 2 : i % 3 === 0 ? 1 : 0,
        }
      })
    }

    /**
     * Synthetic spectrum magnitude for bar `i` at time `t`, in 0..1.
     * Three detuned sines give a non-repeating envelope; the `pow` term applies
     * the low-end-heavy tilt real music spectra have.
     */
    function magnitude(i: number, time: number) {
      const n = i / BAR_COUNT
      const tilt = Math.pow(1 - n, 1.55)
      const wave =
        0.5 +
        0.28 * Math.sin(time * 1.7 + i * 0.38) +
        0.18 * Math.sin(time * 2.9 + i * 0.13) +
        0.14 * Math.sin(time * 0.9 + i * 0.71)
      return Math.max(0.04, Math.min(1, wave * tilt))
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height)

      // Ease the working pointer toward the real one.
      if (pointer.active) {
        if (smooth.x < -1000) {
          smooth.x = pointer.x
          smooth.y = pointer.y
        } else {
          smooth.x += (pointer.x - smooth.x) * 0.14
          smooth.y += (pointer.y - smooth.y) * 0.14
        }
      }

      /* ------------------------------- nodes ------------------------------- */

      for (const node of nodes) {
        // Idle drift: a slow Lissajous bob around home.
        const bobX = Math.sin(t * 0.22 * node.drift + node.phase) * 9
        const bobY = Math.cos(t * 0.17 * node.drift + node.phase * 1.3) * 11
        const targetX = node.homeX + bobX
        const targetY = node.homeY + bobY

        // Spring toward the drifting target.
        node.vx += (targetX - node.x) * K
        node.vy += (targetY - node.y) * K

        // Cursor repulsion, falling off smoothly to zero at CURSOR_RADIUS.
        if (pointer.active) {
          const dx = node.x - smooth.x
          const dy = node.y - smooth.y
          const dist = Math.hypot(dx, dy)
          if (dist < CURSOR_RADIUS && dist > 0.001) {
            const falloff = 1 - dist / CURSOR_RADIUS
            const force = falloff * falloff * PUSH
            node.vx += (dx / dist) * force * 0.09
            node.vy += (dy / dist) * force * 0.09
          }
        }

        node.vx *= DAMPING
        node.vy *= DAMPING
        node.x += node.vx
        node.y += node.vy
      }

      /* ------------------------------- links ------------------------------- */

      ctx!.lineWidth = 0.6
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]!
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]!
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 > LINK_DIST * LINK_DIST) continue
          const alpha = (1 - Math.sqrt(d2) / LINK_DIST) * 0.16
          ctx!.strokeStyle = `rgba(148,163,255,${alpha.toFixed(3)})`
          ctx!.beginPath()
          ctx!.moveTo(a.x, a.y)
          ctx!.lineTo(b.x, b.y)
          ctx!.stroke()
        }
      }

      // Links from the cursor to nearby nodes — makes the pointer feel connected
      // to the field rather than just shoving it.
      if (pointer.active) {
        for (const node of nodes) {
          const d = Math.hypot(node.x - smooth.x, node.y - smooth.y)
          if (d > CURSOR_RADIUS) continue
          const alpha = (1 - d / CURSOR_RADIUS) * 0.3
          ctx!.strokeStyle = `rgba(34,211,238,${alpha.toFixed(3)})`
          ctx!.beginPath()
          ctx!.moveTo(smooth.x, smooth.y)
          ctx!.lineTo(node.x, node.y)
          ctx!.stroke()
        }
      }

      /* ------------------------------- dots -------------------------------- */

      for (const node of nodes) {
        const tint = TINTS[node.tint]!
        const [r, g, b] = tint
        // Nodes near the cursor brighten and swell slightly.
        const prox = pointer.active
          ? Math.max(0, 1 - Math.hypot(node.x - smooth.x, node.y - smooth.y) / CURSOR_RADIUS)
          : 0
        const radius = node.radius * (1 + prox * 0.85)
        const alpha = 0.28 + prox * 0.55

        ctx!.beginPath()
        ctx!.arc(node.x, node.y, radius, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`
        ctx!.fill()

        // Bloom on the nodes the cursor is actively exciting.
        if (prox > 0.25) {
          ctx!.beginPath()
          ctx!.arc(node.x, node.y, radius * 4.5, 0, Math.PI * 2)
          ctx!.fillStyle = `rgba(${r},${g},${b},${(prox * 0.06).toFixed(3)})`
          ctx!.fill()
        }
      }

      /* ----------------------------- spectrum ------------------------------ */

      const bandHeight = Math.min(150, height * 0.26)
      const bandTop = height - bandHeight
      const barW = width / BAR_COUNT

      for (let i = 0; i < BAR_COUNT; i++) {
        let m = magnitude(i, t)

        // The pointer's x acts like a boost band on the spectrum.
        if (pointer.active) {
          const barCx = i * barW + barW / 2
          const d = Math.abs(barCx - smooth.x)
          if (d < 220) m = Math.min(1, m + (1 - d / 220) ** 2 * 0.55)
        }

        const h = m * bandHeight
        const x = i * barW
        const grad = ctx!.createLinearGradient(0, bandTop + bandHeight - h, 0, bandTop + bandHeight)
        grad.addColorStop(0, `rgba(34,211,238,${(0.4 * m).toFixed(3)})`)
        grad.addColorStop(0.55, `rgba(124,58,237,${(0.22 * m).toFixed(3)})`)
        grad.addColorStop(1, 'rgba(124,58,237,0)')
        ctx!.fillStyle = grad
        ctx!.fillRect(x + barW * 0.28, bandTop + bandHeight - h, barW * 0.44, h)
      }
    }

    function frame() {
      if (!running) return
      t += 0.016
      draw()
      raf = requestAnimationFrame(frame)
    }

    /* ------------------------------- wiring -------------------------------- */

    function onPointerMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect()
      pointer.x = e.clientX - rect.left
      pointer.y = e.clientY - rect.top
      pointer.active = true
    }

    function onPointerLeave() {
      pointer.active = false
      smooth.x = -9999
      smooth.y = -9999
    }

    build()

    if (reduced) {
      // One static frame: the composition still reads, nothing moves.
      draw()
      return () => {}
    }

    // Track the pointer across the whole window, not just the canvas, so the
    // field responds while the cursor is over hero text sitting on top of it.
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerleave', onPointerLeave)

    const ro = new ResizeObserver(() => build())
    ro.observe(canvas)

    // Stop burning frames once the hero is scrolled past.
    const io = new IntersectionObserver(
      ([entry]) => {
        const visible = entry?.isIntersecting ?? true
        if (visible && !running) {
          running = true
          raf = requestAnimationFrame(frame)
        } else if (!visible && running) {
          running = false
          cancelAnimationFrame(raf)
        }
      },
      { threshold: 0 },
    )
    io.observe(canvas)

    raf = requestAnimationFrame(frame)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerleave', onPointerLeave)
      ro.disconnect()
      io.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
      // Never intercept clicks: hero CTAs sit above this layer.
      style={{ pointerEvents: 'none' }}
    />
  )
}
