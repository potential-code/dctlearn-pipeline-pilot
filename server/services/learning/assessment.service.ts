import { db } from '@server/db/connection'
import {
  type AssessmentQuestion,
  assessmentAttempts,
  assessmentQuestions,
  type CourseAssessment,
} from '@server/db/schema/learning'
import { locked, validationFailed } from '@server/lib/errors'
import { evaluateBadges } from '@server/services/achievements/badges.service'
import { awardPoints } from '@server/services/catalog/points.service'
import type { AttemptInput } from '@shared/schemas/learning'
import { and, asc, eq } from 'drizzle-orm'
import type { z } from 'zod'
import { loadAssessmentFor } from './access.service'
import { completeCourseInTx, lockEnrolment, recalcEnrolment } from './progress.service'
import { courseCompletable, learnerState, loadStructure, unitStatuses } from './structure.service'

/**
 * Assessments (inside P16): questions without answer keys; attempts scored on the server only;
 * keys revealed only after a pass or when attempts are used up. Attempts count across versions
 * (§9.5 versions keep past scores; they do not reset the allowance).
 */

type Answer = z.infer<typeof AttemptInput>['answers'][number]

export async function currentQuestions(a: CourseAssessment) {
  return db
    .select()
    .from(assessmentQuestions)
    .where(
      and(eq(assessmentQuestions.assessmentId, a.id), eq(assessmentQuestions.version, a.version)),
    )
    .orderBy(asc(assessmentQuestions.order), asc(assessmentQuestions.createdAt))
}

function shuffled<T>(items: T[]) {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

async function assertOpen(
  viewer: Viewer,
  a: CourseAssessment,
  course: { id: string; sequential: boolean; comingSoon: boolean },
) {
  if (!a.unitId) return
  const structure = await loadStructure(course.id)
  const state = await learnerState(viewer.id, course.id, structure)
  const status = unitStatuses(structure, state, course).get(a.unitId)
  if (status === 'locked')
    throw locked('This assessment is locked — complete the earlier units first')
}

export async function getAssessment(viewer: Viewer, id: string) {
  const { assessment: a, course } = await loadAssessmentFor(viewer, id)
  await assertOpen(viewer, a, course)
  const questions = await currentQuestions(a)
  const used = await db
    .select({ id: assessmentAttempts.id })
    .from(assessmentAttempts)
    .where(and(eq(assessmentAttempts.assessmentId, a.id), eq(assessmentAttempts.userId, viewer.id)))
  return {
    id: a.id,
    title: a.title,
    type: a.type as 'survey' | 'quiz_blocking' | 'quiz_non_blocking',
    passMark: a.passMark,
    attemptsAllowed: a.attemptsAllowed,
    attemptsUsed: used.length,
    ...(a.timeLimitMin != null ? { timeLimitMin: a.timeLimitMin } : {}),
    questions: (a.shuffle ? shuffled(questions) : questions).map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type as 'multiple_choice' | 'true_false' | 'open_text' | 'sorting',
      ...(q.type !== 'open_text'
        ? {
            options: (q.type === 'sorting' ? shuffled(q.options) : q.options).map((o) => ({
              id: o.id,
              text: o.text,
            })),
          }
        : {}),
    })),
  }
}

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && new Set(a).size === new Set([...a, ...b]).size

const norm = (s: string) => s.trim().toLowerCase()

export function scoreQuestion(q: AssessmentQuestion, answer: Answer | undefined) {
  const correctIds = q.options.filter((o) => o.correct).map((o) => o.id)
  switch (q.type) {
    case 'multiple_choice':
    case 'true_false':
      return sameSet(answer?.optionIds ?? [], correctIds)
    case 'sorting': {
      const order = answer?.order ?? []
      return order.length === q.options.length && order.every((id, i) => q.options[i]?.id === id)
    }
    case 'open_text': {
      const text = norm(answer?.text ?? '')
      if (!text) return false
      const keys = q.options.filter((o) => o.correct)
      return (
        keys.length === 0 || keys.some((o) => norm(o.text.en) === text || norm(o.text.ar) === text)
      )
    }
    default:
      return false
  }
}

function answerKey(q: AssessmentQuestion): string[] | string | undefined {
  if (q.type === 'sorting') return q.options.map((o) => o.id)
  if (q.type === 'open_text') return q.options.find((o) => o.correct)?.text.en
  return q.options.filter((o) => o.correct).map((o) => o.id)
}

/** POST /api/assessments/{id}/attempts */
export async function submitAttempt(
  viewer: Viewer,
  id: string,
  input: z.infer<typeof AttemptInput>,
) {
  const { assessment: a, course } = await loadAssessmentFor(viewer, id)
  await assertOpen(viewer, a, course)
  return db.transaction(async (tx) => {
    // Serialises attempts of one learner in one course (attempt limit under double submit).
    await lockEnrolment(tx, viewer.id, course.id)
    const past = await tx
      .select({ passed: assessmentAttempts.passed })
      .from(assessmentAttempts)
      .where(
        and(eq(assessmentAttempts.assessmentId, a.id), eq(assessmentAttempts.userId, viewer.id)),
      )
    if (past.some((p) => p.passed)) throw locked('You have already passed this assessment')
    if (a.attemptsAllowed > 0 && past.length >= a.attemptsAllowed) throw locked('No attempts left')

    const questions = await currentQuestions(a)
    const byId = new Map(questions.map((q) => [q.id, q]))
    const fields: Record<string, string> = {}
    input.answers.forEach((ans, i) => {
      if (!byId.has(ans.questionId)) fields[`answers.${i}.questionId`] = 'No such question'
    })
    if (Object.keys(fields).length) throw validationFailed(fields)
    const answers = new Map(input.answers.map((x) => [x.questionId, x]))

    let scorePct = 100
    if (a.type !== 'survey') {
      const total = questions.reduce((s, q) => s + q.points, 0)
      const earned = questions.reduce(
        (s, q) => s + (scoreQuestion(q, answers.get(q.id)) ? q.points : 0),
        0,
      )
      scorePct = total === 0 ? 100 : Math.round((earned / total) * 1000) / 10
    }
    const passed = scorePct >= a.passMark
    const [attempt] = await tx
      .insert(assessmentAttempts)
      .values({
        assessmentId: a.id,
        version: a.version,
        userId: viewer.id,
        answers: input.answers,
        scorePct,
        passed,
      })
      .returning({ id: assessmentAttempts.id })

    if (passed && a.type !== 'survey')
      await awardPoints(tx, {
        userId: viewer.id,
        courseId: course.id,
        sourceType: 'assessment',
        sourceId: a.id,
        points: course.pointsConfig.assessmentPass,
        reason: { en: `Passed ${a.title.en}`, ar: `اجتاز ${a.title.ar}` },
      })
    await recalcEnrolment(tx, viewer.id, course.id, { activity: true })
    if (passed && a.isFinal && !a.unitId) {
      const structure = await loadStructure(course.id, tx)
      const state = await learnerState(viewer.id, course.id, structure, tx)
      if (courseCompletable(structure, state))
        await completeCourseInTx(tx, { userId: viewer.id, courseId: course.id })
    }
    await evaluateBadges(tx, viewer.id)

    const usedUp = a.attemptsAllowed > 0 && past.length + 1 >= a.attemptsAllowed
    const showAnswers = a.type !== 'survey' && (passed || usedUp)
    const correct: Record<string, string[] | string> = {}
    if (showAnswers)
      for (const q of questions) {
        const key = answerKey(q)
        if (key !== undefined) correct[q.id] = key
      }
    return {
      attemptId: attempt!.id,
      scorePct,
      passed,
      showAnswers,
      ...(showAnswers ? { correct } : {}),
    }
  })
}
