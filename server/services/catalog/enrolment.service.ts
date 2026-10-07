import type { DbOrTx } from '@server/db/connection'
import { enrolments, micrositeCourses } from '@server/db/schema/catalog'
import { eq } from 'drizzle-orm'

/**
 * Contract §0 "Enrolment": joining a microsite enrols the learner in its courses; there is no
 * enrol endpoint. Idempotent (unique user+course). Removing a membership keeps enrolments.
 */
export async function enrolInCourses(tx: DbOrTx, userId: string, courseIds: string[]) {
  if (courseIds.length === 0) return 0
  const rows = await tx
    .insert(enrolments)
    .values(courseIds.map((courseId) => ({ userId, courseId })))
    .onConflictDoNothing()
    .returning({ id: enrolments.id })
  return rows.length
}

export async function enrolInMicrositeCourses(tx: DbOrTx, userId: string, micrositeId: string) {
  const list = await tx
    .select({ courseId: micrositeCourses.courseId })
    .from(micrositeCourses)
    .where(eq(micrositeCourses.micrositeId, micrositeId))
  return enrolInCourses(
    tx,
    userId,
    list.map((r) => r.courseId),
  )
}
