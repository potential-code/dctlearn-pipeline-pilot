import { env } from '@server/config/env'
import { type DbOrTx, db } from '@server/db/connection'
import {
  type CompetitionRound,
  competitionAssignments,
  competitionCriteria,
  competitionJudges,
  competitionRounds,
  competitionScores,
  competitionSubmissions,
} from '@server/db/schema/competition'
import { users } from '@server/db/schema/identity'
import { microsites } from '@server/db/schema/microsites'
import { queueEmail } from '@server/jobs/email.job'
import { recordAudit } from '@server/lib/audit'
import { now } from '@server/lib/clock'
import { conflict, locked, notFound } from '@server/lib/errors'
import { and, asc, desc, eq, inArray, lte, sql } from 'drizzle-orm'
import {
  type Aggregation,
  aggregate,
  isComplete,
  rankBy,
  rubricTotal,
  weightedTotal,
} from './scoring'

/**
 * Rounds: lookups shared by the learner, judge and sub-admin services, the status machine of
 * contract §9.1 (draft → open → judging → closed) and results computed on read (§9.4).
 */

export type Actor = { id: string; ip?: string | null } | null

/** Submissions a judge or the score table can see: the learner has submitted. */
export const VISIBLE_SUBMISSION = ['submitted', 'scored'] as const

export async function findRound(id: string, micrositeId?: string, tx: DbOrTx = db) {
  const [row] = await tx
    .select()
    .from(competitionRounds)
    .where(
      and(
        eq(competitionRounds.id, id),
        micrositeId ? eq(competitionRounds.micrositeId, micrositeId) : undefined,
      ),
    )
  return row ?? null
}

export async function roundOr404(id: string, micrositeId: string, tx: DbOrTx = db) {
  const row = await findRound(id, micrositeId, tx)
  if (!row) throw notFound()
  return row
}

/** The round learners see: the open one, else judging, else the latest closed (never draft). */
export async function currentRound(micrositeId: string, tx: DbOrTx = db) {
  const [row] = await tx
    .select()
    .from(competitionRounds)
    .where(
      and(
        eq(competitionRounds.micrositeId, micrositeId),
        inArray(competitionRounds.status, ['open', 'judging', 'closed']),
      ),
    )
    .orderBy(
      sql`case ${competitionRounds.status} when 'open' then 0 when 'judging' then 1 else 2 end`,
      desc(competitionRounds.closesAt),
    )
    .limit(1)
  return row ?? null
}

export async function criteriaOf(roundId: string, tx: DbOrTx = db) {
  return tx
    .select()
    .from(competitionCriteria)
    .where(eq(competitionCriteria.roundId, roundId))
    .orderBy(asc(competitionCriteria.sortOrder), asc(competitionCriteria.createdAt))
}

export async function roundHasScores(roundId: string, tx: DbOrTx = db) {
  const [row] = await tx
    .select({ id: competitionScores.id })
    .from(competitionScores)
    .innerJoin(competitionCriteria, eq(competitionCriteria.id, competitionScores.criterionId))
    .where(eq(competitionCriteria.roundId, roundId))
    .limit(1)
  return Boolean(row)
}

/** submissionId → judge user id → criterionId → score */
export type ScoreMap = Map<string, Map<string, Map<string, number>>>

export async function scoresFor(submissionIds: string[], tx: DbOrTx = db): Promise<ScoreMap> {
  const out: ScoreMap = new Map()
  if (submissionIds.length === 0) return out
  const rows = await tx
    .select({
      submissionId: competitionScores.submissionId,
      judgeId: competitionScores.judgeId,
      criterionId: competitionScores.criterionId,
      score: competitionScores.score,
    })
    .from(competitionScores)
    .where(inArray(competitionScores.submissionId, submissionIds))
  for (const r of rows) {
    const bySub = out.get(r.submissionId) ?? new Map()
    out.set(r.submissionId, bySub)
    const byJudge = bySub.get(r.judgeId) ?? new Map<string, number>()
    bySub.set(r.judgeId, byJudge)
    byJudge.set(r.criterionId, r.score)
  }
  return out
}

/** Assigned judges (roster rows) of submissions: submissionId → [{ rosterId, userId|null }]. */
export async function assignmentsFor(submissionIds: string[], tx: DbOrTx = db) {
  const out = new Map<string, { rosterId: string; userId: string | null; email: string }[]>()
  if (submissionIds.length === 0) return out
  const rows = await tx
    .select({
      submissionId: competitionAssignments.submissionId,
      rosterId: competitionJudges.id,
      userId: competitionJudges.userId,
      email: competitionJudges.email,
    })
    .from(competitionAssignments)
    .innerJoin(competitionJudges, eq(competitionJudges.id, competitionAssignments.judgeId))
    .where(inArray(competitionAssignments.submissionId, submissionIds))
  for (const r of rows) {
    const list = out.get(r.submissionId) ?? []
    list.push({ rosterId: r.rosterId, userId: r.userId, email: r.email })
    out.set(r.submissionId, list)
  }
  return out
}

/**
 * submitted → scored once every assigned judge (pending invitations included) has scored every
 * criterion (§9.1). Callers lock the submission row first so concurrent judges see each other.
 */
export async function refreshSubmissionStatus(tx: DbOrTx, submissionId: string) {
  const [sub] = await tx
    .select()
    .from(competitionSubmissions)
    .where(eq(competitionSubmissions.id, submissionId))
  if (sub?.status !== 'submitted') return sub?.status ?? null
  const criteria = await criteriaOf(sub.roundId, tx)
  const judges = (await assignmentsFor([sub.id], tx)).get(sub.id) ?? []
  const scores = (await scoresFor([sub.id], tx)).get(sub.id) ?? new Map()
  const done =
    judges.length > 0 &&
    judges.every((j) => j.userId && isComplete(criteria, scores.get(j.userId) ?? new Map()))
  if (!done) return sub.status
  await tx
    .update(competitionSubmissions)
    .set({ status: 'scored', scoredAt: now() })
    .where(eq(competitionSubmissions.id, sub.id))
  return 'scored'
}

export type ResultRow = {
  submissionId: string
  userId: string
  name: string
  email: string
  judges: {
    judgeUserId: string
    judgeName: string
    total: number
    complete: boolean
    perCriterion: { criterionId: string; score: number }[]
  }[]
  finalScore: number | null
  rank: number | null
}

/**
 * P44 results: per submitted entry, each assigned judge's weighted total; the final score
 * aggregates the judges who scored every criterion; ranks are competition ranks.
 */
export async function roundResults(
  roundId: string,
  aggregation: Aggregation,
  tx: DbOrTx = db,
): Promise<ResultRow[]> {
  const criteria = await criteriaOf(roundId, tx)
  const subs = await tx
    .select({ sub: competitionSubmissions, name: users.name, email: users.email })
    .from(competitionSubmissions)
    .innerJoin(users, eq(users.id, competitionSubmissions.userId))
    .where(
      and(
        eq(competitionSubmissions.roundId, roundId),
        inArray(competitionSubmissions.status, [...VISIBLE_SUBMISSION]),
      ),
    )
    .orderBy(asc(competitionSubmissions.submittedAt))
  const ids = subs.map((s) => s.sub.id)
  const scores = await scoresFor(ids, tx)
  const assigned = await assignmentsFor(ids, tx)
  const judgeIds = [
    ...new Set([...assigned.values()].flat().flatMap((a) => (a.userId ? [a.userId] : []))),
  ]
  const names = new Map(
    judgeIds.length
      ? (
          await tx
            .select({ id: users.id, name: users.name })
            .from(users)
            .where(inArray(users.id, judgeIds))
        ).map((u) => [u.id, u.name])
      : [],
  )
  const rows: ResultRow[] = subs.map(({ sub, name, email }) => {
    const bySub = scores.get(sub.id) ?? new Map<string, Map<string, number>>()
    const judges = (assigned.get(sub.id) ?? [])
      .flatMap((a) => (a.userId && bySub.has(a.userId) ? [a.userId] : []))
      .map((judgeUserId) => {
        const marks = bySub.get(judgeUserId) ?? new Map<string, number>()
        return {
          judgeUserId,
          judgeName: names.get(judgeUserId) ?? '',
          total: weightedTotal(criteria, marks),
          complete: isComplete(criteria, marks),
          perCriterion: criteria
            .filter((c) => marks.has(c.id))
            .map((c) => ({ criterionId: c.id, score: marks.get(c.id) ?? 0 })),
        }
      })
    const finalScore = aggregate(
      judges.filter((j) => j.complete).map((j) => j.total),
      aggregation,
    )
    return { submissionId: sub.id, userId: sub.userId, name, email, judges, finalScore, rank: null }
  })
  const ranks = rankBy(rows, (r) => r.finalScore)
  for (const r of rows) r.rank = ranks.get(r) ?? null
  return rows.sort((a, b) => (a.rank ?? 1e9) - (b.rank ?? 1e9))
}

/* ------------------------------------------------------------------ transitions (§9.1) */

function isUniqueViolation(error: unknown) {
  const e = error as { code?: string; cause?: { code?: string } }
  return e?.code === '23505' || e?.cause?.code === '23505'
}

async function lockRound(tx: DbOrTx, id: string, micrositeId: string) {
  const [row] = await tx
    .select()
    .from(competitionRounds)
    .where(and(eq(competitionRounds.id, id), eq(competitionRounds.micrositeId, micrositeId)))
    .for('update')
  if (!row) throw notFound()
  return row
}

/** draft → open: rubric must total 100; only one open round per microsite (409 otherwise). */
export async function activateRound(micrositeId: string, id: string, actor: Actor) {
  try {
    return await db.transaction(async (tx) => {
      const round = await lockRound(tx, id, micrositeId)
      if (round.status !== 'draft') throw conflict('Only a draft round can be opened')
      if (rubricTotal(await criteriaOf(round.id, tx)) !== 100)
        throw conflict('The rubric must total 100 before the round opens')
      const [open] = await tx
        .select({ id: competitionRounds.id })
        .from(competitionRounds)
        .where(
          and(eq(competitionRounds.micrositeId, micrositeId), eq(competitionRounds.status, 'open')),
        )
      if (open) throw conflict('Another round is already open for this microsite')
      await tx
        .update(competitionRounds)
        .set({ status: 'open', openedAt: now() })
        .where(eq(competitionRounds.id, round.id))
      await recordAudit(tx, {
        actorId: actor?.id ?? null,
        action: 'round.activate',
        target: { type: 'competition_round', id: round.id, label: round.name.en },
        micrositeId,
        ip: actor?.ip,
      })
      return { status: 'open' as const }
    })
  } catch (error) {
    if (isUniqueViolation(error)) throw conflict('Another round is already open for this microsite')
    throw error
  }
}

async function notifyJudges(tx: DbOrTx, round: CompetitionRound) {
  const [m] = await tx.select().from(microsites).where(eq(microsites.id, round.micrositeId))
  const rows = await tx
    .select({
      email: users.email,
      name: users.name,
      locale: users.locale,
      n: sql<number>`count(*)`.mapWith(Number),
    })
    .from(competitionAssignments)
    .innerJoin(competitionJudges, eq(competitionJudges.id, competitionAssignments.judgeId))
    .innerJoin(users, eq(users.id, competitionJudges.userId))
    .innerJoin(
      competitionSubmissions,
      eq(competitionSubmissions.id, competitionAssignments.submissionId),
    )
    .where(
      and(
        eq(competitionSubmissions.roundId, round.id),
        inArray(competitionSubmissions.status, [...VISIBLE_SUBMISSION]),
        eq(users.status, 'active'),
      ),
    )
    .groupBy(users.email, users.name, users.locale)
  for (const r of rows) {
    await queueEmail(
      r.email,
      'judge-round-deadline',
      {
        name: r.name,
        roundName: round.name.en,
        micrositeName: m?.name.en ?? 'DCT Learn',
        assigned: r.n,
        url: `${env.APP_URL}/judge/rounds/${round.id}`,
      },
      { tx, locale: r.locale === 'ar' ? 'ar' : 'en' },
    )
  }
}

async function moveToJudging(tx: DbOrTx, round: CompetitionRound, actor: Actor) {
  await tx
    .update(competitionRounds)
    .set({ status: 'judging', judgingAt: now() })
    .where(eq(competitionRounds.id, round.id))
  await recordAudit(tx, {
    actorId: actor?.id ?? null,
    action: 'round.judging',
    target: { type: 'competition_round', id: round.id, label: round.name.en },
    micrositeId: round.micrositeId,
    ip: actor?.ip,
    meta: actor ? {} : { trigger: 'job' },
  })
  await notifyJudges(tx, round)
}

/** open → judging by the sub admin (the job does the same at closesAt). */
export async function startJudging(micrositeId: string, id: string, actor: Actor) {
  return db.transaction(async (tx) => {
    const round = await lockRound(tx, id, micrositeId)
    if (round.status !== 'open') throw conflict('Only an open round can move to judging')
    await moveToJudging(tx, round, actor)
    return { status: 'judging' as const }
  })
}

/** judging → closed (scores and ranks become visible to learners). */
export async function closeRound(micrositeId: string, id: string, actor: Actor) {
  return db.transaction(async (tx) => {
    const round = await lockRound(tx, id, micrositeId)
    if (round.status !== 'judging') throw conflict('Only a round in judging can be closed')
    await tx
      .update(competitionRounds)
      .set({ status: 'closed', closedAt: now() })
      .where(eq(competitionRounds.id, round.id))
    await recordAudit(tx, {
      actorId: actor?.id ?? null,
      action: 'round.close',
      target: { type: 'competition_round', id: round.id, label: round.name.en },
      micrositeId,
      ip: actor?.ip,
    })
    return { status: 'closed' as const }
  })
}

/** Job (every 5 min, §9.3): open rounds whose closesAt has passed move to judging. */
export async function closeDueRounds() {
  const due = await db
    .select({ id: competitionRounds.id })
    .from(competitionRounds)
    .where(and(eq(competitionRounds.status, 'open'), lte(competitionRounds.closesAt, now())))
  let moved = 0
  for (const { id } of due) {
    await db.transaction(async (tx) => {
      const [round] = await tx
        .select()
        .from(competitionRounds)
        .where(eq(competitionRounds.id, id))
        .for('update', { skipLocked: true })
      if (round?.status !== 'open' || round.closesAt > now()) return
      await moveToJudging(tx, round, null)
      moved++
    })
  }
  return moved
}

export function assertNotClosed(round: CompetitionRound) {
  if (round.status === 'closed') throw locked('This round is closed')
}
