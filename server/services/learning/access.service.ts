import { type DbOrTx, db } from '@server/db/connection'
import { courses, enrolments, micrositeCourses } from '@server/db/schema/catalog'
import {
  courseAssessments,
  courseBlocks,
  courseModules,
  courseUnits,
} from '@server/db/schema/learning'
import { type Microsite, memberships, microsites } from '@server/db/schema/microsites'
import { forbidden, notFound } from '@server/lib/errors'
import { and, asc, eq, isNull } from 'drizzle-orm'

/**
 * Who may open a course in the player (contract §0.3 "Hub, dashboard, catalogue, player":
 * learner p + own · sub admin p (view as learner) · admin ✓). Routes that carry only a unit,
 * block or assessment id resolve the course and run the same check here: missing, foreign or
 * draft content answers 404 so ids cannot be probed; mentors and judges get 403.
 */

export type Course = typeof courses.$inferSelect

export type CourseAccess = {
  course: Course
  /** The microsite the viewer reaches the course through (catalogue context), if any. */
  microsite: Microsite | null
  isMandatory: boolean
}

export async function findCourse(courseId: string, tx: DbOrTx = db) {
  const [c] = await tx.select().from(courses).where(eq(courses.id, courseId))
  return c ?? null
}

async function viaMicrosites(viewer: Viewer, courseId: string, tx: DbOrTx) {
  const rows = await tx
    .select({ microsite: microsites, isMandatory: micrositeCourses.isMandatory })
    .from(micrositeCourses)
    .innerJoin(microsites, eq(microsites.id, micrositeCourses.micrositeId))
    .where(eq(micrositeCourses.courseId, courseId))
    .orderBy(asc(microsites.sortOrder))
  const raw = await tx
    .select({ micrositeId: memberships.micrositeId })
    .from(memberships)
    .where(eq(memberships.userId, viewer.id))
  const memberOf = new Set(raw.map((r) => r.micrositeId))
  if (viewer.role === 'admin') return rows
  if (viewer.role === 'sub_admin')
    return rows.filter(
      (r) => r.microsite.subAdminId === viewer.id && r.microsite.status !== 'archived',
    )
  return rows.filter(
    (r) =>
      memberOf.has(r.microsite.id) && r.microsite.status === 'live' && !r.microsite.landingOnly,
  )
}

/** Throws 403/404 or returns the course with its catalogue context. */
export async function assertCourseAccess(
  viewer: Viewer,
  courseId: string,
  tx: DbOrTx = db,
): Promise<CourseAccess> {
  if (viewer.role !== 'learner' && viewer.role !== 'sub_admin' && viewer.role !== 'admin')
    throw forbidden()
  const course = await findCourse(courseId, tx)
  if (!course) throw notFound()
  const via = await viaMicrosites(viewer, courseId, tx)
  if (viewer.role !== 'admin') {
    if (course.status === 'draft' || via.length === 0) throw notFound()
    if (course.status === 'archived' && !(await hasEnrolment(viewer.id, courseId, tx)))
      throw notFound()
  }
  const first = via[0]
  return { course, microsite: first?.microsite ?? null, isMandatory: first?.isMandatory ?? false }
}

/** Same rules, answering true/false (SCORM file serving). */
export async function canAccessCourse(viewer: Viewer, courseId: string, tx: DbOrTx = db) {
  try {
    await assertCourseAccess(viewer, courseId, tx)
    return true
  } catch {
    return false
  }
}

/** P16 course page: the course must be in `p`'s list (and not a draft). */
export async function assertCourseInMicrosite(
  viewer: Viewer,
  microsite: Microsite,
  slug: string,
  tx: DbOrTx = db,
): Promise<CourseAccess> {
  const [row] = await tx
    .select({ course: courses, isMandatory: micrositeCourses.isMandatory })
    .from(micrositeCourses)
    .innerJoin(courses, eq(courses.id, micrositeCourses.courseId))
    .where(and(eq(micrositeCourses.micrositeId, microsite.id), eq(courses.slug, slug)))
  if (!row) throw notFound()
  if (row.course.status === 'draft' && viewer.role !== 'admin') throw notFound()
  if (
    row.course.status === 'archived' &&
    viewer.role !== 'admin' &&
    !(await hasEnrolment(viewer.id, row.course.id, tx))
  )
    throw notFound()
  return { course: row.course, microsite, isMandatory: row.isMandatory }
}

async function hasEnrolment(userId: string, courseId: string, tx: DbOrTx) {
  const [e] = await tx
    .select({ id: enrolments.id })
    .from(enrolments)
    .where(and(eq(enrolments.userId, userId), eq(enrolments.courseId, courseId)))
  return Boolean(e)
}

/** A live unit (its module live too) and the viewer's access to its course. */
export async function loadUnitFor(viewer: Viewer, unitId: string, tx: DbOrTx = db) {
  const [row] = await tx
    .select({ unit: courseUnits, moduleDeleted: courseModules.deletedAt })
    .from(courseUnits)
    .innerJoin(courseModules, eq(courseModules.id, courseUnits.moduleId))
    .where(and(eq(courseUnits.id, unitId), isNull(courseUnits.deletedAt)))
  if (!row || row.moduleDeleted) throw notFound()
  const access = await assertCourseAccess(viewer, row.unit.courseId, tx)
  return { unit: row.unit, ...access }
}

export async function loadBlockFor(
  viewer: Viewer,
  unitId: string,
  blockId: string,
  tx: DbOrTx = db,
) {
  const ctx = await loadUnitFor(viewer, unitId, tx)
  const [block] = await tx
    .select()
    .from(courseBlocks)
    .where(
      and(
        eq(courseBlocks.id, blockId),
        eq(courseBlocks.unitId, unitId),
        isNull(courseBlocks.deletedAt),
      ),
    )
  if (!block) throw notFound()
  return { ...ctx, block }
}

export async function loadAssessmentFor(viewer: Viewer, id: string, tx: DbOrTx = db) {
  const [a] = await tx
    .select()
    .from(courseAssessments)
    .where(and(eq(courseAssessments.id, id), isNull(courseAssessments.deletedAt)))
  if (!a) throw notFound()
  const access = await assertCourseAccess(viewer, a.courseId, tx)
  return { assessment: a, ...access }
}
