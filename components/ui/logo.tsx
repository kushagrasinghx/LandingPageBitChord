import Image from 'next/image'
import { cn } from '@/lib/utils'

/**
 * The shipped logo artwork, used directly rather than redrawn.
 *
 * Both files are white-on-transparent, which is why nothing here tints them:
 * they are already the right colour for this canvas, and a `currentColor` SVG
 * would only be a second source of truth to keep in sync.
 */

/**
 * The mark on its own, for anywhere a small BitChord icon is needed.
 *
 * Points at `logo-mark.svg` rather than `LogoTransparent.png`, because that
 * file is misnamed: its bytes are SVG. Next's image optimizer refuses SVG
 * unless `dangerouslyAllowSVG` is set, so the mislabelled path rendered
 * nothing. `unoptimized` skips the optimizer entirely — there is nothing to
 * optimize about a 1 KB vector anyway.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo-mark.svg"
      alt=""
      aria-hidden
      width={730}
      height={730}
      unoptimized
      className={cn('h-auto w-7 shrink-0', className)}
    />
  )
}

/**
 * The full lockup — mark plus wordmark — for the header and footer.
 *
 * The source file carries ~26% transparent padding above and below the
 * artwork, so the box is roughly twice the height of what you actually see.
 * Callers that need the *visible* mark to be N px tall should ask for about
 * 2N, and pull the surplus back with a negative margin so the padding does not
 * silently inflate the row it sits in.
 */
export function LogoWordmark({ className }: { className?: string }) {
  return (
    <Image
      src="/FullLogoTransparent.png"
      alt="BitChord"
      width={1651}
      height={512}
      priority
      className={cn('w-auto', className)}
    />
  )
}
