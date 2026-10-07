import { buildApp } from '@server/app'
import { db } from '@server/db/connection'
import { enrolments } from '@server/db/schema/catalog'
import { invitations } from '@server/db/schema/identity'
import { DANIEL_EMAIL, seedCompetition } from '@server/db/seed/slices/competition.seed'
import { competitionRouter } from '@server/routes/competition.routes'
import { competitionAdminRouter } from '@server/routes/competition-admin.routes'
import { judgeRouter } from '@server/routes/judge.routes'
import { type ActionPlanReader, setActionPlanReader } from '@server/services/seams/action-plan.seam'
import { hashToken } from '@server/utils/tokens'
import { and, eq, sql } from 'drizzle-orm'
import '@server/registrations/competition'
import '@server/jobs/competition.job'
import { freshBase } from '../helpers/fixtures'
import { anon, PASSWORD } from '../helpers/http'

export const app = buildApp([competitionRouter, judgeRouter, competitionAdminRouter])

export const PITCH_BLOCK_ID = '11111111-1111-4111-8111-111111111111'
export const PITCH_QUESTIONS = [
  { no: 1, text: { en: 'Name and tagline', ar: 'الاسم والشعار' } },
  { no: 2, text: { en: 'Short description', ar: 'وصف مختصر' } },
  { no: 3, text: { en: 'Why will it grab attention?', ar: 'لماذا سيجذب الانتباه؟' } },
]

/**
 * In-memory ActionPlanReader (the learning area implements the real one). One pitch block for
 * the configured course; answers and unit progress per learner; `lock` records the lock.
 */
export function installFakeReader(pitchCourseId: string) {
  const answers = new Map<
    string,
    { answers: Record<string, string>; updatedAt: Date | null; lockedAt: Date | null }
  >()
  const units = new Map<string, { completed: number; total: number }>()
  const locks: string[] = []
  const key = (a: string, b: string) => `${a}:${b}`
  const reader: ActionPlanReader = {
    findPitchBlock: async (courseId) =>
      courseId === pitchCourseId ? { blockId: PITCH_BLOCK_ID, questions: PITCH_QUESTIONS } : null,
    getAnswers: async (userId, blockId) =>
      answers.get(key(userId, blockId)) ?? { answers: {}, updatedAt: null, lockedAt: null },
    lock: async (userId, blockId) => {
      const k = key(userId, blockId)
      const cur = answers.get(k) ?? { answers: {}, updatedAt: null, lockedAt: null }
      answers.set(k, { ...cur, lockedAt: cur.lockedAt ?? new Date() })
      locks.push(k)
    },
    pdfUrl: async (userId, blockId) =>
      `https://files.example/action-plans/${userId}/${blockId}.pdf`,
    unitProgress: async (userId, courseId) =>
      units.get(key(userId, courseId)) ?? { completed: 0, total: 4 },
  }
  setActionPlanReader(reader)
  return {
    reader,
    locks,
    setAnswers(userId: string, values: Record<string, string>, lockedAt: Date | null = null) {
      answers.set(key(userId, PITCH_BLOCK_ID), { answers: values, updatedAt: new Date(), lockedAt })
    },
    isLocked: (userId: string) => Boolean(answers.get(key(userId, PITCH_BLOCK_ID))?.lockedAt),
    setUnits(userId: string, courseId: string, completed: number, total = 4) {
      units.set(key(userId, courseId), { completed, total })
    },
  }
}

/**
 * Workaround: `courses_title_search_idx` (catalog.ts) has an operator-precedence bug
 * (`title->>'en' || ' ' || title->>'ar'` parses as `(… || title)->>'ar'`), so drizzle-kit push
 * stops there without failing and the indexes after it are never created. Competition relies on
 * its unique indexes (upserts, one open round), so the tests create them if missing.
 */
let indexesEnsured = false
async function ensureCompetitionIndexes() {
  if (indexesEnsured) return
  for (const ddl of [
    `create unique index if not exists competition_rounds_one_open_uq on competition_rounds (microsite_id) where status = 'open'`,
    'create unique index if not exists competition_judges_microsite_email_uq on competition_judges (microsite_id, email)',
    'create unique index if not exists competition_submissions_round_user_uq on competition_submissions (round_id, user_id)',
    'create unique index if not exists competition_assignments_uq on competition_assignments (submission_id, judge_id)',
    'create unique index if not exists competition_scores_uq on competition_scores (judge_id, submission_id, criterion_id)',
  ]) {
    try {
      await db.execute(sql.raw(ddl))
    } catch {
      // Index already present under the schema's own name.
    }
  }
  indexesEnsured = true
}

/** SEED base + SEED §6 competition + fake reader with Ahmed's and Sara's answers. */
export async function competitionBase() {
  await ensureCompetitionIndexes()
  const base = await freshBase()
  const comp = await db.transaction((tx) =>
    seedCompetition(tx, base, { pitchBlockId: PITCH_BLOCK_ID }),
  )
  const c13 = base.courses.C13!
  const fake = installFakeReader(c13.id)
  fake.setAnswers(
    base.users.ahmed!.id,
    { '1': 'Heritage Pulse — feel the past', '2': 'A 24h pop-up trail', '3': 'Live AR stories' },
    new Date('2026-09-30T10:00:00Z'),
  )
  fake.setAnswers(base.users.sara!.id, { '1': 'Souq Stories' })
  fake.setUnits(base.users.ahmed!.id, c13.id, 4)
  fake.setUnits(base.users.sara!.id, c13.id, 3)
  return { ...base, comp, fake, c13 }
}

export type CompetitionFixture = Awaited<ReturnType<typeof competitionBase>>

export async function setProgress(userId: string, courseId: string, pct: number) {
  await db
    .update(enrolments)
    .set({ progressPct: pct })
    .where(and(eq(enrolments.userId, userId), eq(enrolments.courseId, courseId)))
}

/** Daniel accepts his seeded (pending) judge invitation through the real P11 route. */
export async function danielAccepts(invitationId: string) {
  const token = 'daniel-test-token-0123456789abcdefghijklmnop'
  await db
    .update(invitations)
    .set({ tokenHash: hashToken(token) })
    .where(eq(invitations.id, invitationId))
  const res = await anon(app)
    .post(`/api/public/invitations/${token}/accept`)
    .send({ name: 'Daniel Osei', password: PASSWORD, locale: 'en' })
  if (res.status !== 201) throw new Error(`accept failed ${res.status} ${JSON.stringify(res.body)}`)
  return DANIEL_EMAIL
}
