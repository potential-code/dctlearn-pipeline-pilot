import { type DbOrTx, db } from '@server/db/connection'
import { courseCertificates, enrolments, pointsLedger } from '@server/db/schema/catalog'
import { now } from '@server/lib/clock'
import type { I18n } from '@shared/schemas/common'
import { and, count, desc, eq, gte, inArray, sql, sum } from 'drizzle-orm'

/**
 * The PointsSource seam. Points are rows, never a counter: idempotent per
 * (user, source_type, source_id), so a double click awards once (contract §9.4).
 */
export type PointsSourceType = 'unit' | 'module' | 'course' | 'assessment' | 'manual' | 'badge'

export async function awardPoints(
  tx: DbOrTx,
  input: {
    userId: string
    courseId?: string | null
    sourceType: PointsSourceType
    sourceId: string
    points: number
    reason: I18n
    actorId?: string | null
    at?: Date
  },
) {
  if (input.points === 0) return 0
  const rows = await tx
    .insert(pointsLedger)
    .values({
      userId: input.userId,
      courseId: input.courseId ?? null,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      points: input.points,
      reason: input.reason,
      actorId: input.actorId ?? null,
      at: input.at ?? now(),
    })
    .onConflictDoNothing()
    .returning({ points: pointsLedger.points })
  return rows[0]?.points ?? 0
}

/**
 * Points total. With `courseIds`, only points earned in those courses (a microsite's
 * leaderboard and KPIs, decision 2026-10-07).
 */
export async function pointsTotal(userId: string, courseIds?: string[], tx: DbOrTx = db) {
  if (courseIds && courseIds.length === 0) return 0
  const [row] = await tx
    .select({ total: sum(pointsLedger.points) })
    .from(pointsLedger)
    .where(
      and(
        eq(pointsLedger.userId, userId),
        courseIds ? inArray(pointsLedger.courseId, courseIds) : undefined,
      ),
    )
  return Number(row?.total ?? 0)
}

export async function pointsSince(
  userId: string,
  since: Date,
  courseIds?: string[],
  tx: DbOrTx = db,
) {
  if (courseIds && courseIds.length === 0) return 0
  const [row] = await tx
    .select({ total: sum(pointsLedger.points) })
    .from(pointsLedger)
    .where(
      and(
        eq(pointsLedger.userId, userId),
        gte(pointsLedger.at, since),
        courseIds ? inArray(pointsLedger.courseId, courseIds) : undefined,
      ),
    )
  return Number(row?.total ?? 0)
}

/** Leaderboard over `userIds` counting points in `courseIds`. Name + points only. */
export async function leaderboard(userIds: string[], courseIds: string[], tx: DbOrTx = db) {
  if (userIds.length === 0 || courseIds.length === 0) return []
  const total = sql<number>`coalesce(sum(${pointsLedger.points}), 0)`.mapWith(Number)
  return tx
    .select({ userId: pointsLedger.userId, points: total })
    .from(pointsLedger)
    .where(and(inArray(pointsLedger.userId, userIds), inArray(pointsLedger.courseId, courseIds)))
    .groupBy(pointsLedger.userId)
    .orderBy(desc(total))
}

/** P14 KPI counts for a viewer within a set of courses. */
export async function learningKpis(userId: string, courseIds: string[], tx: DbOrTx = db) {
  if (courseIds.length === 0) return { inProgress: 0, completed: 0, certificates: 0, points: 0 }
  const states = await tx
    .select({ state: enrolments.state, n: count() })
    .from(enrolments)
    .where(and(eq(enrolments.userId, userId), inArray(enrolments.courseId, courseIds)))
    .groupBy(enrolments.state)
  const [certs] = await tx
    .select({ n: count() })
    .from(courseCertificates)
    .where(
      and(eq(courseCertificates.userId, userId), inArray(courseCertificates.courseId, courseIds)),
    )
  return {
    inProgress: states.find((s) => s.state === 'in_progress')?.n ?? 0,
    completed: states.find((s) => s.state === 'completed')?.n ?? 0,
    certificates: certs?.n ?? 0,
    points: await pointsTotal(userId, courseIds, tx),
  }
}
