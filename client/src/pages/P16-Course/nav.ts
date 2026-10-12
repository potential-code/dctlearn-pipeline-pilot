// client: hand-built page (P16 learner course player). Pure rules: what is locked, what is next, where a URL points.
import type { CourseData } from './mock'
import type { AssessmentStatus, AttemptRecord, BlockView, SurveyAnswer, UnitView } from './types'

/** What the learner has done so far. The mock store keeps it in memory; the server owns it later. */
export interface Progress {
  blocksDone: Record<string, true>
  unitsDone: Record<string, true>
  attempts: Record<string, AttemptRecord[]>
  /** action plan answers by block id, then question number */
  plan: Record<string, Record<number, string>>
  surveys: Record<string, SurveyAnswer[]>
  /** simulated SCORM module step (0 = not launched, 4 = finished) by block id */
  scorm: Record<string, number>
  /** video / audio position in percent by block id */
  media: Record<string, number>
  points: number
  completedAt: string | null
  /** true once the learner has changed anything since the page loaded */
  touched: boolean
}

export const emptyProgress = (): Progress => ({
  blocksDone: {},
  unitsDone: {},
  attempts: {},
  plan: {},
  surveys: {},
  scorm: {},
  media: {},
  points: 0,
  completedAt: null,
  touched: false,
})

/* ------------------------------------------------------------------ targets */

export type Target =
  | { kind: 'pre' }
  | { kind: 'post' }
  | { kind: 'complete' }
  | { kind: 'block'; unit: number; block: number }

export const same = (a: Target, b: Target): boolean =>
  a.kind === b.kind &&
  (a.kind !== 'block' || (b.kind === 'block' && a.unit === b.unit && a.block === b.block))

/** The URL tail after /{p}/learn/{course}/ */
export function targetPath(t: Target): string {
  if (t.kind === 'pre') return 'pre-test'
  if (t.kind === 'post') return 'final-check'
  if (t.kind === 'complete') return 'complete'
  return `u${t.unit + 1}/b${t.block + 1}`
}

export const targetHref = (site: string, slug: string, t: Target): string =>
  `/${site}/learn/${slug}/${targetPath(t)}`

export const courseHref = (site: string, slug: string): string => `/${site}/learn/${slug}`

export type Parsed = { target: Target } | { unit: number } | null

/**
 * /pre-test, /final-check, /complete, /u2 (the unit: its first unfinished block) and /u2/b3 (one block).
 * Anything else is not a place in this course.
 */
export function parseUrl(data: CourseData, unit?: string, block?: string): Parsed {
  if (!unit) return null
  if (unit === 'pre-test') return data.preId ? { target: { kind: 'pre' } } : null
  if (unit === 'final-check') return data.postId ? { target: { kind: 'post' } } : null
  if (unit === 'complete') return { target: { kind: 'complete' } }
  const u = unit.match(/^u(\d+)$/)
  if (!u) return null
  const ui = Number(u[1]) - 1
  const uv = unitAt(data, ui)
  if (!uv) return null
  if (!block) return { unit: ui }
  const b = block.match(/^b(\d+)$/)
  if (!b) return null
  const bi = Number(b[1]) - 1
  return uv.blocks[bi] ? { target: { kind: 'block', unit: ui, block: bi } } : null
}

/* ------------------------------------------------------------------ lookups */

export const unitAt = (data: CourseData, ui: number): UnitView | undefined => {
  const id = data.unitOrder[ui]
  return id ? data.units[id] : undefined
}

export const blockAt = (data: CourseData, ui: number, bi: number): BlockView | undefined =>
  unitAt(data, ui)?.blocks[bi]

export const attemptsOf = (p: Progress, id: string | undefined): AttemptRecord[] =>
  (id ? p.attempts[id] : undefined) ?? []

export const totalBlocks = (data: CourseData): number =>
  data.unitOrder.reduce((n, id) => n + (data.units[id]?.blocks.length ?? 0), 0)

/* ------------------------------------------------------------------ state of each part */

export const preDone = (data: CourseData, p: Progress): boolean =>
  !data.preId || attemptsOf(p, data.preId).length > 0

export const unitDone = (p: Progress, unitId: string): boolean => !!p.unitsDone[unitId]

export function unitLocked(data: CourseData, p: Progress, ui: number): boolean {
  if (!preDone(data, p)) return true
  const prev = data.unitOrder[ui - 1]
  return ui > 0 && !!prev && !p.unitsDone[prev]
}

export function blockLocked(data: CourseData, p: Progress, ui: number, bi: number): boolean {
  if (unitLocked(data, p, ui)) return true
  const u = unitAt(data, ui)
  return !!u && u.blocks.slice(0, bi).some((b) => !p.blocksDone[b.id])
}

export const modulesDone = (data: CourseData, p: Progress): boolean =>
  data.unitOrder.every((id) => p.unitsDone[id])

export function assessmentStatus(
  data: CourseData,
  p: Progress,
  id: string | undefined,
): AssessmentStatus | undefined {
  if (!id) return undefined
  const a = data.assessments[id]
  if (!a) return undefined
  const list = attemptsOf(p, id)
  if (list.some((x) => x.passed)) return 'passed'
  if (a.kind === 'post' && !modulesDone(data, p)) return 'locked'
  return list.length ? 'failed' : 'available'
}

/** Attempts left, or null for unlimited (attemptsAllowed 0). */
export function attemptsLeft(data: CourseData, p: Progress, id: string): number | null {
  const a = data.assessments[id]
  if (!a || a.attemptsAllowed <= 0) return null
  return Math.max(0, a.attemptsAllowed - attemptsOf(p, id).length)
}

export const bestScore = (p: Progress, id: string): number | null => {
  const list = attemptsOf(p, id)
  return list.length ? Math.max(...list.map((x) => x.scorePct)) : null
}

export const courseComplete = (p: Progress): boolean => p.completedAt !== null

export function courseProgress(data: CourseData, p: Progress): number {
  const blocks = totalBlocks(data)
  const post = data.postId ? 1 : 0
  const all = blocks + post
  if (!all) return 0
  const done =
    Object.keys(p.blocksDone).length +
    (post && assessmentStatus(data, p, data.postId) === 'passed' ? 1 : 0)
  return Math.round((done / all) * 100)
}

export function moduleProgress(data: CourseData, p: Progress, moduleIdx: number): number {
  const m = data.modules[moduleIdx]
  if (!m) return 0
  const blocks = m.unitIds.flatMap((id) => data.units[id]?.blocks ?? [])
  if (!blocks.length) return 0
  return Math.round((blocks.filter((b) => p.blocksDone[b.id]).length / blocks.length) * 100)
}

/* ------------------------------------------------------------------ order and locking of targets */

/** Pre-test, every block in order, post-test, and the finish screen once the course is complete. */
export function steps(data: CourseData, p: Progress): Target[] {
  const out: Target[] = []
  if (data.preId) out.push({ kind: 'pre' })
  data.unitOrder.forEach((id, ui) => {
    for (let bi = 0; bi < (data.units[id]?.blocks.length ?? 0); bi++) {
      out.push({ kind: 'block', unit: ui, block: bi })
    }
  })
  if (data.postId) out.push({ kind: 'post' })
  if (courseComplete(p)) out.push({ kind: 'complete' })
  return out
}

export type LockReason = 'pre' | 'unit' | 'block' | 'modules' | 'complete'

export function lockReason(data: CourseData, p: Progress, t: Target): LockReason | null {
  if (t.kind === 'pre') return null
  if (t.kind === 'complete') return courseComplete(p) ? null : 'complete'
  if (t.kind === 'post') return modulesDone(data, p) ? null : 'modules'
  if (!preDone(data, p)) return 'pre'
  if (unitLocked(data, p, t.unit)) return 'unit'
  return blockLocked(data, p, t.unit, t.block) ? 'block' : null
}

/** Where "Continue" goes: the pre-test if pending, then the first unfinished block, then the post-test. */
export function defaultTarget(data: CourseData, p: Progress): Target {
  if (courseComplete(p)) return { kind: 'complete' }
  if (!preDone(data, p)) return { kind: 'pre' }
  for (let ui = 0; ui < data.unitOrder.length; ui++) {
    const u = unitAt(data, ui)
    if (!u) continue
    const bi = u.blocks.findIndex((b) => !p.blocksDone[b.id])
    if (bi >= 0) return { kind: 'block', unit: ui, block: bi }
  }
  if (data.postId) return { kind: 'post' }
  return { kind: 'complete' }
}

/** First unfinished block of a unit, or its first block when all are done. */
export function unitTarget(data: CourseData, p: Progress, ui: number): Target {
  const u = unitAt(data, ui)
  const bi = u ? u.blocks.findIndex((b) => !p.blocksDone[b.id]) : -1
  return { kind: 'block', unit: ui, block: Math.max(0, bi) }
}

export function neighbours(
  data: CourseData,
  p: Progress,
  t: Target,
): { prev: Target | null; next: Target | null } {
  const all = steps(data, p)
  const at = all.findIndex((s) => same(s, t))
  if (at < 0) return { prev: null, next: null }
  return { prev: all[at - 1] ?? null, next: all[at + 1] ?? null }
}
