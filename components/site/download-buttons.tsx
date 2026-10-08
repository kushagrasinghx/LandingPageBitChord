import { ArrowDownToLine, Star } from 'lucide-react'
import { REPO_URL, type resolveDownload } from '@/lib/github'

/**
 * The page's two calls to action — download the latest build, star the repo —
 * shared by the hero and the closing section so they are always the same pair.
 *
 * Hover is a highlight, not a zoom: the solid button brightens and gains a
 * soft white glow, the outlined one fills faintly and its edge brightens.
 */
export function DownloadButtons({
  tag,
  download,
  stars,
}: {
  tag: string | null
  download: ReturnType<typeof resolveDownload>
  stars: number | null
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <a
        href={download.url}
        target="_blank"
        rel="noopener noreferrer"
        download={download.isDirect ? '' : undefined}
        aria-label={
          download.isDirect
            ? `Download BitChord ${tag ?? 'latest'}, ${download.size}`
            : 'View the latest BitChord release on GitHub'
        }
        className="group inline-flex h-11 items-center gap-2 rounded-full bg-white/90 px-5 text-[14px] font-semibold text-black transition-[background-color,box-shadow] duration-300 hover:bg-white hover:shadow-[0_0_24px_rgb(255_255_255/0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        <ArrowDownToLine
          className="size-4 transition-transform duration-300 group-hover:translate-y-0.5"
          aria-hidden
        />
        Download{tag ? ` ${tag}` : ''}
      </a>

      <a
        href={REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={stars !== null ? `Star BitChord on GitHub, ${stars} stars` : 'Star BitChord on GitHub'}
        className="group inline-flex h-11 items-center gap-2 rounded-full px-5 text-[14px] font-semibold text-white shadow-[inset_0_0_0_0.8px_rgb(255_255_255/0.22)] transition-[background-color,box-shadow] duration-300 hover:bg-white/[0.08] hover:shadow-[inset_0_0_0_0.8px_rgb(255_255_255/0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <Star
          className="size-4 transition-transform duration-300 group-hover:rotate-[72deg] group-hover:fill-white"
          aria-hidden
        />
        Star on GitHub
      </a>
    </div>
  )
}
