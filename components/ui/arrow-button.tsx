'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * The icon-only chevron used to page a sideways row — the album rows and the
 * Replay cards. No plate; the box just keeps a comfortable hit area.
 */
export function ArrowButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        // Icon only — no plate. The box just keeps a comfortable hit area.
        'grid size-7 place-items-center text-white/70 transition-colors duration-300',
        disabled ? 'cursor-default opacity-30' : 'hover:text-white',
      )}
    >
      {children}
    </button>
  )
}
