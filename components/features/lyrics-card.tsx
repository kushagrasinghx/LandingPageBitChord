'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Languages, Type } from 'lucide-react'
import { cn } from '@/lib/utils'

const LINES = [
  {
    words: ['Hold', 'the', 'line', 'a', 'little', 'longer'],
    translation: 'Aguanta la línea un poco más',
  },
  {
    words: ['every', 'echo', 'coming', 'back', 'stronger'],
    translation: 'cada eco regresa más fuerte',
  },
  {
    words: ['sung', 'in', 'full', 'resolution'],
    translation: 'cantado en resolución completa',
  },
]

const SIZES = { sm: 'text-[12.5px]', md: 'text-[15px]', lg: 'text-[18px]' } as const
type SizeKey = keyof typeof SIZES

const TOTAL = LINES.reduce((n, l) => n + l.words.length, 0)

/**
 * Word-by-word karaoke highlighter with the two controls BitChord actually
 * exposes for its lyrics panel: type scale and a translation track.
 */
export function LyricsCard() {
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [size, setSize] = useState<SizeKey>('md')
  const [translate, setTranslate] = useState(false)

  useEffect(() => {
    if (reduced) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % TOTAL), 340)
    return () => window.clearInterval(id)
  }, [reduced])

  // Map the flat word counter back to (line, word).
  let line = 0
  let word = index
  while (line < LINES.length && word >= LINES[line]!.words.length) {
    word -= LINES[line]!.words.length
    line++
  }
  line = Math.min(line, LINES.length - 1)

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-0.5">
          <Type className="ml-1.5 size-3 text-white/35" aria-hidden />
          {(Object.keys(SIZES) as SizeKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSize(key)}
              aria-pressed={size === key}
              className={cn(
                'rounded-full px-2 py-1 font-mono text-[9.5px] uppercase tracking-wider transition-colors',
                size === key ? 'bg-white/90 text-black' : 'text-white/45 hover:text-white',
              )}
            >
              {key}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setTranslate((v) => !v)}
          aria-pressed={translate}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 font-mono text-[9.5px] uppercase tracking-wider transition-colors',
            translate
              ? 'border-cyan-400/35 bg-cyan-400/12 text-cyan-200'
              : 'border-white/10 bg-white/[0.04] text-white/45 hover:text-white',
          )}
        >
          <Languages className="size-3" aria-hidden />
          {translate ? 'ES on' : 'Translate'}
        </button>
      </div>

      {/* Lyric stage */}
      <div className="relative flex-1 overflow-hidden rounded-xl border border-white/[0.07] bg-black/35 p-4">
        <div className="flex flex-col gap-2.5">
          {LINES.map((l, li) => {
            const active = li === line
            return (
              <div key={li}>
                <p
                  className={cn(
                    'flex flex-wrap gap-x-[5px] font-semibold leading-snug tracking-[-0.01em] transition-opacity duration-300',
                    SIZES[size],
                    active ? 'opacity-100' : 'opacity-25',
                  )}
                >
                  {l.words.map((w, wi) => {
                    const sung = active ? wi <= word : li < line
                    const current = active && wi === word
                    return (
                      <motion.span
                        key={wi}
                        animate={{
                          color: sung ? 'rgb(255,255,255)' : 'rgba(255,255,255,0.38)',
                          y: current ? -2 : 0,
                        }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          current && 'drop-shadow-[0_0_12px_rgba(34,211,238,0.9)]',
                        )}
                      >
                        {w}
                      </motion.span>
                    )
                  })}
                </p>
                {translate ? (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: active ? 0.8 : 0.2, height: 'auto' }}
                    className="mt-0.5 text-[11.5px] italic leading-snug text-cyan-200/80"
                  >
                    {l.translation}
                  </motion.p>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/25">
        Sources: BetterLyrics · LyricsPlus · SimpMusic · LRCLIB
      </p>
    </div>
  )
}
