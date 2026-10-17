/**
 * Downloads the hero track's TTML from lrc.red once, before `next dev` /
 * `next build`, into lib/generated/lyrics.json (gitignored). The page bundles
 * that file, so the Worker never calls lrc.red at request time.
 *
 * Never fails the build: if lrc.red cannot be reached it writes `ttml: null`
 * and the hero shows its placeholder lines. The ISRC must match
 * DEMO_TRACK.isrc in lib/lyrics-demo.ts.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ISRC = 'GBAYE0000267'
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'lib', 'generated', 'lyrics.json')

let ttml = null
try {
  const res = await fetch(`https://lrc.red/s/${ISRC}.ttml`, { signal: AbortSignal.timeout(15_000) })
  if (res.ok) ttml = await res.text()
  else console.warn(`[fetch-lyrics] lrc.red returned ${res.status}; using placeholder lines`)
} catch (error) {
  console.warn('[fetch-lyrics] could not reach lrc.red; using placeholder lines:', error.message)
}

await mkdir(dirname(OUT), { recursive: true })
await writeFile(OUT, JSON.stringify({ isrc: ISRC, ttml }))
console.log(`[fetch-lyrics] ${ttml ? 'saved' : 'no'} lyrics for ${ISRC}`)
