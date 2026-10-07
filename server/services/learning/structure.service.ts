import { type DbOrTx, db } from '@server/db/connection'
import {
  assessmentAttempts,
  blockProgress,
  type CourseAssessment,
  type CourseModule,
  type CourseUnit,
  courseAssessments,
  courseBlocks,
  courseModules,
  courseUnits,
  unitProgress,
} from '@server/db/schema/learning'
import { and, asc, eq, inArray, isNull } from 'drizzle-orm'

/**
 * Live course structure (soft-deleted rows ignored, §9.5) and a learner's state in it.
 * Pure helpers (`unitStatuses`, `canCompleteUnit`, `courseCompletable`) hold the rules.
 */

export type Structure = {
  modules: CourseModule[]
  /** Flat, in learning order (module order, then unit order). */
  units: CourseUnit[]
  assessments: CourseAssessment[]
}

const byOrder = <T extends { order: number; createdAt: Date }>(a: T, b: T) =>
  a.order - b.order || a.createdAt.getTime() - b.createdAt.getTime()

export async function loadStructure(courseId: string, tx: DbOrTx = db): Promise<Structure> {
  const modules = (
    await tx
      .select()
      .from(courseModules)
      .where(and(eq(courseModules.courseId, courseId), isNull(courseModules.deletedAt)))
  ).sort(byOrder)
  const liveModules = new Map(modules.map((m, i) => [m.id, i]))
  const units = (
    await tx
      .select()
      .from(courseUnits)
      .where(and(eq(courseUnits.courseId, courseId), isNull(courseUnits.deletedAt)))
  )
    .filter((u) => liveModules.has(u.moduleId))
    .sort((a, b) => liveModules.get(a.moduleId)! - liveModules.get(b.moduleId)! || byOrder(a, b))
  const liveUnits = new Set(units.map((u) => u.id))
  const assessments = (
    await tx
      .select()
      .from(courseAssessments)
      .where(and(eq(courseAssessments.courseId, courseId), isNull(courseAssessments.deletedAt)))
      .orderBy(asc(courseAssessments.createdAt))
  ).filter((a) => !a.unitId || liveUnits.has(a.unitId))
  return { modules, units, assessments }
}

export async function liveBlocks(unitId: string, tx: DbOrTx = db) {
  return tx
    .select()
    .from(courseBlocks)
    .where(and(eq(courseBlocks.unitId, unitId), isNull(courseBlocks.deletedAt)))
    .orderBy(asc(courseBlocks.order), asc(courseBlocks.createdAt))
}

export type AttemptSummary = { used: number; passed: boolean; lastPassed: boolean | null }

export type LearnerState = {
  completedUnits: Set<string>
  attempts: Map<string, AttemptSummary>
}

export async function learnerState(
  userId: string,
  courseId: string,
  structure: Structure,
  tx: DbOrTx = db,
): Promise<LearnerState> {
  const done = await tx
    .select({ unitId: unitProgress.unitId })
    .from(unitProgress)
    .where(and(eq(unitProgress.userId, userId), eq(unitProgress.courseId, courseId)))
  const live = new Set(structure.units.map((u) => u.id))
  const attempts = new Map<string, AttemptSummary>()
  const ids = structure.assessments.map((a) => a.id)
  if (ids.length) {
    const rows = await tx
      .select({
        assessmentId: assessmentAttempts.assessmentId,
        passed: assessmentAttempts.passed,
        createdAt: assessmentAttempts.createdAt,
      })
      .from(assessmentAttempts)
      .where(
        and(eq(assessmentAttempts.userId, userId), inArray(assessmentAttempts.assessmentId, ids)),
      )
      .orderBy(asc(assessmentAttempts.createdAt))
    for (const r of rows) {
      const s = attempts.get(r.assessmentId) ?? { used: 0, passed: false, lastPassed: null }
      s.used += 1
      s.passed ||= r.passed
      s.lastPassed = r.passed
      attempts.set(r.assessmentId, s)
    }
  }
  return {
    completedUnits: new Set(done.map((d) => d.unitId).filter((id) => live.has(id))),
    attempts,
  }
}

export type UnitStatus = 'locked' | 'available' | 'completed'

/** Sequential courses unlock a unit when every earlier unit is complete. */
export function unitStatuses(
  structure: Structure,
  state: LearnerState,
  opts: { sequential: boolean; comingSoon: boolean },
) {
  const out = new Map<string, UnitStatus>()
  let earlierDone = true
  for (const u of structure.units) {
    const done = state.completedUnits.has(u.id)
    if (opts.comingSoon) out.set(u.id, 'locked')
    else if (done) out.set(u.id, 'completed')
    else out.set(u.id, !opts.sequential || earlierDone ? 'available' : 'locked')
    earlierDone &&= done
  }
  return out
}

export function blockingAssessment(structure: Structure, unitId: string) {
  return structure.assessments.find((a) => a.unitId === unitId && a.type === 'quiz_blocking')
}

/** Final assessment that is not attached to a unit and must be passed to complete the course. */
export function courseLevelFinal(structure: Structure) {
  return structure.assessments.find((a) => a.isFinal && !a.unitId && a.type === 'quiz_blocking')
}

export function finalAssessment(structure: Structure) {
  return structure.assessments.find((a) => a.isFinal)
}

/** All live units complete and any course-level blocking final passed. */
export function courseCompletable(structure: Structure, state: LearnerState) {
  if (structure.units.length === 0) return false
  if (!structure.units.every((u) => state.completedUnits.has(u.id))) return false
  const final = courseLevelFinal(structure)
  return !final || Boolean(state.attempts.get(final.id)?.passed)
}

export function progressPct(structure: Structure, state: LearnerState) {
  const total = structure.units.length
  if (total === 0) return 0
  const done = structure.units.filter((u) => state.completedUnits.has(u.id)).length
  const pct = Math.round((done / total) * 1000) / 10
  return pct === 100 && !courseCompletable(structure, state) ? 99 : pct
}

export function nextIncompleteUnit(structure: Structure, state: LearnerState) {
  return structure.units.find((u) => !state.completedUnits.has(u.id)) ?? null
}

/** Block completion of one learner for a set of blocks. */
export async function blockStates(userId: string, blockIds: string[], tx: DbOrTx = db) {
  if (blockIds.length === 0) return new Map<string, typeof blockProgress.$inferSelect>()
  const rows = await tx
    .select()
    .from(blockProgress)
    .where(and(eq(blockProgress.userId, userId), inArray(blockProgress.blockId, blockIds)))
  return new Map(rows.map((r) => [r.blockId, r]))
}
