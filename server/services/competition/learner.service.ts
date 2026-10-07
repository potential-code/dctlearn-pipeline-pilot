import { type DbOrTx, db } from '@server/db/connection'
import { courses, enrolments, micrositeCourses } from '@server/db/schema/catalog'
import { competitionRounds, competitionSubmissions } from '@server/db/schema/competition'
import { type Microsite, memberships } from '@server/db/schema/microsites'
import { now } from '@server/lib/clock'
import { conflict, locked, notFound } from '@server/lib/errors'
import { pointsTotal } from '@server/services/catalog/points.service'
import { actionPlanReader } from '@server/services/seams/action-plan.seam'
import type { CompetitionView } from '@shared/schemas/competition'
import { and, eq, inArray, sql } from 'drizzle-orm'
import type { z } from 'zod'
import { currentRound, roundResults } from './rounds.service'

/**
 * Learner side (P28/P29): own submission only. The submission is the learner's action plan of
 * the round's course (pitch block); submitting is one-way and locks the answers.
 */

type SubmissionStatus = 'not_started' | 'in_progress' | 'submitted' | 'scored'
type RoundStatus = 'draft' | 'open' | 'judging' | 'closed'

async function ownSubmission(roundId: string, userId: string, tx: DbOrTx = db) {
  const [row] = await tx
    .select()
    .from(competitionSubmissions)
    .where(
      and(eq(competitionSubmissions.roundId, roundId), eq(competitionSubmissions.userId, userId)),
    )
  return row ?? null
}

async function progressPct(userId: string, courseId: string, tx: DbOrTx = db) {
  const [row] = await tx
    .select({ pct: enrolments.progressPct })
    .from(enrolments)
    .where(and(eq(enrolments.userId, userId), eq(enrolments.courseId, courseId)))
  return row?.pct ?? 0
}

async function visibleRound(m: Microsite) {
  const round = await currentRound(m.id)
  if (!round) throw notFound('No competition round yet')
  return round
}

export async function competitionView(
  viewer: Viewer,
  m: Microsite,
): Promise<z.infer<typeof CompetitionView>> {
  const round = await visibleRound(m)
  const [course] = await db.select().from(courses).where(eq(courses.id, round.courseId))
  if (!course) throw notFound()
  const sub = await ownSubmission(round.id, viewer.id)
  const pct = round.eligibilityMinProgressPct
  return {
    round: {
      id: round.id,
      name: round.name,
      status: round.status as RoundStatus,
      opensAt: round.opensAt.toISOString(),
      closesAt: round.closesAt.toISOString(),
      description: round.description,
    },
    submission: {
      status: (sub?.status ?? 'not_started') as SubmissionStatus,
      courseId: course.id,
      courseSlug: course.slug,
      ...(sub?.submittedAt ? { submittedAt: sub.submittedAt.toISOString() } : {}),
    },
    eligible: (await progressPct(viewer.id, course.id)) >= pct,
    eligibilityRule: {
      en: `Complete at least ${pct}% of “${course.title.en}” and submit your pitch before the deadline.`,
      ar: `أكمل ${pct}% على الأقل من «${course.title.ar || course.title.en}» وقدّم عرضك قبل الموعد النهائي.`,
    },
  }
}

/** One-way: eligibility checked, answers locked through the ActionPlanReader, 409 after. */
export async function submit(viewer: Viewer, m: Microsite) {
  return db.transaction(async (tx) => {
    const round = await currentRound(m.id, tx)
    if (!round) throw notFound('No competition round yet')
    const t = now()
    const existing = await ownSubmission(round.id, viewer.id, tx)
    if (existing && (existing.status === 'submitted' || existing.status === 'scored'))
      throw locked('Your pitch was already submitted')
    if (round.status !== 'open' || t < round.opensAt || t >= round.closesAt)
      throw locked('The round is not open for submissions')
    if ((await progressPct(viewer.id, round.courseId, tx)) < round.eligibilityMinProgressPct)
      throw conflict(
        `Complete at least ${round.eligibilityMinProgressPct}% of the course before submitting`,
      )
    const reader = actionPlanReader()
    const block = await reader.findPitchBlock(round.courseId, tx)
    if (!block) throw conflict('This course has no pitch to submit')
    const { answers } = await reader.getAnswers(viewer.id, block.blockId, tx)
    if (!Object.values(answers).some((a) => a.trim().length > 0))
      throw conflict('Save your pitch answers before submitting')

    const [row] = await tx
      .insert(competitionSubmissions)
      .values({
        roundId: round.id,
        userId: viewer.id,
        status: 'submitted',
        blockId: block.blockId,
        submittedAt: t,
      })
      .onConflictDoUpdate({
        target: [competitionSubmissions.roundId, competitionSubmissions.userId],
        set: { status: 'submitted', blockId: block.blockId, submittedAt: t },
        setWhere: sql`${competitionSubmissions.status} in ('not_started', 'in_progress')`,
      })
      .returning({ id: competitionSubmissions.id })
    if (!row) throw locked('Your pitch was already submitted')
    await reader.lock(viewer.id, block.blockId, tx)
    return { status: 'submitted' as const }
  })
}

async function micrositeCourseIds(micrositeId: string) {
  return (
    await db
      .select({ id: micrositeCourses.courseId })
      .from(micrositeCourses)
      .where(eq(micrositeCourses.micrositeId, micrositeId))
  ).map((r) => r.id)
}

/** P29: points, unit progress, countdown; score and rank only once the round is closed. */
export async function competitionDashboard(viewer: Viewer, m: Microsite) {
  const round = await visibleRound(m)
  const sub = await ownSubmission(round.id, viewer.id)
  const units = await actionPlanReader().unitProgress(viewer.id, round.courseId)
  let extra: { score?: { total: number; outOf: 100 }; rank?: number } = {}
  if (round.status === 'closed' && sub) {
    const mine = (await roundResults(round.id, 'mean')).find((r) => r.submissionId === sub.id)
    if (mine?.finalScore != null)
      extra = {
        score: { total: mine.finalScore, outOf: 100 },
        ...(mine.rank ? { rank: mine.rank } : {}),
      }
  }
  return {
    points: await pointsTotal(viewer.id, await micrositeCourseIds(m.id)),
    unitsCompleted: units.completed,
    unitsTotal: units.total,
    countdown: { closesAt: round.closesAt.toISOString() },
    status: (sub?.status ?? 'not_started') as SubmissionStatus,
    ...extra,
  }
}

/** P14 dashboard section. */
export async function dashboardSection(viewer: Viewer, m: Microsite) {
  const round = await currentRound(m.id)
  if (!round) return { enabled: true, status: 'not_started' as SubmissionStatus }
  const sub = await ownSubmission(round.id, viewer.id)
  return {
    enabled: true,
    roundId: round.id,
    roundName: round.name,
    status: (sub?.status ?? 'not_started') as SubmissionStatus,
    deadline: round.closesAt.toISOString(),
  }
}

/**
 * Action-plan save hook: the first save of a round's pitch moves the learner's submission
 * `not_started → in_progress` (rounds in draft or open, microsites the learner belongs to).
 */
export async function onPitchSaved(tx: DbOrTx, input: { userId: string; blockId: string }) {
  const rounds = await tx
    .select({ id: competitionRounds.id, courseId: competitionRounds.courseId })
    .from(competitionRounds)
    .innerJoin(
      memberships,
      and(
        eq(memberships.micrositeId, competitionRounds.micrositeId),
        eq(memberships.userId, input.userId),
      ),
    )
    .where(inArray(competitionRounds.status, ['draft', 'open']))
  const reader = actionPlanReader()
  for (const round of rounds) {
    const block = await reader.findPitchBlock(round.courseId, tx)
    if (block?.blockId !== input.blockId) continue
    await tx
      .insert(competitionSubmissions)
      .values({
        roundId: round.id,
        userId: input.userId,
        status: 'in_progress',
        blockId: input.blockId,
      })
      .onConflictDoUpdate({
        target: [competitionSubmissions.roundId, competitionSubmissions.userId],
        set: { status: 'in_progress', blockId: input.blockId },
        setWhere: sql`${competitionSubmissions.status} = 'not_started'`,
      })
  }
}
