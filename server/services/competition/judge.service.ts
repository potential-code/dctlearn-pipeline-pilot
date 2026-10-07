import { type DbOrTx, db } from '@server/db/connection'
import {
  competitionAssignments,
  competitionJudges,
  competitionRounds,
  competitionScores,
  competitionSubmissions,
} from '@server/db/schema/competition'
import { users } from '@server/db/schema/identity'
import { microsites } from '@server/db/schema/microsites'
import { locked, notFound, validationFailed } from '@server/lib/errors'
import { paged } from '@server/lib/pagination'
import { sanitizeText } from '@server/lib/sanitize'
import { toMicrositeRef } from '@server/services/microsites/lookup.service'
import { actionPlanReader } from '@server/services/seams/action-plan.seam'
import type { ApplicantsQuery, ScoresInput } from '@shared/schemas/competition'
import { and, eq, inArray } from 'drizzle-orm'
import type { z } from 'zod'
import {
  criteriaOf,
  refreshSubmissionStatus,
  scoresFor,
  VISIBLE_SUBMISSION,
} from './rounds.service'
import { isComplete, weightedTotal } from './scoring'

/**
 * Judge side (P33/P34): only submissions assigned to the signed-in judge, checked per
 * submission and round; applicants are shown by name + microsite only; scoring only while the
 * round is `judging`. Anything not assigned answers 404.
 */

type RoundStatus = 'draft' | 'open' | 'judging' | 'closed'

/** Assigned, submitted entries of this judge (microsites with competition on). */
async function assignedRows(
  judgeUserId: string,
  filter: { roundId?: string; submissionId?: string } = {},
  tx: DbOrTx = db,
) {
  return tx
    .select({
      submission: competitionSubmissions,
      round: competitionRounds,
      microsite: microsites,
      applicantName: users.name,
    })
    .from(competitionAssignments)
    .innerJoin(competitionJudges, eq(competitionJudges.id, competitionAssignments.judgeId))
    .innerJoin(
      competitionSubmissions,
      eq(competitionSubmissions.id, competitionAssignments.submissionId),
    )
    .innerJoin(competitionRounds, eq(competitionRounds.id, competitionSubmissions.roundId))
    .innerJoin(
      microsites,
      and(
        eq(microsites.id, competitionRounds.micrositeId),
        // The roster row must belong to the round's microsite (round check).
        eq(microsites.id, competitionJudges.micrositeId),
      ),
    )
    .innerJoin(users, eq(users.id, competitionSubmissions.userId))
    .where(
      and(
        eq(competitionJudges.userId, judgeUserId),
        eq(microsites.competitionEnabled, true),
        inArray(competitionSubmissions.status, [...VISIBLE_SUBMISSION]),
        filter.roundId ? eq(competitionRounds.id, filter.roundId) : undefined,
        filter.submissionId ? eq(competitionSubmissions.id, filter.submissionId) : undefined,
      ),
    )
    .orderBy(competitionSubmissions.submittedAt)
}

async function gradedState(judgeUserId: string, rows: Awaited<ReturnType<typeof assignedRows>>) {
  const roundIds = [...new Set(rows.map((r) => r.round.id))]
  const criteria = new Map(
    await Promise.all(roundIds.map(async (id) => [id, await criteriaOf(id)] as const)),
  )
  const scores = await scoresFor(rows.map((r) => r.submission.id))
  return rows.map((r) => {
    const marks = scores.get(r.submission.id)?.get(judgeUserId) ?? new Map<string, number>()
    const rubric = criteria.get(r.round.id) ?? []
    const graded = isComplete(rubric, marks)
    return { ...r, graded, myScore: graded ? weightedTotal(rubric, marks) : undefined }
  })
}

export async function judgeDashboard(viewer: Viewer) {
  const rows = await gradedState(viewer.id, await assignedRows(viewer.id))
  const byRound = new Map<string, (typeof rows)[number][]>()
  for (const r of rows) byRound.set(r.round.id, [...(byRound.get(r.round.id) ?? []), r])
  const rounds = await Promise.all(
    [...byRound.values()].map(async (list) => {
      const { round, microsite } = list[0]!
      return {
        roundId: round.id,
        microsite: await toMicrositeRef(microsite, viewer.id),
        name: round.name,
        status: round.status as RoundStatus,
        deadline: round.closesAt.toISOString(),
        assigned: list.length,
        graded: list.filter((x) => x.graded).length,
      }
    }),
  )
  const graded = rows.filter((r) => r.graded).length
  return {
    kpis: { assigned: rows.length, graded, pending: rows.length - graded },
    rounds,
  }
}

export async function applicants(
  viewer: Viewer,
  roundId: string,
  q: z.infer<typeof ApplicantsQuery>,
) {
  const rows = await gradedState(viewer.id, await assignedRows(viewer.id, { roundId }))
  if (rows.length === 0) throw notFound()
  const filtered = rows.filter((r) => !q.status || (q.status === 'graded' ? r.graded : !r.graded))
  const start = (q.page - 1) * q.pageSize
  const ref = await toMicrositeRef(rows[0]!.microsite, viewer.id)
  return paged(
    filtered.slice(start, start + q.pageSize).map((r) => ({
      submissionId: r.submission.id,
      applicant: { name: r.applicantName, microsite: ref },
      submittedAt: (r.submission.submittedAt ?? r.submission.createdAt).toISOString(),
      status: r.graded ? ('graded' as const) : ('pending' as const),
      ...(r.myScore !== undefined ? { myScore: r.myScore } : {}),
    })),
    filtered.length,
    q,
  )
}

async function assignedOr404(viewer: Viewer, submissionId: string, tx: DbOrTx = db) {
  const [row] = await assignedRows(viewer.id, { submissionId }, tx)
  if (!row) throw notFound()
  return row
}

export async function submissionDetail(viewer: Viewer, submissionId: string) {
  const row = await assignedOr404(viewer, submissionId)
  const reader = actionPlanReader()
  const block = await reader.findPitchBlock(row.round.courseId)
  const blockId = row.submission.blockId ?? block?.blockId ?? null
  const answers = blockId ? (await reader.getAnswers(row.submission.userId, blockId)).answers : {}
  const pdfUrl = blockId ? await reader.pdfUrl(row.submission.userId, blockId, viewer.id) : null
  const criteria = await criteriaOf(row.round.id)
  const mine = await db
    .select()
    .from(competitionScores)
    .where(
      and(
        eq(competitionScores.submissionId, row.submission.id),
        eq(competitionScores.judgeId, viewer.id),
      ),
    )
  const order = new Map(criteria.map((c, i) => [c.id, i]))
  return {
    applicant: {
      name: row.applicantName,
      microsite: await toMicrositeRef(row.microsite, viewer.id),
    },
    pitch: {
      ...(pdfUrl ? { pdfUrl } : {}),
      answers: (block?.questions ?? []).map((q) => ({
        question: q.text,
        answer: answers[String(q.no)] ?? '',
      })),
    },
    rubric: criteria.map((c) => ({
      criterionId: c.id,
      question: c.question,
      weightPct: c.weightPct,
    })),
    ...(mine.length
      ? {
          myScores: mine
            .filter((s) => order.has(s.criterionId))
            .sort((a, b) => (order.get(a.criterionId) ?? 0) - (order.get(b.criterionId) ?? 0))
            .map((s) => ({
              criterionId: s.criterionId,
              score: s.score,
              ...(s.feedback ? { feedback: s.feedback } : {}),
            })),
        }
      : {}),
  }
}

/**
 * Scores 1–10 for every criterion, only while the round is `judging`. Each judge has their own
 * rows (§9.4); the submission row is locked so the "all judges scored" check sees concurrent
 * judges. Returns this judge's weighted total.
 */
export async function putScores(
  viewer: Viewer,
  submissionId: string,
  input: z.infer<typeof ScoresInput>,
) {
  return db.transaction(async (tx) => {
    await tx
      .select({ id: competitionSubmissions.id })
      .from(competitionSubmissions)
      .where(eq(competitionSubmissions.id, submissionId))
      .for('update')
    const row = await assignedOr404(viewer, submissionId, tx)
    if (row.round.status !== 'judging')
      throw locked('Scoring is only open while the round is judging')
    const criteria = await criteriaOf(row.round.id, tx)
    const known = new Set(criteria.map((c) => c.id))
    const fields: Record<string, string> = {}
    const seen = new Set<string>()
    input.scores.forEach((s, i) => {
      if (!known.has(s.criterionId)) fields[`scores.${i}.criterionId`] = 'Unknown criterion'
      else if (seen.has(s.criterionId)) fields[`scores.${i}.criterionId`] = 'Scored twice'
      seen.add(s.criterionId)
    })
    if (Object.keys(fields).length === 0 && criteria.some((c) => !seen.has(c.id)))
      fields.scores = 'Score every criterion'
    if (Object.keys(fields).length) throw validationFailed(fields)

    for (const s of input.scores) {
      const feedback = s.feedback ? sanitizeText(s.feedback) || null : null
      await tx
        .insert(competitionScores)
        .values({
          judgeId: viewer.id,
          submissionId,
          criterionId: s.criterionId,
          score: s.score,
          feedback,
        })
        .onConflictDoUpdate({
          target: [
            competitionScores.judgeId,
            competitionScores.submissionId,
            competitionScores.criterionId,
          ],
          set: { score: s.score, feedback },
        })
    }
    await refreshSubmissionStatus(tx, submissionId)
    return {
      weightedTotal: weightedTotal(
        criteria,
        new Map(input.scores.map((s) => [s.criterionId, s.score])),
      ),
    }
  })
}
