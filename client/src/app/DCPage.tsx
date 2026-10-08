import { useRouterState } from '@tanstack/react-router'
import type { ComponentType } from 'react'

type PageProps = Record<string, unknown>

/** Search params that belong to the app, not to a page's variant props. */
const APP_PARAMS = new Set(['lang', 'next'])

/**
 * Renders a ported artboard page with its route props plus any variant props from the URL
 * (?screen=quiz, ?tab=badges, ?step=3 …), and remounts it on every navigation so each visit
 * starts from the artboard's initial state, like the prototype.
 */
export function DCPage({ C, props }: { C: ComponentType<PageProps>; props?: PageProps }) {
  // Remount per path + query, not per #hash (in-page anchors must not reset the page state).
  const href = useRouterState({ select: (s) => s.location.pathname + s.location.searchStr })
  const search = useRouterState({ select: (s) => s.location.search }) as PageProps
  const variants: PageProps = {}
  for (const [k, v] of Object.entries(search)) {
    if (APP_PARAMS.has(k)) continue
    variants[k] = typeof v === 'number' ? String(v) : v
  }
  return <C key={href} {...props} {...variants} />
}
