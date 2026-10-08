/**
 * The BitChord app's lyric timing maths, ported from its Kotlin source.
 *
 * Sources (github.com/kushagrasinghx/BitChord):
 * - shared/.../data/lyrics/LyricLine.kt — revealedChars, wordLift, wordFall,
 *   liftHeight, growingWords / GrowingWord.sampleInto, animatesFrom/UntilMs
 * - sharedUi/.../ui/player/LyricFocus.kt — activeLyricRows
 * - sharedUi/.../ui/player/PlayerLyrics.kt — scrollLead and the panel's
 *   constants
 *
 * Kept as close to the original as the language allows, constants and
 * comments' intent included, so behaviour on the site matches the app.
 * Syllable-level timing is not ported: the demo song is word-timed.
 */

/* ------------------------------ panel constants ----------------------------- */

/** Alpha of the part of the playing line that has not been sung yet. */
export const UNSUNG_ALPHA = 0.45

/** The bloom behind the line being sung, at its strongest. */
export const GLOW_ALPHA = 0.62
/** How far the bloom spreads off a letter (dp). */
export const GLOW_RADIUS = 6
/** Room reserved inside each copy of a line for the halo (dp). */
export const GLOW_ROOM = 10

/** How far the sweep's leading edge fades out instead of ending on a cut (dp). */
export const WIPE_FEATHER = 30
/** How far the word being sung lifts off the line (dp). */
export const WORD_RISE = 2

/** How the stack falls away either side of the line being sung, by distance. */
export const LINE_FALLOFF_ALPHA = [1, 0.8, 0.7, 0.58, 0.46]
export const LINE_FALLOFF_BLUR = [0, 1, 1, 1.7, 2.4]

/** The playing line sits at 1; the rest sit fractionally back from it. */
export const INACTIVE_SCALE = 0.98

/** How long the panel takes to settle on a new line, and how far ahead it starts. */
export const SCROLL_LEAD_MIN_MS = 350
export const SCROLL_LEAD_MAX_MS = 500

/** The curve every handover runs on: CubicBezierEasing(0.41, 0, 0.12, 0.99). */
export const LYRIC_EASING_CSS = 'cubic-bezier(0.41, 0, 0.12, 0.99)'
export const LYRIC_SETTLE_MS = 400

/** Rows after the target set off this much later each, up to a few rows back. */
export const STAGGER_STEPS = 3
export const STAGGER_FRACTION = 0.06

/* ------------------------------ word constants ------------------------------ */

const RISE_MS = 700
const RISE_MIN_MS = 250

const LIFT_QUICK_MS = 150
const LIFT_HELD_MS = 900
const LIFT_FLOOR = 0.25

const GROW_MAX_CHARS = 7
const GROW_MIN_SOLO_MS = 1_100
const GROW_MIN_SHORT_MS = 1_360
const GROW_SHORT_STEP_MS = 140
const GROW_MIN_FOUR_MS = 1_050
const GROW_MIN_LONG_MS = 900
const GROW_MS_PER_CHAR = 200

const GROW_DECAY_LONG_CHARS = 5
const GROW_DECAY_QUICK_MS = 1_200
const GROW_DECAY_QUICK_FLOOR_MS = 800
const GROW_DECAY_LONG = 0.4
const GROW_DECAY_QUICK = 0.3
const GROW_DECAY_QUICK_TINY = 0.1
const GROW_DECAY_MAX = 0.7

const GROW_STAGGER = 0.09
const GROW_SPAN = 1.5
const GROW_IN = 0.25
const GROW_HOLD = 0.3
const GROW_OUT = 0.75
const GROW_REST = 1

const GROW_RAMP_MIN_MS = 400
const GROW_RAMP_MAX_MS = 3_000
const GROW_BASE_SHORT = 0.05
const GROW_BASE_LONG = 0.04
const GROW_SCALE_RANGE = 0.08
const GROW_SCALE_CEILING = 0.1
const GROW_SCALE_TRIM = 0.98
export const GROW_SHIFT_EM = 25 / 34
const GROW_BLOOM_FLOOR = 0.35
const GROW_BLOOM_RANGE = 0.45
const GROW_BLOOM_PACE_MS = 1_500
const GROW_BLOOM_PACE_MAX = 1.1
const GROW_BLOOM_SHORT = 0.85
const GROW_BLOOM_LONG = 1.1
const GROW_LIFT_PACE_MS = 2_000
const GROW_LIFT_FLOOR = 0.3

/** How much further up a row is opened for a word animated letter by letter. */
export const GROW_HEADROOM = 3

/* --------------------------------- helpers ---------------------------------- */

export const smooth = (f: number) => f * f * (3 - 2 * f)
const clamp = (n: number, lo: number, hi: number) => (n < lo ? lo : n > hi ? hi : n)

/** CubicBezierEasing(0.41, 0, 0.12, 0.99), solved for y at x like Compose does. */
export function lyricEasing(x: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const x1 = 0.41, y1 = 0, x2 = 0.12, y2 = 0.99
  const bx = (t: number) => 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t
  const by = (t: number) => 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t
  let lo = 0, hi = 1, t = x
  for (let i = 0; i < 24; i++) {
    t = (lo + hi) / 2
    if (bx(t) < x) lo = t
    else hi = t
  }
  return by(t)
}

/* ---------------------------------- types ----------------------------------- */

export type LyricWord = { startMs: number; endMs: number; text: string }

/** Where one letter of a growing word is; filled in by `sampleGrowth`. */
export type CharGrowth = { scale: number; shift: number; rise: number; bloom: number }

export type GrowingWord = {
  index: number
  startMs: number
  endMs: number
  restsAtMs: number
  scalePeak: number[]
  shiftPeak: number[]
  risePeak: number[]
  bloomPeak: number[]
}

export type LyricLine = {
  timeMs: number
  text: string
  words: LyricWord[]
  /** Character range of each word in `text`, end exclusive. */
  wordSpans: [number, number][]
  growing: GrowingWord[]
  endMs: number
  animatesFromMs: number
  animatesUntilMs: number
}

/* ------------------------------ line building ------------------------------- */

function liftHeight(word: LyricWord): number {
  const held = word.endMs - word.startMs
  const through = clamp((held - LIFT_QUICK_MS) / (LIFT_HELD_MS - LIFT_QUICK_MS), 0, 1)
  return LIFT_FLOOR + (1 - LIFT_FLOOR) * smooth(through)
}

function canGrow(word: LyricWord): boolean {
  const length = word.text.length
  if (length === 0 || length > GROW_MAX_CHARS) return false
  if (word.text.includes('-')) return false
  const held = word.endMs - word.startMs
  if (length === 1) return held >= GROW_MIN_SOLO_MS
  if (length <= 3) return held >= GROW_MIN_SHORT_MS + (length - 2) * GROW_SHORT_STEP_MS
  if (length === 4) return held >= GROW_MIN_FOUR_MS
  return held >= GROW_MIN_LONG_MS && held >= length * GROW_MS_PER_CHAR
}

function decayRate(length: number, heldMs: number): number {
  const long = length > GROW_DECAY_LONG_CHARS
  const quick = heldMs < GROW_DECAY_QUICK_MS
  if (!long && !quick) return 0
  let strength = 0
  if (long) strength += Math.min((length - GROW_DECAY_LONG_CHARS) / 5, 1) * GROW_DECAY_LONG
  if (quick) {
    const short = Math.max(0, 1 - (heldMs - GROW_DECAY_QUICK_FLOOR_MS) / 400)
    strength += short * (length > 3 ? GROW_DECAY_QUICK : GROW_DECAY_QUICK_TINY)
  }
  return Math.min(strength, GROW_DECAY_MAX)
}

function growingWord(index: number, word: LyricWord): GrowingWord {
  const chars = word.text.length
  const held = Math.max(word.endMs - word.startMs, 1)
  const earned = clamp((held - GROW_RAMP_MIN_MS) / (GROW_RAMP_MAX_MS - GROW_RAMP_MIN_MS), 0, 1) ** 3
  const decay = decayRate(chars, held)
  const bloomPace = Math.min(GROW_BLOOM_PACE_MAX, held / GROW_BLOOM_PACE_MS)
  const bloomSpread = chars <= 3 ? GROW_BLOOM_SHORT : chars >= 6 ? GROW_BLOOM_LONG : 1
  const base = chars <= 3 ? GROW_BASE_SHORT : GROW_BASE_LONG
  const liftPace = clamp(held / GROW_LIFT_PACE_MS, GROW_LIFT_FLOOR, 1)

  const scalePeak: number[] = []
  const shiftPeak: number[] = []
  const risePeak: number[] = []
  const bloomPeak: number[] = []
  for (let i = 0; i < chars; i++) {
    const place = chars > 1 ? i / (chars - 1) : 0
    const reach = earned * (1 - place * decay)
    const scale = 1 + base + reach * GROW_SCALE_RANGE
    scalePeak[i] = scale * GROW_SCALE_TRIM
    bloomPeak[i] = (GROW_BLOOM_FLOOR + reach * GROW_BLOOM_RANGE) * bloomPace * bloomSpread
    risePeak[i] = ((scale - 1) / GROW_SCALE_CEILING) * liftPace
    const centre = (i + 0.5) / chars
    shiftPeak[i] = (centre - 0.5) * 2 * (scale - 1) * GROW_SHIFT_EM * GROW_SCALE_TRIM
  }
  const last = Math.max(chars - 1, 0) * GROW_STAGGER + GROW_SPAN
  return {
    index,
    startMs: word.startMs,
    endMs: word.endMs,
    restsAtMs: word.startMs + Math.floor(held * last),
    scalePeak,
    shiftPeak,
    risePeak,
    bloomPeak,
  }
}

export function buildLine(timeMs: number, words: LyricWord[]): LyricLine {
  const text = words.map((w) => w.text).join(' ')
  let offset = 0
  const wordSpans = words.map((w) => {
    const start = Math.max(text.indexOf(w.text, offset), offset)
    const end = start + w.text.length
    offset = end
    return [start, end] as [number, number]
  })
  const growing = words.flatMap((w, i) => (canGrow(w) ? [growingWord(i, w)] : []))
  const endMs = words.length ? words[words.length - 1]!.endMs : timeMs
  const settled = words.length ? words[words.length - 1]!.endMs + RISE_MS : endMs
  const grown = growing.length ? Math.max(...growing.map((g) => g.restsAtMs)) : -Infinity
  return {
    timeMs,
    text,
    words,
    wordSpans,
    growing,
    endMs,
    animatesFromMs: Math.min(timeMs, words[0]?.startMs ?? timeMs),
    animatesUntilMs: Math.max(endMs, settled, grown),
  }
}

/* --------------------------------- per frame -------------------------------- */

/** LyricWord.charsSungAt, without syllables. */
function charsSungAt(word: LyricWord, positionMs: number): number {
  if (positionMs <= word.startMs) return 0
  if (positionMs >= word.endMs) return word.text.length
  const span = Math.max(word.endMs - word.startMs, 1)
  return ((positionMs - word.startMs) / span) * word.text.length
}

/** How far through the line the singing has got, as a fractional index into `text`. */
export function revealedChars(line: LyricLine, positionMs: number): number {
  if (!line.words.length) return positionMs >= line.timeMs ? line.text.length : 0
  for (let i = 0; i < line.words.length; i++) {
    const word = line.words[i]!
    const [start, end] = line.wordSpans[i]!
    if (positionMs < word.startMs) return start
    if (positionMs < word.endMs) return start + charsSungAt(word, positionMs)
    const next = line.words[i + 1]
    if (next && positionMs < next.startMs) {
      const gapStart = line.wordSpans[i + 1]![0]
      const pause = Math.max(next.startMs - word.endMs, 1)
      const through = (positionMs - word.endMs) / pause
      return end + through * (gapStart - end)
    }
  }
  return line.text.length
}

export function wordLift(line: LyricLine, index: number, positionMs: number): number {
  const word = line.words[index]
  if (!word) return 0
  const riseMs = clamp(word.endMs - word.startMs, RISE_MIN_MS, RISE_MS)
  const rising = clamp((positionMs - word.startMs) / riseMs, 0, 1)
  const falling = clamp(1 - (positionMs - word.endMs) / RISE_MS, 0, 1)
  return liftHeight(word) * smooth(Math.min(rising, falling))
}

export function wordFall(line: LyricLine, index: number, positionMs: number): number {
  const word = line.words[index]
  if (!word) return 0
  const falling = clamp(1 - (positionMs - word.endMs) / RISE_MS, 0, 1)
  return liftHeight(word) * smooth(falling)
}

export function sampleGrowth(word: GrowingWord, charIndex: number, positionMs: number, into: CharGrowth) {
  const span = Math.max(word.endMs - word.startMs, 1)
  const elapsed = positionMs - word.startMs - charIndex * span * GROW_STAGGER
  const phase = clamp(elapsed / (span * GROW_SPAN), 0, 1)
  const peakScale = word.scalePeak[charIndex]!
  if (phase < GROW_IN) {
    const t = smooth(phase / GROW_IN)
    into.scale = 1 + (peakScale - 1) * t
    into.shift = word.shiftPeak[charIndex]! * t
    into.rise = word.risePeak[charIndex]! * t
    into.bloom = word.bloomPeak[charIndex]! * t
  } else if (phase < GROW_HOLD) {
    into.scale = peakScale
    into.shift = word.shiftPeak[charIndex]!
    into.rise = word.risePeak[charIndex]!
    into.bloom = word.bloomPeak[charIndex]!
  } else if (phase < GROW_OUT) {
    const t = smooth((phase - GROW_HOLD) / (GROW_OUT - GROW_HOLD))
    into.scale = peakScale + (1 - peakScale) * t
    into.shift = word.shiftPeak[charIndex]! * (1 - t)
    into.rise = word.risePeak[charIndex]! + (GROW_REST - word.risePeak[charIndex]!) * t
    into.bloom = word.bloomPeak[charIndex]! * (1 - t)
  } else {
    into.scale = 1
    into.shift = 0
    into.rise = GROW_REST
    into.bloom = 0
  }
}

/** LyricFocus.activeLyricRows: the latest line started, plus any earlier one still being sung. */
export function activeLyricRows(lines: LyricLine[], positionMs: number): number[] {
  let latest = -1
  for (let i = 0; i < lines.length; i++) if (lines[i]!.timeMs <= positionMs) latest = i
  if (latest < 0) return []
  const rows: number[] = []
  for (let i = 0; i <= latest; i++) {
    const line = lines[i]!
    if (i === latest || (line.timeMs <= positionMs && positionMs < line.endMs)) rows.push(i)
  }
  return rows
}

/** PlayerLyrics.scrollLead: the run-up to the next line, bounded. */
export function scrollLead(lines: LyricLine[], positionMs: number): number {
  let current = -1
  for (let i = 0; i < lines.length; i++) if (lines[i]!.timeMs <= positionMs) current = i
  if (current < 0) return SCROLL_LEAD_MIN_MS
  const next = lines[current + 1]
  if (!next) return SCROLL_LEAD_MIN_MS
  return clamp(next.timeMs - lines[current]!.endMs, SCROLL_LEAD_MIN_MS, SCROLL_LEAD_MAX_MS)
}

/**
 * Compose's Modifier.blur(radius) becomes a RenderEffect blur, which Skia turns
 * into a Gaussian sigma of 0.57735·r + 0.5. CSS blur() takes the sigma.
 */
export function blurSigma(radiusDp: number): number {
  return radiusDp > 0 ? radiusDp * 0.57735 + 0.5 : 0
}
