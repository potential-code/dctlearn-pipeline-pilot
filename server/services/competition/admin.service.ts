import { db, type Tx } from '@server/db/connection'
import { micrositeCourses } from '@server/db/schema/catalog'
import {
  type CompetitionRound,
  competitionAssignments,
  competitionCriteria,
  competitionJudges,
  competitionRounds,
  competitionSubmissions,
} from '@server/db/schema/competition'
import { invitations, users } from '@server/db/schema/identity'
import type { Microsite } from '@server/db/schema/microsites'
import { recordAudit } from '@server/lib/audit'
import { now } from '@server/lib/clock'
import { conflict, locked, notFound, validationFailed } from '@server/lib/errors'
import { assertIfMatch } from '@server/lib/if-match'
import { paged } from '@server/lib/pagination'
import { sanitizeRich, sanitizeText } from '@server/lib/sanitize'
import { createInvitations } from '@server/services/identity/invitation.service'
import { toCsv } from '@server/utils/csv'
import { email as emailSchema } from '@shared/schemas/common'
import type {
  AssignmentsInput,
  JudgesQuery,
  RoundInput,
  RoundUpdate,
  RubricInput,
} from '@shared/schemas/competition'
import { and, asc, desc, eq, inArray, isNotNull, notInArray } from 'drizzle-orm'
import type { z } from 'zod'
import {
  assertNotClosed,
  assignmentsFor,
  criteriaOf,
  refreshSubmissionStatus,
  roundHasScores,
  roundOr404,
  roundResults,
  scoresFor,
  VISIBLE_SUBMISSION,
} from './rounds.service'
import { type Aggregation, isComplete } from './scoring'

/**
 * Sub admin(p) / admin side (P41 rounds, P43 rubric, P42 judges + assignments, P44 scores).
 * Everything is scoped to the microsite in the URL; foreign ids answer 404.
 */

type RoundStatus = 'draft' | 'open' | 'judging' | 'closed'
type Actor = Pick<Viewer, 'id' | 'ip'>

export function toRoundDto(r: CompetitionRound) {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    status: r.status as RoundStatus,
    opensAt: r.opensAt.toISOString(),
    closesAt: r.closesAt.toISOString(),
    courseId: r.courseId,
    eligibilityMinProgressPct: r.eligibilityMinProgressPct,
  }
}

const cleanI18n = (v: { en: string; ar: string }) => ({
  en: sanitizeText(v.en),
  ar: sanitizeText(v.ar),
})
const richI18n = (v: { en: string; ar: string }) => ({
  en: sanitizeRich(v.en),
  ar: sanitizeRich(v.ar),
})

async function assertCourseOfMicrosite(m: Microsite, courseId: string) {
  const [row] = await db
    .select({ id: micrositeCourses.id })
    .from(micrositeCourses)
    .where(and(eq(micrositeCourses.micrositeId, m.id), eq(micrositeCourses.courseId, courseId)))
  if (!row) throw validationFailed({ courseId: 'Choose a course of this microsite' })
}

/* ------------------------------------------------------------------ P41 rounds */

export async function listRounds(m: Microsite) {
  const rows = await db
    .select()
    .from(competitionRounds)
    .where(eq(competitionRounds.micrositeId, m.id))
    .orderBy(desc(competitionRounds.opensAt))
  return { items: rows.map(toRoundDto) }
}

export async function createRound(m: Microsite, actor: Actor, input: z.infer<typeof RoundInput>) {
  await assertCourseOfMicrosite(m, input.courseId)
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(competitionRounds)
      .values({
        micrositeId: m.id,
        name: cleanI18n(input.name),
        description: richI18n(input.description),
        opensAt: new Date(input.opensAt),
        closesAt: new Date(input.closesAt),
        courseId: input.courseId,
        eligibilityMinProgressPct: input.eligibilityMinProgressPct,
      })
      .returning()
    await recordAudit(tx, {
      actorId: actor.id,
      action: 'round.create',
      target: { type: 'competition_round', id: row!.id, label: row!.name.en },
      micrositeId: m.id,
      ip: actor.ip,
    })
    return toRoundDto(row!)
  })
}

/** Name, description and dates until closed; course and eligibility only while draft. */
export async function updateRound(
  m: Microsite,
  actor: Actor,
  id: string,
  input: z.infer<typeof RoundUpdate>,
) {
  const round = await roundOr404(id, m.id)
  assertNotClosed(round)
  if (
    round.status !== 'draft' &&
    ((input.courseId && input.courseId !== round.courseId) ||
      (input.eligibilityMinProgressPct !== undefined &&
        input.eligibilityMinProgressPct !== round.eligibilityMinProgressPct))
  )
    throw locked('Course and eligibility can only change while the round is a draft')
  if (input.courseId) await assertCourseOfMicrosite(m, input.courseId)
  const opensAt = input.opensAt ? new Date(input.opensAt) : round.opensAt
  const closesAt = input.closesAt ? new Date(input.closesAt) : round.closesAt
  if (closesAt <= opensAt) throw validationFailed({ closesAt: 'Must be after opensAt' })
  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(competitionRounds)
      .set({
        ...(input.name ? { name: cleanI18n(input.name) } : {}),
        ...(input.description ? { description: richI18n(input.description) } : {}),
        opensAt,
        closesAt,
        ...(input.courseId ? { courseId: input.courseId } : {}),
        ...(input.eligibilityMinProgressPct !== undefined
          ? { eligibilityMinProgressPct: input.eligibilityMinProgressPct }
          : {}),
      })
      .where(eq(competitionRounds.id, round.id))
      .returning()
    await recordAudit(tx, {
      actorId: actor.id,
      action: 'round.update',
      target: { type: 'competition_round', id: round.id, label: row!.name.en },
      micrositeId: m.id,
      ip: actor.ip,
    })
    return toRoundDto(row!)
  })
}

/* ------------------------------------------------------------------ P43 rubric */

export async function getRubric(m: Microsite, roundId: string) {
  const round = await roundOr404(roundId, m.id)
  const criteria = await criteriaOf(round.id)
  return {
    criteria: criteria.map((c) => ({
      id: c.id,
      question: c.question,
      weightPct: c.weightPct,
      order: c.sortOrder,
    })),
    updatedAt: round.rubricUpdatedAt.toISOString(),
    locked: await roundHasScores(round.id),
  }
}

/** Replaces the rubric (Σ = 100 is checked by the schema → 422). Locked once scoring started. */
export async function putRubric(
  m: Microsite,
  actor: Actor,
  roundId: string,
  input: z.infer<typeof RubricInput>,
) {
  await db.transaction(async (tx) => {
    const [round] = await tx
      .select()
      .from(competitionRounds)
      .where(and(eq(competitionRounds.id, roundId), eq(competitionRounds.micrositeId, m.id)))
      .for('update')
    if (!round) throw notFound()
    assertIfMatch(round.rubricUpdatedAt, input.ifMatch)
    if (round.status === 'closed' || (await roundHasScores(round.id, tx)))
      throw locked('The rubric is locked once scoring has started')
    const existing = await criteriaOf(round.id, tx)
    const ids = new Set(existing.map((c) => c.id))
    const fields: Record<string, string> = {}
    input.criteria.forEach((c, i) => {
      if (c.id && !ids.has(c.id)) fields[`criteria.${i}.id`] = 'Unknown criterion'
    })
    if (Object.keys(fields).length) throw validationFailed(fields)
    const keep = input.criteria.flatMap((c) => (c.id ? [c.id] : []))
    await tx
      .delete(competitionCriteria)
      .where(
        and(
          eq(competitionCriteria.roundId, round.id),
          keep.length ? notInArray(competitionCriteria.id, keep) : undefined,
        ),
      )
    for (const [i, c] of input.criteria.entries()) {
      const values = {
        question: cleanI18n(c.question),
        weightPct: c.weightPct,
        sortOrder: c.order ?? i,
      }
      if (c.id)
        await tx.update(competitionCriteria).set(values).where(eq(competitionCriteria.id, c.id))
      else await tx.insert(competitionCriteria).values({ roundId: round.id, ...values })
    }
    await tx
      .update(competitionRounds)
      .set({ rubricUpdatedAt: new Date() })
      .where(eq(competitionRounds.id, round.id))
    await recordAudit(tx, {
      actorId: actor.id,
      action: 'rubric.update',
      target: { type: 'competition_round', id: round.id, label: round.name.en },
      micrositeId: m.id,
      ip: actor.ip,
    })
  })
  return getRubric(m, roundId)
}

/* ------------------------------------------------------------------ P42 judges */

type JudgeStatus = 'active' | 'disabled' | 'invited' | 'expired' | 'revoked'

/** Roster plus pending judge invitations of p; assigned/graded count submitted entries. */
export async function listJudges(m: Microsite, q: z.infer<typeof JudgesQuery>) {
  const roster = await db
    .select({ judge: competitionJudges, user: users })
    .from(competitionJudges)
    .leftJoin(users, eq(users.id, competitionJudges.userId))
    .where(eq(competitionJudges.micrositeId, m.id))
  const invites = await db
    .select()
    .from(invitations)
    .where(and(eq(invitations.micrositeId, m.id), eq(invitations.role, 'judge')))
    .orderBy(desc(invitations.createdAt))
  const latestInvite = new Map<string, (typeof invites)[number]>()
  for (const inv of invites) if (!latestInvite.has(inv.email)) latestInvite.set(inv.email, inv)

  // Assigned / graded per roster row (submitted entries of this microsite's rounds).
  const assigned = await db
    .select({
      judgeId: competitionAssignments.judgeId,
      submissionId: competitionAssignments.submissionId,
      roundId: competitionSubmissions.roundId,
    })
    .from(competitionAssignments)
    .innerJoin(
      competitionSubmissions,
      eq(competitionSubmissions.id, competitionAssignments.submissionId),
    )
    .innerJoin(competitionJudges, eq(competitionJudges.id, competitionAssignments.judgeId))
    .where(
      and(
        eq(competitionJudges.micrositeId, m.id),
        inArray(competitionSubmissions.status, [...VISIBLE_SUBMISSION]),
      ),
    )
  const scores = await scoresFor([...new Set(assigned.map((a) => a.submissionId))])
  const roundIds = [...new Set(assigned.map((a) => a.roundId))]
  const criteria = new Map(
    await Promise.all(roundIds.map(async (id) => [id, await criteriaOf(id)] as const)),
  )

  const entries = roster.map(({ judge, user }) => {
    const inv = latestInvite.get(judge.email)
    let status: JudgeStatus
    if (user)
      status =
        user.status === 'disabled' ? 'disabled' : user.status === 'invited' ? 'invited' : 'active'
    else if (!inv || inv.status === 'revoked') status = 'revoked'
    else if (inv.status === 'expired' || (inv.status === 'sent' && inv.expiresAt < now()))
      status = 'expired'
    else status = 'invited'
    const mine = assigned.filter((a) => a.judgeId === judge.id)
    const graded = user
      ? mine.filter((a) =>
          isComplete(
            criteria.get(a.roundId) ?? [],
            scores.get(a.submissionId)?.get(user.id) ?? new Map(),
          ),
        ).length
      : 0
    return {
      ...(user ? { userId: user.id, name: user.name } : {}),
      ...(inv && !user ? { invitationId: inv.id } : {}),
      email: judge.email,
      status,
      assigned: mine.length,
      graded,
    }
  })
  const inRoster = new Set(roster.map((r) => r.judge.email))
  for (const inv of latestInvite.values()) {
    if (inRoster.has(inv.email) || inv.status === 'accepted') continue
    entries.push({
      invitationId: inv.id,
      email: inv.email,
      status:
        inv.status === 'revoked'
          ? 'revoked'
          : inv.status === 'expired' || inv.expiresAt < now()
            ? 'expired'
            : 'invited',
      assigned: 0,
      graded: 0,
    })
  }
  entries.sort((a, b) => (a.name ?? a.email).localeCompare(b.name ?? b.email))
  const start = (q.page - 1) * q.pageSize
  return paged(entries.slice(start, start + q.pageSize), entries.length, q)
}

/** Judge invitations for p (shared `invitation` e-mail); a pending roster row per invitee. */
export async function inviteJudges(m: Microsite, viewer: Viewer, emails: string[]) {
  return db.transaction(async (tx) => {
    const active = new Set(
      (
        await tx
          .select({ email: competitionJudges.email })
          .from(competitionJudges)
          .where(and(eq(competitionJudges.micrositeId, m.id), isNotNull(competitionJudges.userId)))
      ).map((r) => r.email),
    )
    const skipped: { email: string; reason: string }[] = []
    const toInvite: string[] = []
    for (const raw of emails) {
      const parsed = emailSchema.safeParse(raw)
      if (parsed.success && active.has(parsed.data))
        skipped.push({ email: parsed.data, reason: 'already_judge' })
      else toInvite.push(raw)
    }
    const result = await createInvitations(
      {
        emails: toInvite,
        role: 'judge',
        micrositeId: m.id,
        inviter: { id: viewer.id, name: viewer.name, ip: viewer.ip },
      },
      tx,
    )
    for (const c of result.created) await upsertRoster(tx, m.id, c.email, null, c.id)
    return { created: result.created.length, skipped: [...skipped, ...result.skipped] }
  })
}

export async function upsertRoster(
  tx: Tx,
  micrositeId: string,
  email: string,
  userId: string | null,
  invitationId: string | null,
) {
  await tx
    .insert(competitionJudges)
    .values({ micrositeId, email, userId, invitationId })
    .onConflictDoUpdate({
      target: [competitionJudges.micrositeId, competitionJudges.email],
      set: {
        ...(userId ? { userId } : {}),
        ...(invitationId ? { invitationId } : {}),
      },
    })
}

/* ------------------------------------------------------------------ P42 assignments */

async function activeJudgesOf(m: Microsite, tx: Tx) {
  return tx
    .select({ rosterId: competitionJudges.id, userId: users.id, email: users.email })
    .from(competitionJudges)
    .innerJoin(users, eq(users.id, competitionJudges.userId))
    .where(and(eq(competitionJudges.micrositeId, m.id), eq(users.status, 'active')))
    .orderBy(asc(users.email))
}

/** Replaces the judges of the listed submissions; judges must be on p's roster (422). */
export async function setAssignments(
  m: Microsite,
  actor: Actor,
  roundId: string,
  input: z.infer<typeof AssignmentsInput>,
) {
  return db.transaction(async (tx) => {
    const round = await roundOr404(roundId, m.id, tx)
    assertNotClosed(round)
    const subIds = input.assignments.map((a) => a.submissionId)
    const subs = new Set(
      (
        await tx
          .select({ id: competitionSubmissions.id })
          .from(competitionSubmissions)
          .where(
            and(
              eq(competitionSubmissions.roundId, round.id),
              inArray(competitionSubmissions.id, subIds),
            ),
          )
      ).map((s) => s.id),
    )
    const judges = new Map((await activeJudgesOf(m, tx)).map((j) => [j.userId, j.rosterId]))
    const fields: Record<string, string> = {}
    input.assignments.forEach((a, i) => {
      if (!subs.has(a.submissionId)) fields[`assignments.${i}.submissionId`] = 'Not in this round'
      if (a.judgeUserIds.some((u) => !judges.has(u)))
        fields[`assignments.${i}.judgeUserIds`] = 'Only judges of this microsite can be assigned'
    })
    if (new Set(subIds).size !== subIds.length) fields.assignments = 'Each submission once'
    if (Object.keys(fields).length) throw validationFailed(fields)

    let assigned = 0
    for (const a of input.assignments) {
      const rosterIds = [...new Set(a.judgeUserIds)].map((u) => judges.get(u)!)
      await tx
        .delete(competitionAssignments)
        .where(
          and(
            eq(competitionAssignments.submissionId, a.submissionId),
            rosterIds.length ? notInArray(competitionAssignments.judgeId, rosterIds) : undefined,
          ),
        )
      if (rosterIds.length)
        await tx
          .insert(competitionAssignments)
          .values(rosterIds.map((judgeId) => ({ submissionId: a.submissionId, judgeId })))
          .onConflictDoNothing()
      assigned += rosterIds.length
      await refreshSubmissionStatus(tx, a.submissionId)
    }
    await recordAudit(tx, {
      actorId: actor.id,
      action: 'assignments.update',
      target: { type: 'competition_round', id: round.id, label: round.name.en },
      micrositeId: m.id,
      ip: actor.ip,
      meta: { submissions: subIds.length },
    })
    return { assigned }
  })
}

/** Fills every submitted entry up to N judges, least-loaded first. Returns new assignments. */
export async function autoAssign(
  m: Microsite,
  actor: Actor,
  roundId: string,
  perSubmission: number,
) {
  return db.transaction(async (tx) => {
    const round = await roundOr404(roundId, m.id, tx)
    assertNotClosed(round)
    const judges = await activeJudgesOf(m, tx)
    if (judges.length === 0) throw conflict('Invite judges to this microsite first')
    const subs = await tx
      .select({ id: competitionSubmissions.id })
      .from(competitionSubmissions)
      .where(
        and(
          eq(competitionSubmissions.roundId, round.id),
          inArray(competitionSubmissions.status, [...VISIBLE_SUBMISSION]),
        ),
      )
      .orderBy(asc(competitionSubmissions.submittedAt))
    const current = await assignmentsFor(
      subs.map((s) => s.id),
      tx,
    )
    const load = new Map(judges.map((j) => [j.rosterId, 0]))
    for (const list of current.values())
      for (const a of list)
        if (load.has(a.rosterId)) load.set(a.rosterId, load.get(a.rosterId)! + 1)
    const target = Math.min(perSubmission, judges.length)
    let created = 0
    for (const s of subs) {
      const have = new Set((current.get(s.id) ?? []).map((a) => a.rosterId))
      const candidates = judges
        .filter((j) => !have.has(j.rosterId))
        .sort((a, b) => load.get(a.rosterId)! - load.get(b.rosterId)!)
      const need = Math.max(0, target - have.size)
      for (const j of candidates.slice(0, need)) {
        await tx
          .insert(competitionAssignments)
          .values({ submissionId: s.id, judgeId: j.rosterId })
          .onConflictDoNothing()
        load.set(j.rosterId, load.get(j.rosterId)! + 1)
        created++
      }
      if (need > 0) await refreshSubmissionStatus(tx, s.id)
    }
    await recordAudit(tx, {
      actorId: actor.id,
      action: 'assignments.auto',
      target: { type: 'competition_round', id: round.id, label: round.name.en },
      micrositeId: m.id,
      ip: actor.ip,
      meta: { perSubmission, created },
    })
    return { assigned: created }
  })
}

/* ------------------------------------------------------------------ P44 scores */

export async function roundScores(m: Microsite, roundId: string, aggregation: Aggregation) {
  const round = await roundOr404(roundId, m.id)
  const rows = await roundResults(round.id, aggregation)
  return {
    aggregation,
    rows: rows.map((r) => ({
      submissionId: r.submissionId,
      applicant: { userId: r.userId, name: r.name, email: r.email },
      judges: r.judges.map((j) => ({
        judgeName: j.judgeName,
        total: j.total,
        perCriterion: j.perCriterion,
      })),
      finalScore: r.finalScore,
      rank: r.rank,
    })),
  }
}

/** CSV of the same rows (same scope), audited. */
export async function roundScoresCsv(
  m: Microsite,
  actor: Actor,
  roundId: string,
  aggregation: Aggregation,
) {
  const round = await roundOr404(roundId, m.id)
  const rows = await roundResults(round.id, aggregation)
  await recordAudit(db, {
    actorId: actor.id,
    action: 'scores.export',
    target: { type: 'competition_round', id: round.id, label: round.name.en },
    micrositeId: m.id,
    ip: actor.ip,
    meta: { aggregation, rows: rows.length },
  })
  return toCsv(
    ['rank', 'applicant', 'email', 'final_score', 'aggregation', 'judges'],
    rows.map((r) => [
      r.rank ?? '',
      r.name,
      r.email,
      r.finalScore ?? '',
      aggregation,
      r.judges.map((j) => `${j.judgeName}: ${j.total}`).join('; '),
    ]),
  )
}
