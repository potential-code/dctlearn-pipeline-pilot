// client: hand-built page (P59 course editor). The course tree and its admin API, shared by every part.
import { createContext, useContext } from 'react'
import type { CourseAdminApi, CourseTree } from './types'

export interface CourseCtx {
  tree: CourseTree
  api: CourseAdminApi
}

export const CourseContext = createContext<CourseCtx | null>(null)

export function useCourse(): CourseCtx {
  const c = useContext(CourseContext)
  if (!c) throw new Error('useCourse outside <CourseContext.Provider>')
  return c
}
