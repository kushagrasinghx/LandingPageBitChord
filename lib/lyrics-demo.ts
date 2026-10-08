import type { SourceLine } from '@/lib/lrc-red'

/**
 * The track shown on the hero's phone screen.
 *
 * Its lyrics are fetched from lrc.red at request time (see lib/lrc-red.ts) and
 * are never stored in this repository. Only if that fetch fails does the
 * screen fall back to the original placeholder lines below.
 */
export const DEMO_TRACK = {
  title: 'Yellow',
  artist: 'Coldplay',
  album: 'Parachutes',
  artwork: '/albums/coldplay-parachutes.png',
  explicit: false,
  /** Parachutes (2000) release, as listed by lrc.red. */
  isrc: 'GBAYE0000267',
} as const

/** Which part of the song plays: the opening, from its first sung line (0:33.5). */
const START_LINE = 0
const LINE_COUNT = 10

/** Quiet before the first line, and after the last before it loops. */
const INTRO_MS = 1_200
const OUTRO_MS = 2_600

export type DemoLyrics = { lines: SourceLine[]; durationMs: number }

/** Cuts the excerpt out of the full song and starts its clock just before it. */
export function excerpt(song: SourceLine[]): DemoLyrics {
  const part = song.slice(START_LINE, START_LINE + LINE_COUNT)
  const shift = part[0]!.timeMs - INTRO_MS
  const lines = part.map((line) => ({
    timeMs: line.timeMs - shift,
    words: line.words.map((w) => ({ ...w, startMs: w.startMs - shift, endMs: w.endMs - shift })),
  }))
  const end = Math.max(...lines.map((l) => l.words[l.words.length - 1]!.endMs))
  return { lines, durationMs: end + OUTRO_MS }
}

/* ---------------------------- fallback placeholder --------------------------- */

type Word = [text: string, heldMs: number, pauseAfterMs?: number]

/** Original placeholder text, used only when lrc.red cannot be reached. */
const PLACEHOLDER: { words: Word[]; leadInMs: number }[] = [
  { leadInMs: 0, words: [['Turn', 300], ['the', 200], ['lights', 420, 60], ['down', 380], ['low', 1_650]] },
  { leadInMs: 650, words: [['let', 230], ['the', 180], ['chorus', 520, 80], ['carry', 420], ['you', 260], ['home', 1_250]] },
  { leadInMs: 600, words: [['every', 260], ['word', 300], ['lit', 250], ['up', 230, 90], ['the', 160], ['moment', 380], ["it's", 220], ['sung', 820]] },
  { leadInMs: 520, words: [['right', 360], ['on', 300, 80], ['time', 1_400]] },
  { leadInMs: 700, words: [['Hold', 420], ['the', 200], ['note', 520, 120], ['a', 160], ['little', 360], ['longer', 1_500]] },
  { leadInMs: 650, words: [['and', 240], ['watch', 380], ['it', 220, 60], ['glow', 2_100]] },
]

export function placeholderLyrics(): DemoLyrics {
  const song: SourceLine[] = []
  let at = 0
  for (const { words, leadInMs } of PLACEHOLDER) {
    at += leadInMs
    const timeMs = at
    song.push({
      timeMs,
      words: words.map(([text, held, pause = 40]) => {
        const w = { text, startMs: at, endMs: at + held }
        at += held + pause
        return w
      }),
    })
  }
  return excerpt(song)
}
