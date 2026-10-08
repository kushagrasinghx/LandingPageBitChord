/**
 * Time-synced lyrics from lrc.red, the way the BitChord app reads them.
 *
 * Ported from the app (shared/.../data/lyrics): LrcRed.kt for where the
 * document lives (`/s/{ISRC}.ttml`), and TtmlLyrics.kt for how Apple's TTML is
 * turned into words — timed spans become words, and spans with no whitespace
 * between them are joined into one word. Timing is kept per word only: a word
 * split into syllables is timed from its first part's start to its last
 * part's end. Translation / romanization spans are skipped. The answering-vocal role (x-bg) is dropped: the hero's screen
 * draws the lead only.
 *
 * Lyrics are fetched at request time and never stored in this repository.
 * Like the other fetchers on this site, this resolves — never throws — and
 * the caller falls back to placeholder lines when it gets null.
 */

const BASE = 'https://lrc.red/'

/** A day: published timings for a released song do not change. */
const REVALIDATE_SECONDS = 86_400

export type SourceWord = { text: string; startMs: number; endMs: number }
export type SourceLine = { timeMs: number; words: SourceWord[] }

const SKIPPED_ROLES = new Set(['x-translation', 'x-roman', 'x-bg'])

/** TtmlLyrics.time: "12.3", "1:02.3", "1:01:02.3", "450ms". */
function time(value: string | undefined): number | null {
  const raw = value?.trim()
  if (!raw) return null
  if (raw.endsWith('ms')) {
    const n = Number(raw.slice(0, -2))
    return Number.isFinite(n) ? Math.floor(n) : null
  }
  const parts = raw.replace(/s$/, '').split(':').map(Number)
  if (parts.some((p) => !Number.isFinite(p)) || parts.length > 3) return null
  const seconds = parts.reduce((acc, p) => acc * 60 + p, 0)
  return Math.floor(seconds * 1000)
}

function attr(attrs: string, name: string): string | undefined {
  return attrs.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`))?.[1]
}

function decode(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
}

type Piece = { kind: 'text'; text: string } | { kind: 'timed'; text: string; start: number; end: number }

/** TtmlLyrics.mergeIntoWords. */
function mergeIntoWords(pieces: Piece[]): SourceWord[] {
  const words: SourceWord[] = []
  let current = ''
  let start = 0
  let end = 0
  let timed = false

  const flush = () => {
    const text = current.trim()
    current = ''
    if (text && timed) words.push({ text, startMs: start, endMs: end })
    timed = false
  }

  for (const piece of pieces) {
    if (piece.kind === 'text') {
      if (!piece.text.trim()) flush()
      else if (timed) current += piece.text
      continue
    }
    if (!piece.text.trim()) continue
    if (/^\s/.test(piece.text)) flush()
    if (!current) start = piece.start
    current += piece.text.trim()
    end = piece.end
    timed = true
    if (/\s$/.test(piece.text)) flush()
  }
  flush()
  return words
}

/** TtmlLyrics.parse, lead vocal only. */
export function parseTtml(ttml: string): SourceLine[] {
  const lines: SourceLine[] = []
  for (const [, pAttrs = '', inner = ''] of ttml.matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/g)) {
    const pieces: Piece[] = []
    // Open spans, innermost last: whether each is timed, skipped, and its text.
    const stack: { timed: boolean; skipped: boolean; begin: number | null; end: number | null; text: string }[] = []
    for (const [, close, sAttrs = '', raw] of inner.matchAll(/<(\/?)span\b([^>]*)>|([^<]+)/g)) {
      if (raw !== undefined) {
        const text = decode(raw)
        const skipped = stack.some((s) => s.skipped)
        const leaf = [...stack].reverse().find((s) => s.timed)
        if (leaf) leaf.text += text
        else if (!skipped) pieces.push({ kind: 'text', text })
        continue
      }
      if (close) {
        const span = stack.pop()
        if (span?.timed && !span.skipped && !stack.some((s) => s.skipped)) {
          pieces.push({ kind: 'timed', text: span.text, start: span.begin!, end: span.end! })
        }
        continue
      }
      if (sAttrs.trimEnd().endsWith('/')) continue
      const role = attr(sAttrs, 'ttm:role') ?? attr(sAttrs, 'role')
      const begin = time(attr(sAttrs, 'begin'))
      const end = time(attr(sAttrs, 'end'))
      stack.push({
        timed: begin !== null && end !== null,
        skipped: role !== undefined && SKIPPED_ROLES.has(role),
        begin,
        end,
        text: '',
      })
    }
    const words = mergeIntoWords(pieces)
    if (!words.length) continue
    const begin = time(attr(pAttrs, 'begin')) ?? words[0]!.startMs
    lines.push({ timeMs: Math.min(begin, words[0]!.startMs), words })
  }
  return lines.sort((a, b) => a.timeMs - b.timeMs)
}

/** The lead vocal of the track with this ISRC, or null if lrc.red has nothing usable. */
export async function getLrcRedLyrics(isrc: string): Promise<SourceLine[] | null> {
  try {
    const res = await fetch(`${BASE}s/${isrc.trim().toUpperCase()}.ttml`, {
      next: { revalidate: REVALIDATE_SECONDS },
    })
    if (!res.ok) return null
    const lines = parseTtml(await res.text())
    return lines.length ? lines : null
  } catch {
    return null
  }
}
