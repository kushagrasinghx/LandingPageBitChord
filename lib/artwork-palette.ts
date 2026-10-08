/**
 * The BitChord app's artwork palette, for the browser.
 *
 * Ported from the app (sharedUi/.../ui/graphics/PaletteQuantizer.kt and
 * ui/player/MeshGradient.kt): the image is shrunk to about 112×112, its pixels
 * reduced to 5 bits a channel and split by median cut into up to 24 swatches,
 * near-black / near-white / red-I-line colours are ignored, and the swatches
 * are taken by population, skipping any too close to one already kept. Four
 * come out; fewer are stretched to four by stepping hue and lightness.
 *
 * `meshColors` then applies the mesh's own tuning: saturation × 1.35 and
 * lightness held to 0.28–0.58, plus the dim base the blobs sit on.
 */

export type MeshColors = { base: string; colors: [string, string, string, string] }

/** MeshGradient.kt FallbackColors. */
const FALLBACK = ['#3A1C71', '#D76D77', '#2B5876', '#FFAF7B']

const RESIZE_AREA = 112 * 112
const MAX_COLORS = 24
const WORD = 5
const MASK = (1 << WORD) - 1

type Hsl = [number, number, number]
type Rgb = [number, number, number]

function rgbToHsl([r, g, b]: Rgb): Hsl {
  const rf = r / 255, gf = g / 255, bf = b / 255
  const max = Math.max(rf, gf, bf), min = Math.min(rf, gf, bf)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = max === rf ? (gf - bf) / d + (gf < bf ? 6 : 0) : max === gf ? (bf - rf) / d + 2 : (rf - gf) / d + 4
  h *= 60
  return [h, s, l]
}

function hslToRgb([h, s, l]: Hsl): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

const hex = ([r, g, b]: Rgb) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
const fromHex = (h: string): Rgb => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb

/** PaletteQuantizer.shouldIgnoreColor. */
function ignored(rgb: Rgb): boolean {
  const [h, s, l] = rgbToHsl(rgb)
  const nearRedILine = h >= 10 && h <= 37 && s <= 0.82
  return l <= 0.05 || l >= 0.95 || nearRedILine
}

type Box = { colors: number[]; counts: Map<number, number> }

const channel = (c: number, dim: number) => (dim === 0 ? (c >> (WORD * 2)) & MASK : dim === 1 ? (c >> WORD) & MASK : c & MASK)
const word5to8 = (v: number) => (v << 3) | (v >> 2)

/** Median cut over the 5-bit colour histogram, as the app's quantizer does. */
function quantize(pixels: Uint8ClampedArray, filtered: boolean): { rgb: Rgb; population: number }[] {
  const counts = new Map<number, number>()
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3]! < 128) continue
    const q = ((pixels[i]! >> 3) << (WORD * 2)) | ((pixels[i + 1]! >> 3) << WORD) | (pixels[i + 2]! >> 3)
    counts.set(q, (counts.get(q) ?? 0) + 1)
  }
  const colors = [...counts.keys()].filter(
    (c) => !filtered || !ignored([word5to8(channel(c, 0)), word5to8(channel(c, 1)), word5to8(channel(c, 2))]),
  )
  if (!colors.length) return []

  const average = (box: Box) => {
    let r = 0, g = 0, b = 0, n = 0
    for (const c of box.colors) {
      const k = box.counts.get(c)!
      r += channel(c, 0) * k
      g += channel(c, 1) * k
      b += channel(c, 2) * k
      n += k
    }
    return { rgb: [word5to8(Math.round(r / n)), word5to8(Math.round(g / n)), word5to8(Math.round(b / n))] as Rgb, population: n }
  }

  if (colors.length <= MAX_COLORS) return colors.map((c) => average({ colors: [c], counts }))

  const volume = (box: Box) => {
    const span = [0, 1, 2].map((d) => {
      const v = box.colors.map((c) => channel(c, d))
      return Math.max(...v) - Math.min(...v) + 1
    })
    return span[0]! * span[1]! * span[2]!
  }
  const boxes: Box[] = [{ colors, counts }]
  while (boxes.length < MAX_COLORS) {
    boxes.sort((a, b) => volume(b) - volume(a))
    const box = boxes.shift()!
    if (box.colors.length < 2) {
      boxes.push(box)
      break
    }
    // Split along the longest dimension at the population median.
    const ranges = [0, 1, 2].map((d) => {
      const v = box.colors.map((c) => channel(c, d))
      return Math.max(...v) - Math.min(...v)
    })
    const dim = ranges.indexOf(Math.max(...ranges))
    const sorted = [...box.colors].sort((a, b) => channel(a, dim) - channel(b, dim))
    const total = sorted.reduce((n, c) => n + counts.get(c)!, 0)
    let acc = 0
    let split = 0
    for (let i = 0; i < sorted.length; i++) {
      acc += counts.get(sorted[i]!)!
      if (acc >= total / 2) {
        split = Math.min(i, sorted.length - 2)
        break
      }
    }
    boxes.push({ colors: sorted.slice(0, split + 1), counts }, { colors: sorted.slice(split + 1), counts })
  }
  return boxes.map(average)
}

function closeTo(a: Rgb, b: Rgb): boolean {
  const ha = rgbToHsl(a), hb = rgbToHsl(b)
  const gap = Math.min(Math.abs(ha[0] - hb[0]), 360 - Math.abs(ha[0] - hb[0]))
  return gap < 15 && Math.abs(ha[2] - hb[2]) < 0.12
}

/** MeshGradient.paletteOf: four distinct colours, most populous first. */
function paletteOf(pixels: Uint8ClampedArray): Rgb[] {
  // Filtered first; if the filter leaves nothing (a cover that is all warm
  // browns or near-black), the app tries again with no filter at all.
  const found = quantize(pixels, true)
  const swatches = (found.length ? found : quantize(pixels, false))
    .sort((a, b) => b.population - a.population)
    .map((s) => s.rgb)
  const distinct: Rgb[] = []
  for (const c of swatches) if (!distinct.some((k) => closeTo(k, c))) distinct.push(c)
  if (!distinct.length) return FALLBACK.map(fromHex)
  if (distinct.length >= 4) return distinct.slice(0, 4)
  const out = [...distinct]
  for (let step = 1; out.length < 4; step++) {
    const [h, s, l] = rgbToHsl(distinct[(out.length - distinct.length) % distinct.length]!)
    out.push(hslToRgb([(h + 24 * step) % 360, s, Math.min(Math.max(l + 0.12 * step, 0.2), 0.7)]))
  }
  return out
}

/** The mesh's tuning (MeshGradient.tuned / dimmed) applied to a palette. */
export function meshColors(palette: Rgb[]): MeshColors {
  const tuned = [...palette, ...FALLBACK.map(fromHex)].slice(0, 4).map((c) => {
    const [h, s, l] = rgbToHsl(c)
    return hslToRgb([h, Math.min(s * 1.35, 1), Math.min(Math.max(l, 0.28), 0.58)])
  })
  const [h, s] = rgbToHsl(tuned[0]!)
  return { base: hex(hslToRgb([h, s, 0.12])), colors: tuned.map(hex) as MeshColors['colors'] }
}

export const FALLBACK_MESH = meshColors(FALLBACK.map(fromHex))

const cache = new Map<string, Promise<MeshColors>>()

/** The mesh colours for an image; it must be same-origin (a /_next/image URL or /public file). */
export function artworkMesh(src: string): Promise<MeshColors> {
  let hit = cache.get(src)
  if (!hit) {
    hit = new Promise<MeshColors>((resolve) => {
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => {
        try {
          const scale = Math.min(1, Math.sqrt(RESIZE_AREA / (img.naturalWidth * img.naturalHeight)))
          const w = Math.max(1, Math.round(img.naturalWidth * scale))
          const h = Math.max(1, Math.round(img.naturalHeight * scale))
          const canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d', { willReadFrequently: true })!
          ctx.drawImage(img, 0, 0, w, h)
          resolve(meshColors(paletteOf(ctx.getImageData(0, 0, w, h).data)))
        } catch {
          resolve(FALLBACK_MESH)
        }
      }
      img.onerror = () => resolve(FALLBACK_MESH)
      img.src = src
    })
    cache.set(src, hit)
  }
  return hit
}
