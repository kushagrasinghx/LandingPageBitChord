import { useSyncExternalStore } from 'react'

/**
 * A desktop computer: a wide screen driven by a mouse. Keep in step with the
 * `desktop` variant in `app/globals.css`, which uses the same query for CSS.
 */
const DESKTOP_QUERY = '(min-width: 1024px) and (hover: hover) and (pointer: fine)'

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(DESKTOP_QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

/** True on a desktop computer. Always false during SSR and hydration. */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  )
}
