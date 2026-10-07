import { type DbOrTx, db } from '@server/db/connection'
import { courses, enrolments, micrositeCourses } from '@server/db/schema/catalog'
import { urlForStored } from '@server/services/files.service'
import type { CardState } from '@shared/enums'
import type { CourseCard } from '@shared/schemas/common'
import { and, asc, eq, inArray, ne } from 'drizzle-orm'

/**
 * §0.2 CourseCard for one viewer inside one microsite: card fields from `courses`, mandatory
 * flag from the microsite's list, state/progress from the viewer's enrolment.
 */
export type CardRow = {
  course: typeof courses.$inferSelect
  isMandatory: boolean
  track: string | null
  enrolment: typeof enrolments.$inferSelect | null
}

export function cardState(row: CardRow): CardState {
  if (row.course.comingSoon) return 'coming_soon'
  const e = row.enrolment
  if (!e) return 'not_started'
  if (e.state === 'completed') return 'completed'
  if (e.progressPct > 0 || e.state === 'in_progress') return 'in_progress'
  return 'not_started'
}

export async function toCourseCard(row: CardRow, viewerId: string | null): Promise<CourseCard> {
  const e = row.enrolment
  return {
    courseId: row.course.id,
    slug: row.course.slug,
    title: row.course.title,
    imageUrl: await urlForStored(row.course.imageUrl, viewerId),
    categories: row.course.categories,
    level: row.course.level as CourseCard['level'],
    durationMin: row.course.durationMin,
    isMandatory: row.isMandatory,
    isCertProgramme: row.course.isCertProgramme,
    state: cardState(row),
    progressPct: Math.round(e?.progressPct ?? 0),
    ...(e?.nextUnitId ? { nextUnitId: e.nextUnitId } : {}),
  }
}

/** Card rows for a microsite's catalogue (published + coming soon; archived hidden). */
export async function micrositeCardRows(
  micrositeId: string,
  viewerId: string,
  tx: DbOrTx = db,
): Promise<CardRow[]> {
  const rows = await tx
    .select({
      course: courses,
      isMandatory: micrositeCourses.isMandatory,
      track: micrositeCourses.track,
      enrolment: enrolments,
    })
    .from(micrositeCourses)
    .innerJoin(courses, eq(micrositeCourses.courseId, courses.id))
    .leftJoin(enrolments, and(eq(enrolments.courseId, courses.id), eq(enrolments.userId, viewerId)))
    .where(
      and(
        eq(micrositeCourses.micrositeId, micrositeId),
        ne(courses.status, 'draft'),
        ne(courses.status, 'archived'),
      ),
    )
    .orderBy(asc(micrositeCourses.sortOrder))
  return rows
}

export async function micrositeCourseIds(micrositeId: string, tx: DbOrTx = db) {
  const rows = await tx
    .select({ id: micrositeCourses.courseId })
    .from(micrositeCourses)
    .where(eq(micrositeCourses.micrositeId, micrositeId))
  return rows.map((r) => r.id)
}

/** Cards for explicit course ids (mentor courses, related courses), mandatory = false. */
export async function cardsForCourses(
  courseIds: string[],
  viewerId: string | null,
  tx: DbOrTx = db,
) {
  if (courseIds.length === 0) return []
  const rows = await tx
    .select({ course: courses, enrolment: enrolments })
    .from(courses)
    .leftJoin(
      enrolments,
      and(
        eq(enrolments.courseId, courses.id),
        eq(enrolments.userId, viewerId ?? '00000000-0000-0000-0000-000000000000'),
      ),
    )
    .where(inArray(courses.id, courseIds))
  return Promise.all(
    rows.map((r) => toCourseCard({ ...r, isMandatory: false, track: null }, viewerId)),
  )
}
