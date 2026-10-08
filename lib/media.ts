/**
 * Shared shape for shelf items, plus the artwork helper. Kept apart from
 * `apple-music.ts` because that module is server-only (it uses `next/cache`),
 * while the shelves that render these items are client components.
 */

export type MediaItem = {
  id: string
  title: string
  subtitle: string
  /** Apple's artwork URL template, sized with {@link artworkUrl}. */
  artwork: string
  explicit: boolean
}

/**
 * Fills Apple's artwork template (`…/{w}x{h}{c}.{f}`) for a square of `size`
 * px. `bb` is Apple's plain crop; jpg keeps it to one widely-cached format.
 */
export function artworkUrl(template: string, size: number): string {
  return template
    .replace('{w}', String(size))
    .replace('{h}', String(size))
    .replace('{c}', 'bb')
    .replace('{f}', 'jpg')
}
