import { randomUUID } from 'node:crypto'
import { db } from '@server/db/connection'
import { courses, micrositeCourses, pointsLedger } from '@server/db/schema/catalog'
import { users } from '@server/db/schema/identity'
import { microsites } from '@server/db/schema/microsites'
import { recordAudit } from '@server/lib/audit'
import { notFound } from '@server/lib/errors'
import { paged, pageWindow } from '@server/lib/pagination'
import { awardPoints } from '@server/services/catalog/points.service'
import { toUserDto } from '@server/services/identity/user-dto'
import type { PointsAdjust, PointsQuery } from '@shared/schemas/achievements'
import { and, count, desc, eq, inArray } from 'drizzle-orm'
import type { z } from 'zod'
import { evaluateBadges } from './badges.service'

/** P58 points: ledger list with filters and manual adjustments (Audit). */

export async function listPoints(viewer: Viewer, query: z.infer<typeof PointsQuery>) {
  const conds = []
  if (query.userId) conds.push(eq(pointsLedger.userId, query.userId))
  if (query.source) conds.push(eq(pointsLedger.sourceType, query.source))
  if (query.microsite) {
    const [m] = await db
      .select({ id: microsites.id })
      .from(microsites)
      .where(eq(microsites.slug, query.microsite))
    if (!m) return paged([], 0, query)
    conds.push(
      inArray(
        pointsLedger.courseId,
        db
          .select({ id: micrositeCourses.courseId })
          .from(micrositeCourses)
          .where(eq(micrositeCourses.micrositeId, m.id)),
      ),
    )
  }
  const where = conds.length ? and(...conds) : undefined
  const [total] = await db.select({ n: count() }).from(pointsLedger).where(where)
  const rows = await db
    .select({ row: pointsLedger, user: users, courseTitle: courses.title })
    .from(pointsLedger)
    .innerJoin(users, eq(users.id, pointsLedger.userId))
    .leftJoin(courses, eq(courses.id, pointsLedger.courseId))
    .where(where)
    .orderBy(desc(pointsLedger.at), desc(pointsLedger.createdAt))
    .limit(pageWindow(query).limit)
    .offset(pageWindow(query).offset)
  return paged(
    await Promise.all(
      rows.map(async (r) => ({
        at: r.row.at.toISOString(),
        user: await toUserDto(r.user, viewer.id),
        points: r.row.points,
        source: r.row.sourceType as
          | 'unit'
          | 'module'
          | 'course'
          | 'assessment'
          | 'manual'
          | 'badge',
        ...(r.courseTitle ? { courseTitle: r.courseTitle } : {}),
      })),
    ),
    total?.n ?? 0,
    query,
  )
}

export async function adjustPoints(viewer: Viewer, input: z.infer<typeof PointsAdjust>) {
  return db.transaction(async (tx) => {
    const [u] = await tx.select({ id: users.id }).from(users).where(eq(users.id, input.userId))
    if (!u) throw notFound()
    const sourceId = randomUUID()
    await awardPoints(tx, {
      userId: input.userId,
      sourceType: 'manual',
      sourceId,
      points: input.points,
      reason: { en: input.reason, ar: input.reason },
      actorId: viewer.id,
    })
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'points.adjust',
      target: { type: 'user', id: input.userId },
      ip: viewer.ip,
      meta: { points: input.points, reason: input.reason },
    })
    await evaluateBadges(tx, input.userId)
    return { id: sourceId, points: input.points }
  })
}
