import { DownloadButtons } from '@/components/site/download-buttons'
import type { resolveDownload } from '@/lib/github'

/** The last word before the footer: the tagline and the same two actions as the hero. */
export function ClosingCta({
  tag,
  download,
  stars,
}: {
  tag: string | null
  download: ReturnType<typeof resolveDownload>
  stars: number | null
}) {
  return (
    <section aria-labelledby="closing-title" className="page-container mt-20">
      <div className="flex flex-col items-center rounded-3xl bg-[#0a0a0a] px-6 py-16 text-center shadow-[inset_0_0_0_0.8px_rgb(255_255_255/0.1)] sm:py-20">
        <h2
          id="closing-title"
          className="max-w-[760px] text-balance text-[28px] font-extrabold leading-[1.1] tracking-[-0.03em] sm:text-[40px]"
        >
          <span className="text-white">A modern YouTube Music client</span>{' '}
          <span className="text-white/45">with clean aesthetics inspired from Apple Music</span>
        </h2>
        <div className="mt-8">
          <DownloadButtons tag={tag} download={download} stars={stars} />
        </div>
      </div>
    </section>
  )
}
