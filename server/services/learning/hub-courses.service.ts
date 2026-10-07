import type { Microsite } from '@server/db/schema/microsites'
import { paged, parseSort } from '@server/lib/pagination'
import {
  cardState,
  micrositeCardRows,
  toCourseCard,
} from '@server/services/catalog/course-card.service'
import type { CoursesTabQuery, CoursesTabResponse } from '@shared/schemas/learning'
import type { z } from 'zod'

/**
 * P52 `courses` tab: the microsite's catalogue as CourseCards with q / category / state filters,
 * sort (`order` default, `title`, `duration`, `progress`) and pagination; `defaultFilter` is the
 * microsite's preset (e.g. MuseoPro "mandatory").
 */
export async function coursesTab(
  viewer: Viewer,
  microsite: Microsite,
  query: z.infer<typeof CoursesTabQuery>,
): Promise<z.infer<typeof CoursesTabResponse>> {
  const rows = await micrositeCardRows(microsite.id, viewer.id)
  const categories = [...new Set(rows.flatMap((r) => r.course.categories))].sort()
  const q = query.q?.trim().toLowerCase()
  let filtered = rows.filter((r) => {
    if (q && !`${r.course.title.en} ${r.course.title.ar}`.toLowerCase().includes(q)) return false
    if (query.category && !r.course.categories.includes(query.category)) return false
    const state = cardState(r)
    if (query.state === 'in_progress' && state !== 'in_progress') return false
    if (query.state === 'completed' && state !== 'completed') return false
    return true
  })
  const sort = parseSort(query.sort, ['order', 'title', 'duration', 'progress'] as const, [
    'order',
    'asc',
  ])
  const dir = sort.dir === 'asc' ? 1 : -1
  if (sort.field === 'title')
    filtered = [...filtered].sort(
      (a, b) => dir * a.course.title.en.localeCompare(b.course.title.en),
    )
  else if (sort.field === 'duration')
    filtered = [...filtered].sort((a, b) => dir * (a.course.durationMin - b.course.durationMin))
  else if (sort.field === 'progress')
    filtered = [...filtered].sort(
      (a, b) => dir * ((a.enrolment?.progressPct ?? 0) - (b.enrolment?.progressPct ?? 0)),
    )
  else if (dir < 0) filtered = [...filtered].reverse()
  const start = (query.page - 1) * query.pageSize
  const items = await Promise.all(
    filtered.slice(start, start + query.pageSize).map((r) => toCourseCard(r, viewer.id)),
  )
  return {
    categories,
    ...(microsite.defaultFilter ? { defaultFilter: microsite.defaultFilter } : {}),
    items: paged(items, filtered.length, query),
  }
}
