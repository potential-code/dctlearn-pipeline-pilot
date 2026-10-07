import { type DbOrTx, db } from '@server/db/connection'
import { courses, enrolments } from '@server/db/schema/catalog'
import { users } from '@server/db/schema/identity'
import { blockProgress, type CourseBlock, unitProgress } from '@server/db/schema/learning'
import { queueEmail } from '@server/jobs/email.job'
import { enqueue } from '@server/jobs/runtime'
import { now } from '@server/lib/clock'
import { locked, notFound } from '@server/lib/errors'
import { evaluateBadges } from '@server/services/achievements/badges.service'
import { awardPoints } from '@server/services/catalog/points.service'
import { and, eq, sql } from 'drizzle-orm'
import { type Course, loadBlockFor, loadUnitFor } from './access.service'
import { type Certificate, certificateRef, issueCertificate, shareUrl } from './certificate.service'
import {
  blockingAssessment,
  blockStates,
  courseCompletable,
  learnerState,
  liveBlocks,
  loadStructure,
  nextIncompleteUnit,
  progressPct,
  type Structure,
  unitStatuses,
} from './structure.service'

/**
 * Progress rules (P16, §9.4): every write locks the learner's enrolment row (`FOR UPDATE`) so a
 * double click or two tabs serialise; unique keys make points, unit completion and certificates
 * idempotent. `enrolments` is kept current for the dashboard and other areas.
 */

/** The enrolment row, created if missing (admins / sub admins viewing as learner), locked. */
export async function lockEnrolment(tx: DbOrTx, userId: string, courseId: string) {
  await tx.insert(enrolments).values({ userId, courseId }).onConflictDoNothing()
  const [row] = await tx
    .select()
    .from(enrolments)
    .where(and(eq(enrolments.userId, userId), eq(enrolments.courseId, courseId)))
    .for('update')
  return row!
}

/** Recomputes progressPct / state / nextUnitId; completed enrolments stay completed (§9.5). */
export async function recalcEnrolment(
  tx: DbOrTx,
  userId: string,
  courseId: string,
  opts: { activity?: boolean } = {},
) {
  const [e] = await tx
    .select()
    .from(enrolments)
    .where(and(eq(enrolments.userId, userId), eq(enrolments.courseId, courseId)))
  if (!e) return null
  const structure = await loadStructure(courseId, tx)
  const state = await learnerState(userId, courseId, structure, tx)
  const pct = progressPct(structure, state)
  const completed = e.state === 'completed'
  const next = nextIncompleteUnit(structure, state)
  const at = now()
  const active = opts.activity || pct > 0
  const [row] = await tx
    .update(enrolments)
    .set({
      progressPct: completed ? 100 : pct,
      state: completed
        ? 'completed'
        : active || e.state === 'in_progress'
          ? 'in_progress'
          : 'not_started',
      nextUnitId: completed ? null : (next?.id ?? null),
      ...(opts.activity ? { lastActivityAt: at, startedAt: e.startedAt ?? at } : {}),
    })
    .where(eq(enrolments.id, e.id))
    .returning()
  return row!
}

/** Recalculation for every enrolment of a course (job after content edits, §9.5). */
export async function recalcCourse(courseId: string) {
  const rows = await db
    .select({ userId: enrolments.userId })
    .from(enrolments)
    .where(eq(enrolments.courseId, courseId))
  for (const r of rows) await recalcEnrolment(db, r.userId, courseId)
  return rows.length
}

export async function markBlockComplete(
  tx: DbOrTx,
  userId: string,
  block: Pick<CourseBlock, 'id' | 'unitId' | 'courseId'>,
  extra: { completed?: boolean; positionSec?: number } = { completed: true },
) {
  const at = now()
  await tx
    .insert(blockProgress)
    .values({
      userId,
      courseId: block.courseId,
      unitId: block.unitId,
      blockId: block.id,
      completedAt: extra.completed ? at : null,
      positionSec: extra.positionSec ?? null,
    })
    .onConflictDoUpdate({
      target: [blockProgress.userId, blockProgress.blockId],
      set: {
        ...(extra.completed ? { completedAt: sqlCoalesceCompleted(at) } : {}),
        ...(extra.positionSec !== undefined ? { positionSec: extra.positionSec } : {}),
        updatedAt: at,
      },
    })
}

// Keep the first completion time when a block is completed again.
function sqlCoalesceCompleted(at: Date) {
  return sql`coalesce(${blockProgress.completedAt}, ${at.toISOString()}::timestamptz)`
}

/** Unit must be open for the learner: 409 `locked` otherwise. */
export function assertUnitOpen(
  structure: Structure,
  statuses: Map<string, string>,
  unitId: string,
) {
  const s = statuses.get(unitId)
  if (!s || !structure.units.some((u) => u.id === unitId)) throw notFound()
  if (s === 'locked') throw locked('This unit is locked — complete the earlier units first')
}

/** Loads the unit, its course state and checks the unit is open; for block writes. */
export async function openBlockForWrite(
  tx: DbOrTx,
  viewer: Viewer,
  unitId: string,
  blockId: string,
) {
  const ctx = await loadBlockFor(viewer, unitId, blockId, tx)
  await lockEnrolment(tx, viewer.id, ctx.course.id)
  const structure = await loadStructure(ctx.course.id, tx)
  const state = await learnerState(viewer.id, ctx.course.id, structure, tx)
  const statuses = unitStatuses(structure, state, {
    sequential: ctx.course.sequential,
    comingSoon: ctx.course.comingSoon,
  })
  assertUnitOpen(structure, statuses, unitId)
  return ctx
}

/** POST block progress (video position, "seen" blocks). */
export async function saveBlockProgress(
  viewer: Viewer,
  unitId: string,
  blockId: string,
  input: { completed: boolean; positionSec?: number },
) {
  await db.transaction(async (tx) => {
    const { block } = await openBlockForWrite(tx, viewer, unitId, blockId)
    await markBlockComplete(tx, viewer.id, block, input)
    await recalcEnrolment(tx, viewer.id, block.courseId, { activity: true })
  })
}

export type CompletionReason = 'blocks_incomplete' | 'assessment_required'

export async function unitCompletion(
  userId: string,
  unitId: string,
  structure: Structure,
  state: Awaited<ReturnType<typeof learnerState>>,
  tx: DbOrTx = db,
): Promise<{ canComplete: boolean; reason?: CompletionReason }> {
  const blocks = await liveBlocks(unitId, tx)
  const done = await blockStates(
    userId,
    blocks.map((b) => b.id),
    tx,
  )
  if (blocks.some((b) => b.required && !done.get(b.id)?.completedAt))
    return { canComplete: false, reason: 'blocks_incomplete' }
  const quiz = blockingAssessment(structure, unitId)
  if (quiz && !state.attempts.get(quiz.id)?.passed)
    return { canComplete: false, reason: 'assessment_required' }
  return { canComplete: true }
}

/**
 * Course completion (seam implementation): enrolment completed, course points and the
 * certificate once, `course-complete` e-mail once, rule badges. Safe to call repeatedly.
 */
export async function completeCourseInTx(
  tx: DbOrTx,
  input: { userId: string; courseId: string; actorId?: string | null },
): Promise<{ pointsAwarded: number; certificate: Certificate | null }> {
  const [course] = await tx.select().from(courses).where(eq(courses.id, input.courseId))
  if (!course) throw notFound()
  const e = await lockEnrolment(tx, input.userId, input.courseId)
  const first = e.state !== 'completed'
  const at = now()
  if (first) {
    await tx
      .update(enrolments)
      .set({
        state: 'completed',
        progressPct: 100,
        nextUnitId: null,
        completedAt: e.completedAt ?? at,
        startedAt: e.startedAt ?? at,
        lastActivityAt: at,
      })
      .where(eq(enrolments.id, e.id))
  }
  const pointsAwarded = await awardPoints(tx, {
    userId: input.userId,
    courseId: input.courseId,
    sourceType: 'course',
    sourceId: input.courseId,
    points: course.pointsConfig.course,
    reason: { en: `Completed ${course.title.en}`, ar: `أكمل ${course.title.ar}` },
    actorId: input.actorId ?? null,
  })
  const [user] = await tx
    .select({ name: users.name, email: users.email, locale: users.locale })
    .from(users)
    .where(eq(users.id, input.userId))
  let certificate: Certificate | null = null
  if (course.certificateEnabled && user) {
    const issued = await issueCertificate(tx, {
      enrolmentId: e.id,
      userId: input.userId,
      courseId: input.courseId,
      learnerName: user.name,
    })
    certificate = issued.certificate
    if (issued.created)
      await enqueue(
        'learning.certificate_pdf',
        { certificateId: certificate.id },
        { tx, dedupeKey: `certificate_pdf:${certificate.id}` },
      )
  }
  if (first && user)
    await queueEmail(
      user.email,
      'course-complete',
      {
        name: user.name,
        courseTitle: user.locale === 'ar' ? course.title.ar || course.title.en : course.title.en,
        ...(certificate
          ? { certificateUrl: shareUrl(certificate.serial), serial: certificate.serial }
          : {}),
      },
      { tx, locale: user.locale === 'ar' ? 'ar' : 'en' },
    )
  await evaluateBadges(tx, input.userId)
  return { pointsAwarded, certificate }
}

/** POST /api/units/{id}/complete — idempotent under double click (§9.4). */
export async function completeUnit(viewer: Viewer, unitId: string) {
  const result = await db.transaction(async (tx) => {
    const { unit, course } = await loadUnitFor(viewer, unitId, tx)
    await lockEnrolment(tx, viewer.id, course.id)
    const structure = await loadStructure(course.id, tx)
    let state = await learnerState(viewer.id, course.id, structure, tx)
    const statuses = unitStatuses(structure, state, {
      sequential: course.sequential,
      comingSoon: course.comingSoon,
    })
    assertUnitOpen(structure, statuses, unitId)
    let pointsAwarded = 0
    let certificate: Certificate | null = null
    if (!state.completedUnits.has(unitId)) {
      const check = await unitCompletion(viewer.id, unitId, structure, state, tx)
      if (!check.canComplete)
        throw locked(
          check.reason === 'assessment_required'
            ? 'Pass the assessment to complete this unit'
            : 'Complete the required blocks first',
        )
      const inserted = await tx
        .insert(unitProgress)
        .values({ userId: viewer.id, courseId: course.id, unitId, completedAt: now() })
        .onConflictDoNothing()
        .returning({ id: unitProgress.id })
      if (inserted.length) {
        pointsAwarded += await awardUnitPoints(tx, viewer.id, course, unit)
        state = await learnerState(viewer.id, course.id, structure, tx)
        const moduleUnits = structure.units.filter((u) => u.moduleId === unit.moduleId)
        if (moduleUnits.every((u) => state.completedUnits.has(u.id)))
          pointsAwarded += await awardPoints(tx, {
            userId: viewer.id,
            courseId: course.id,
            sourceType: 'module',
            sourceId: unit.moduleId,
            points: course.pointsConfig.module,
            reason: {
              en: `Module completed in ${course.title.en}`,
              ar: `إكمال وحدة في ${course.title.ar}`,
            },
          })
      }
    }
    await recalcEnrolment(tx, viewer.id, course.id, { activity: true })
    // External-certificate courses (Nibras) complete only when an admin approves the upload
    // (contract §0 Completion, §9.1) — never by finishing units.
    if (!course.externalCertificate && courseCompletable(structure, state)) {
      const done = await completeCourseInTx(tx, { userId: viewer.id, courseId: course.id })
      pointsAwarded += done.pointsAwarded
      certificate = done.certificate
    } else {
      await evaluateBadges(tx, viewer.id)
    }
    const [e] = await tx
      .select()
      .from(enrolments)
      .where(and(eq(enrolments.userId, viewer.id), eq(enrolments.courseId, course.id)))
    return {
      unitStatus: 'completed' as const,
      courseProgressPct: Math.round(e?.progressPct ?? 0),
      nextUnitId: e?.nextUnitId ?? null,
      pointsAwarded,
      certificate,
    }
  })
  return {
    unitStatus: result.unitStatus,
    courseProgressPct: result.courseProgressPct,
    ...(result.nextUnitId ? { nextUnitId: result.nextUnitId } : {}),
    pointsAwarded: result.pointsAwarded,
    ...(result.certificate
      ? { certificate: await certificateRef(result.certificate, viewer.id) }
      : {}),
  }
}

function awardUnitPoints(
  tx: DbOrTx,
  userId: string,
  course: Course,
  unit: { id: string; title: { en: string; ar: string } },
) {
  return awardPoints(tx, {
    userId,
    courseId: course.id,
    sourceType: 'unit',
    sourceId: unit.id,
    points: course.pointsConfig.unit,
    reason: { en: `Completed unit ${unit.title.en}`, ar: `أكمل ${unit.title.ar}` },
  })
}
