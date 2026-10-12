// client: hand-built page (P16 learner course player). What every part of the player reads.
import { createContext, useContext } from 'react'
import type { CourseData } from './mock'
import type { Progress, Target } from './nav'
import type { Api, Effects } from './store'

export interface Pc {
  data: CourseData
  p: Progress
  api: Api
  /** the place the URL points at, or null on a not-found / locked screen */
  target: Target | null
  hrefOf: (t: Target) => string
  /** shows the points toast for something the server just awarded */
  fx: (e: Effects) => void
  /** an assessment attempt is running: leaving the page asks first */
  setGuard: (on: boolean) => void
  /** where "Continue" goes */
  resume: Target
}

export const PcContext = createContext<Pc | null>(null)

export function usePc(): Pc {
  const c = useContext(PcContext)
  if (!c) throw new Error('usePc outside the player')
  return c
}
