import { cn } from '@/lib/utils'

/** Apple Music's explicit marker: a small grey tile with a dark "E". */
export function ExplicitBadge({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Explicit"
      title="Explicit"
      className={cn(
        'inline-grid size-[13px] shrink-0 place-items-center rounded-[3px] bg-white/55 text-[9px] font-bold leading-none text-black',
        className,
      )}
    >
      E
    </span>
  )
}
