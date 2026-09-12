/**
 * The timing maths behind the lyrics panel, ported from the app.
 *
 * Kept apart from the component that draws it so it can be exercised on its
 * own: this is the half that has to be *right*, and a browser is a poor place
 * to check whether a highlight lands on the correct character.
 *
 * Sources: `LyricLine.revealedChars` / `LyricLine.wordLift` in
 * data/lyrics/LyricLine.kt, and the constants in ui/player/NowPlayingScreen.kt.
 */

/** How long a word takes to rise, and to settle back down once it is past. */
export const RISE_MS = 700

/** Alpha of text that has not been sung yet. */
export const UNSUNG_ALPHA = 0.45

/** Per-row falloff either side of the line being sung. Symmetric and shallow. */
export const LINE_FALLOFF_ALPHA = [1, 0.8, 0.7, 0.58, 0.46]
export const LINE_FALLOFF_BLUR = [0, 1, 1, 1.7, 2.4]

/** Rows that are not the one being sung sit fractionally back. */
export const INACTIVE_SCALE = 0.98

/** How long a row takes to settle into a new brightness, and on what curve. */
export const LYRIC_SETTLE_MS = 400
export const LYRIC_EASING = 'cubic-bezier(0.41, 0, 0.12, 0.99)'

/** A pause between lines, so the sweep breathes where a singer would. */
export const LINE_GAP_MS = 420

/** Ease in and out of the ends, so the lift has no corners on it. */
export const smooth = (f: number) => f * f * (3 - 2 * f)
export const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n)

export type SourceWord = {
  text: string
  /** How long the word itself is held. */
  ms: number
  /** Breath after it, before the next word starts. Defaults to none. */
  gap?: number
}

export type SourceLine = { words: SourceWord[]; translation: string }

export type TimedWord = {
  text: string
  startMs: number
  endMs: number
  /** Index of the word's first character within the line's full text. */
  from: number
  /** Index one past its last character — i.e. where its trailing space sits. */
  to: number
}

export type TimedLine = {
  text: string
  words: TimedWord[]
  translation: string
  timeMs: number
  endMs: number
}

/**
 * Expand authored durations into absolute timings, and record where each word
 * sits inside its line's full string.
 *
 * Character offsets are resolved here rather than at draw time because the
 * sweep indexes into the whole line — including the spaces between words, which
 * fill over the pause rather than jumping to the next word's first letter.
 */
export function buildLines(source: SourceLine[], gapMs = LINE_GAP_MS): TimedLine[] {
  let cursor = 0
  return source.map((line) => {
    const timeMs = cursor
    let offset = 0
    let endMs = 0
    const words = line.words.map((word) => {
      const startMs = cursor
      cursor += word.ms
      endMs = cursor
      // The breath lands *after* the word's own end, so `revealedChars` has a
      // pause to creep the trailing space across rather than snapping to the
      // next word's first letter.
      cursor += word.gap ?? 0
      const from = offset
      offset += word.text.length
      const to = offset
      offset += 1 // the space that follows
      return { text: word.text, startMs, endMs, from, to }
    })
    cursor += gapMs
    return {
      text: line.words.map((w) => w.text).join(' '),
      words,
      translation: line.translation,
      timeMs,
      endMs,
    }
  })
}

/**
 * How far through the line the singing has got, as a fractional index into the
 * line's text.
 *
 * Within a word it interpolates across that word's own span, so a held note
 * draws slowly and a rattled-off one snaps. The whitespace after a word is
 * credited to the pause before the next one — the highlight keeps creeping
 * instead of resting on a word's last letter.
 */
export function revealedChars(line: TimedLine, positionMs: number): number {
  for (let i = 0; i < line.words.length; i++) {
    const word = line.words[i]!
    if (positionMs < word.startMs) return word.from
    if (positionMs < word.endMs) {
      const span = Math.max(1, word.endMs - word.startMs)
      return word.from + ((positionMs - word.startMs) / span) * word.text.length
    }
    const next = line.words[i + 1]
    if (next && positionMs < next.startMs) {
      const pause = Math.max(1, next.startMs - word.endMs)
      return word.to + ((positionMs - word.endMs) / pause) * (next.from - word.to)
    }
  }
  return line.text.length
}

/** 1 while the word is being sung, easing up to it and back down over RISE_MS. */
export function wordLift(word: TimedWord, positionMs: number): number {
  const rising = clamp01((positionMs - word.startMs) / RISE_MS)
  const falling = clamp01(1 - (positionMs - word.endMs) / RISE_MS)
  return smooth(Math.min(rising, falling))
}

/** Alpha of the character at `index` given the sweep's fractional position. */
export function charAlpha(revealed: number, index: number): number {
  // The boundary character is partly lit. That is what feathers the edge: the
  // cut sits inside a glyph rather than between two.
  const lit = clamp01(revealed - index)
  return UNSUNG_ALPHA + (1 - UNSUNG_ALPHA) * lit
}
