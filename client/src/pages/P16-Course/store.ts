// client: hand-built page (P16 learner course player). In-memory stand-in for the learner API.
//
// One store per course lives at module level, so progress survives the page remounting on navigation.
// Every method matches an endpoint in API-CONTRACT "P16 Course & unit player" / "Assessments"; the merge
// replaces this file with fetch calls. Scoring, unlocking and points happen here because the server does
// them: the views never see answer keys.
import { useMemo, useSyncExternalStore } from 'react'
import { type CourseData, courseData, courseKeyForSlug, scoreAttempt } from './mock'
import {
  attemptsLeft,
  attemptsOf,
  courseComplete,
  emptyProgress,
  modulesDone,
  type Progress,
} from './nav'
import type { AnswerInput, AttemptRecord, AttemptResult, SurveyAnswer } from './types'

/** Where the demo learner is when the page opens. `fresh` is the default: pre-test not taken yet. */
export type Preset = 'fresh' | 'final' | 'failed' | 'passed' | 'complete' | `u${number}`

export interface Effects {
  points: number
  unitCompleted: boolean
  courseCompleted: boolean
}

export interface Store {
  data: CourseData
  p: Progress
  /** what the store was last seeded from, to tell an explicit ?state= from a deep link */
  seededFrom: string
  listeners: Set<() => void>
}

const stores = new Map<string, Store>()
const NO_FX: Effects = { points: 0, unitCompleted: false, courseCompleted: false }

const now = () => new Date().toISOString()

function attempt(data: CourseData, id: string, n: number, scorePct: number): AttemptRecord {
  const a = data.assessments[id]
  const passed = a?.type === 'survey' || scorePct >= (a?.passMark ?? 0)
  const result: AttemptResult = {
    attemptId: `seed-${id}-${n}`,
    scorePct,
    passed,
    showAnswers: false,
  }
  return { n, scorePct, passed, at: now(), answers: [], result }
}

function finishUnit(data: CourseData, p: Progress, unitId: string) {
  p.unitsDone[unitId] = true
  p.points += data.points.unit
}

function finishCourse(data: CourseData, p: Progress) {
  p.completedAt = now()
  p.points += data.points.course
}

/** Applies a preset to an empty progress. */
function seed(data: CourseData, preset: Preset): Progress {
  const p = emptyProgress()
  const nU = data.unitOrder.length
  const pre = data.preId
  const post = data.postId
  const doUnits = (n: number) => {
    data.unitOrder.slice(0, n).forEach((id) => {
      for (const b of data.units[id]?.blocks ?? []) p.blocksDone[b.id] = true
      finishUnit(data, p, id)
      if (data.unitAssessment[id])
        p.attempts[data.unitAssessment[id] as string] = [
          attempt(data, data.unitAssessment[id] as string, 1, 100),
        ]
    })
  }
  if (preset === 'fresh') return p
  if (pre) p.attempts[pre] = [attempt(data, pre, 1, 67)]
  const m = preset.match(/^u(\d+)$/)
  if (m) {
    // deep link to unit N (and block M): everything before it is done
    doUnits(Math.min(Math.max(Number(m[1]) - 1, 0), nU))
    return p
  }
  doUnits(nU)
  if (preset === 'final') return p
  if (preset === 'failed') {
    if (post) p.attempts[post] = [attempt(data, post, 1, 60)]
    return p
  }
  if (post) {
    p.attempts[post] = [attempt(data, post, 1, 80)]
    p.points += data.points.assessmentPass
  }
  finishCourse(data, p)
  return p
}

/** Opens the store for a course. An explicit preset reseeds it; otherwise a store that exists is kept. */
export function openStore(
  slug: string,
  preset: Preset | undefined,
  implied: Preset,
  unitBlocks?: { unit: number; block: number },
): Store {
  const key = courseKeyForSlug(slug)
  let s = stores.get(key)
  const want = preset ?? implied
  if (!s || (preset && s.seededFrom !== `state:${preset}`)) {
    const data = courseData(key)
    const p = seed(data, want)
    // /u3/b2: also mark the blocks before b2 done so the block is reachable
    if (unitBlocks && !preset) {
      const u = data.units[data.unitOrder[unitBlocks.unit] as string]
      u?.blocks.slice(0, unitBlocks.block).forEach((b) => {
        p.blocksDone[b.id] = true
      })
    }
    s = {
      data,
      p,
      seededFrom: preset ? `state:${preset}` : `url:${implied}`,
      listeners: s?.listeners ?? new Set(),
    }
    stores.set(key, s)
    s.listeners.forEach((l) => l())
  }
  return s
}

/* ------------------------------------------------------------------ subscription */

function commit(s: Store, mutate: (p: Progress) => void) {
  const next: Progress = {
    ...s.p,
    blocksDone: { ...s.p.blocksDone },
    unitsDone: { ...s.p.unitsDone },
    attempts: { ...s.p.attempts },
    plan: { ...s.p.plan },
    surveys: { ...s.p.surveys },
    scorm: { ...s.p.scorm },
    media: { ...s.p.media },
    touched: true,
  }
  mutate(next)
  s.p = next
  s.listeners.forEach((l) => l())
}

export interface Api {
  /** POST /units/{unitId}/blocks/{blockId}/progress, then POST /units/{unitId}/complete when it was the last */
  completeBlock(unitId: string, blockId: string): Effects
  setMedia(blockId: string, pct: number): void
  /** PUT /units/{unitId}/blocks/{blockId}/action-plan */
  saveActionPlan(blockId: string, no: number, text: string): void
  /** PUT /units/{unitId}/blocks/{blockId}/survey (completes the block) */
  saveSurvey(unitId: string, blockId: string, answers: SurveyAnswer[]): Effects
  /** PUT /units/{unitId}/blocks/{blockId}/scorm (completes the block when finished) */
  putScorm(unitId: string, blockId: string, step: number): Effects
  /** POST /assessments/{id}/attempts */
  submitAttempt(id: string, answers: AnswerInput[]): { result: AttemptResult; effects: Effects }
}

function api(s: Store): Api {
  const completeBlock = (unitId: string, blockId: string): Effects => {
    const u = s.data.units[unitId]
    if (!u || s.p.blocksDone[blockId]) return NO_FX
    const fx: Effects = { points: 0, unitCompleted: false, courseCompleted: false }
    commit(s, (p) => {
      p.blocksDone[blockId] = true
      if (u.blocks.every((b) => p.blocksDone[b.id]) && !p.unitsDone[unitId]) {
        finishUnit(s.data, p, unitId)
        fx.unitCompleted = true
        fx.points += s.data.points.unit
        if (!s.data.postId && s.data.unitOrder.every((id) => p.unitsDone[id])) {
          finishCourse(s.data, p)
          fx.courseCompleted = true
          fx.points += s.data.points.course
        }
      }
    })
    return fx
  }
  return {
    completeBlock,
    setMedia(blockId, pct) {
      if ((s.p.media[blockId] ?? 0) >= pct) return
      commit(s, (p) => {
        p.media[blockId] = pct
      })
    },
    saveActionPlan(blockId, no, text) {
      commit(s, (p) => {
        p.plan[blockId] = { ...(p.plan[blockId] ?? {}), [no]: text }
      })
    },
    saveSurvey(unitId, blockId, answers) {
      commit(s, (p) => {
        p.surveys[blockId] = answers
      })
      return completeBlock(unitId, blockId)
    },
    putScorm(unitId, blockId, step) {
      commit(s, (p) => {
        p.scorm[blockId] = step
      })
      return step >= 4 ? completeBlock(unitId, blockId) : NO_FX
    },
    submitAttempt(id, answers) {
      const a = s.data.assessments[id]
      const keys = s.data.keys[id] ?? {}
      const used = attemptsOf(s.p, id).length
      const left = attemptsLeft(s.data, s.p, id)
      if (!a || left === 0) {
        throw new Error('locked')
      }
      const graded = a.type === 'survey' ? null : scoreAttempt(keys, answers)
      const scorePct = graded?.scorePct ?? 100
      const passed = a.type === 'survey' ? true : scorePct >= a.passMark
      const exhausted = a.attemptsAllowed > 0 && used + 1 >= a.attemptsAllowed
      const reveal = !!graded && a.showAnswers && (passed || exhausted)
      const result: AttemptResult = {
        attemptId: `a${used + 1}-${id}`,
        scorePct,
        passed,
        showAnswers: a.showAnswers,
        ...(reveal && graded ? { correct: graded.correct, right: graded.right } : {}),
      }
      const rec: AttemptRecord = { n: used + 1, scorePct, passed, at: now(), answers, result }
      const fx: Effects = { points: 0, unitCompleted: false, courseCompleted: false }
      commit(s, (p) => {
        p.attempts[id] = [...(p.attempts[id] ?? []), rec]
      })
      if (passed && a.kind === 'unit') {
        const unitId = Object.keys(s.data.unitAssessment).find(
          (u) => s.data.unitAssessment[u] === id,
        )
        const block = unitId
          ? s.data.units[unitId]?.blocks.find((b) => b.type === 'quiz_blocking')
          : undefined
        if (unitId && block) Object.assign(fx, completeBlock(unitId, block.id))
      }
      if (passed && a.kind === 'post' && !courseComplete(s.p) && modulesDone(s.data, s.p)) {
        commit(s, (p) => {
          p.points += s.data.points.assessmentPass
          finishCourse(s.data, p)
        })
        fx.courseCompleted = true
        fx.points += s.data.points.assessmentPass + s.data.points.course
      }
      return { result, effects: fx }
    },
  }
}

/** The store's progress and its API. Re-renders on every change. */
export function useLearner(s: Store): { data: CourseData; p: Progress; api: Api } {
  const p = useSyncExternalStore(
    (cb) => {
      s.listeners.add(cb)
      return () => void s.listeners.delete(cb)
    },
    () => s.p,
    () => s.p,
  )
  const a = useMemo(() => api(s), [s])
  return { data: s.data, p, api: a }
}
