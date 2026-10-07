import { type DbOrTx, db } from '@server/db/connection'
import { type Badge, badgeAwards, badges } from '@server/db/schema/achievements'
import { enrolments, pointsLedger } from '@server/db/schema/catalog'
import { users } from '@server/db/schema/identity'
import { recordAudit } from '@server/lib/audit'
import { now } from '@server/lib/clock'
import { conflict, notFound } from '@server/lib/errors'
import { pointsTotal } from '@server/services/catalog/points.service'
import { urlForStored } from '@server/services/files.service'
import type { BadgeInput, BadgeUpdate } from '@shared/schemas/achievements'
import { and, asc, count, eq, isNull, sql } from 'drizzle-orm'
import type { z } from 'zod'

/** Badges (P51 list, P58 CRUD + manual award) and rule evaluation after progress changes. */

export async function liveBadges(tx: DbOrTx = db) {
  return tx.select().from(badges).where(isNull(badges.deletedAt)).orderBy(asc(badges.createdAt))
}

/** Consecutive days (UTC) with points, ending today or yesterday. */
export async function streakDays(userId: string, tx: DbOrTx = db) {
  const rows = await tx
    .selectDistinct({
      day: sql<string>`to_char(${pointsLedger.at} at time zone 'UTC', 'YYYY-MM-DD')`,
    })
    .from(pointsLedger)
    .where(eq(pointsLedger.userId, userId))
  const days = new Set(rows.map((r) => r.day))
  const cursor = new Date(now())
  const key = (d: Date) => d.toISOString().slice(0, 10)
  if (!days.has(key(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1)
  let n = 0
  while (days.has(key(cursor))) {
    n += 1
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return n
}

/** Awards every rule badge the learner now qualifies for (idempotent, unique user+badge). */
export async function evaluateBadges(tx: DbOrTx, userId: string) {
  const rules = (await liveBadges(tx)).filter((b) => b.rule !== 'manual' && b.threshold)
  if (rules.length === 0) return
  let completed: number | null = null
  let points: number | null = null
  let streak: number | null = null
  for (const b of rules) {
    let value = 0
    if (b.rule === 'courses_completed') {
      completed ??=
        (
          await tx
            .select({ n: count() })
            .from(enrolments)
            .where(and(eq(enrolments.userId, userId), eq(enrolments.state, 'completed')))
        )[0]?.n ?? 0
      value = completed
    } else if (b.rule === 'points_total') {
      points ??= await pointsTotal(userId, undefined, tx)
      value = points
    } else if (b.rule === 'streak_days') {
      streak ??= await streakDays(userId, tx)
      value = streak
    }
    if (value >= (b.threshold ?? Number.POSITIVE_INFINITY))
      await tx
        .insert(badgeAwards)
        .values({ userId, badgeKey: b.key, awardedAt: now() })
        .onConflictDoNothing()
  }
}

export async function badgeDto(b: Badge) {
  return {
    key: b.key,
    name: b.name,
    description: b.description,
    imageUrl: await urlForStored(b.imageUrl, null),
    rule: b.rule as 'courses_completed' | 'points_total' | 'streak_days' | 'manual',
    ...(b.threshold != null ? { threshold: b.threshold } : {}),
  }
}

export async function listBadges() {
  return Promise.all((await liveBadges()).map(badgeDto))
}

export async function createBadge(input: z.infer<typeof BadgeInput>, viewer: Viewer) {
  return db.transaction(async (tx) => {
    const [existing] = await tx.select().from(badges).where(eq(badges.key, input.key))
    if (existing && !existing.deletedAt) throw conflict('A badge with this key exists')
    const values = {
      name: input.name,
      description: input.description,
      imageUrl: input.imageUrl,
      rule: input.rule,
      threshold: input.rule === 'manual' ? null : (input.threshold ?? null),
      deletedAt: null,
    }
    const [row] = existing
      ? await tx.update(badges).set(values).where(eq(badges.key, input.key)).returning()
      : await tx
          .insert(badges)
          .values({ key: input.key, ...values })
          .returning()
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'badge.create',
      target: { type: 'badge', id: input.key },
      ip: viewer.ip,
    })
    return badgeDto(row!)
  })
}

async function liveBadge(tx: DbOrTx, key: string) {
  const [b] = await tx
    .select()
    .from(badges)
    .where(and(eq(badges.key, key), isNull(badges.deletedAt)))
  if (!b) throw notFound()
  return b
}

export async function updateBadge(key: string, input: z.infer<typeof BadgeUpdate>, viewer: Viewer) {
  return db.transaction(async (tx) => {
    const b = await liveBadge(tx, key)
    const rule = input.rule ?? b.rule
    const threshold = input.threshold === undefined ? b.threshold : input.threshold
    if (rule !== 'manual' && !threshold) throw conflict('Rule badges need a threshold')
    const [row] = await tx
      .update(badges)
      .set({
        ...(input.name ? { name: input.name } : {}),
        ...(input.description ? { description: input.description } : {}),
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
        rule,
        threshold: rule === 'manual' ? null : threshold,
      })
      .where(eq(badges.key, key))
      .returning()
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'badge.update',
      target: { type: 'badge', id: key },
      ip: viewer.ip,
    })
    return badgeDto(row!)
  })
}

/** Soft delete (§9.2); awards stay. */
export async function deleteBadge(key: string, viewer: Viewer) {
  await db.transaction(async (tx) => {
    await liveBadge(tx, key)
    await tx.update(badges).set({ deletedAt: now() }).where(eq(badges.key, key))
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'badge.delete',
      target: { type: 'badge', id: key },
      ip: viewer.ip,
    })
  })
}

/** Manual badges only; a second award of the same badge answers 409. */
export async function awardBadge(key: string, userId: string, viewer: Viewer) {
  return db.transaction(async (tx) => {
    const b = await liveBadge(tx, key)
    if (b.rule !== 'manual') throw conflict('Only manual badges can be awarded by hand')
    const [u] = await tx.select({ id: users.id }).from(users).where(eq(users.id, userId))
    if (!u) throw notFound()
    const [row] = await tx
      .insert(badgeAwards)
      .values({ userId, badgeKey: key, awardedAt: now(), awardedById: viewer.id })
      .onConflictDoNothing()
      .returning()
    if (!row) throw conflict('This user already has the badge')
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'badge.award',
      target: { type: 'user', id: userId },
      ip: viewer.ip,
      meta: { badge: key },
    })
    return { userId, badgeKey: key, awardedAt: row.awardedAt.toISOString() }
  })
}
