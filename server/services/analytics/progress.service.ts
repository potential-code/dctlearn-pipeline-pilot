import { type DbOrTx, db } from '@server/db/connection'
import { courses, enrolments, micrositeCourses } from '@server/db/schema/catalog'
import { users } from '@server/db/schema/identity'
import { memberships } from '@server/db/schema/microsites'
import { recordAudit } from '@server/lib/audit'
import { notFound } from '@server/lib/errors'
import { findMicrositeBySlug } from '@server/services/microsites/lookup.service'
import { toCsv } from '@server/utils/csv'
import { and, asc, eq, gte, inArray, lt, sql } from 'drizzle-orm'

/**
 * Progress CSV (P55, contract "user, course, progress %, completed at"). One row per enrolment.
 * `from`/`to` (UTC days, inclusive) filter on the enrolment's latest date — completion, else
 * last activity, else start, else enrolment.
 */
export const PROGRESS_HEADERS = ['user', 'email', 'course', 'progress_pct', 'state', 'completed_at']

export async function progressRows(
  filter: { micrositeId?: string; from?: string; to?: string },
  tx: DbOrTx = db,
) {
  const lastDate = sql`coalesce(${enrolments.completedAt}, ${enrolments.lastActivityAt}, ${enrolments.startedAt}, ${enrolments.enrolledAt})`
  const toExclusive = filter.to
    ? new Date(new Date(`${filter.to}T00:00:00Z`).getTime() + 86_400_000).toISOString()
    : null
  const rows = await tx
    .select({
      name: users.name,
      email: users.email,
      course: courses.title,
      progressPct: enrolments.progressPct,
      state: enrolments.state,
      completedAt: enrolments.completedAt,
    })
    .from(enrolments)
    .innerJoin(users, eq(users.id, enrolments.userId))
    .innerJoin(courses, eq(courses.id, enrolments.courseId))
    .where(
      and(
        filter.micrositeId
          ? and(
              inArray(
                enrolments.userId,
                tx
                  .select({ id: memberships.userId })
                  .from(memberships)
                  .where(eq(memberships.micrositeId, filter.micrositeId)),
              ),
              inArray(
                enrolments.courseId,
                tx
                  .select({ id: micrositeCourses.courseId })
                  .from(micrositeCourses)
                  .where(eq(micrositeCourses.micrositeId, filter.micrositeId)),
              ),
            )
          : undefined,
        filter.from ? gte(lastDate, sql`${`${filter.from}T00:00:00Z`}::timestamptz`) : undefined,
        toExclusive ? lt(lastDate, sql`${toExclusive}::timestamptz`) : undefined,
      ),
    )
    .orderBy(asc(users.name), asc(sql`${courses.title}->>'en'`))
  return rows.map((r) => [
    r.name,
    r.email,
    r.course.en,
    Math.round(r.progressPct),
    r.state,
    r.completedAt ? r.completedAt.toISOString() : '',
  ])
}

export async function progressCsv(
  q: { microsite?: string; from?: string; to?: string },
  viewer: Viewer,
) {
  const m = q.microsite ? await findMicrositeBySlug(q.microsite) : null
  if (q.microsite && !m) throw notFound()
  return db.transaction(async (tx) => {
    const rows = await progressRows({ micrositeId: m?.id, from: q.from, to: q.to }, tx)
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'export.progress_csv',
      target: { type: 'export', label: 'progress.csv' },
      micrositeId: m?.id ?? null,
      ip: viewer.ip,
      meta: {
        microsite: q.microsite ?? null,
        from: q.from ?? null,
        to: q.to ?? null,
        rows: rows.length,
      },
    })
    return toCsv(PROGRESS_HEADERS, rows)
  })
}
