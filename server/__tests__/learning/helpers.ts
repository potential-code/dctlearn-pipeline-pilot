import { buildApp } from '@server/app'
import { db } from '@server/db/connection'
import { seedLearning } from '@server/db/seed/slices/learning.seed'
import { achievementsRouter } from '@server/routes/achievements.routes'
import { adminCoursesRouter } from '@server/routes/admin-courses.routes'
import { learningRouter } from '@server/routes/learning.routes'
import { scormRouter } from '@server/routes/scorm.routes'
import { sql } from 'drizzle-orm'
import { resetDb } from '../helpers/db'
import { freshBase } from '../helpers/fixtures'
import '@server/registrations/learning'
import '@server/jobs/learning.job'

/** The app with the learning + achievements routers (wired by the main session at merge). */
export const app = buildApp([learningRouter, adminCoursesRouter, achievementsRouter, scormRouter])

/**
 * Workaround (reported as a shared change): `courses_title_search_idx` in catalog.ts lacks
 * parentheses (`title->>'en' || ' ' || title->>'ar'` parses as `(… || title)->>'ar'`), so the
 * preload's drizzle-kit push stops at it and every index after it — including the unique keys
 * this area relies on (§9.2/§9.4) — is never created. Create that index correctly, then push
 * again so the remaining indexes exist. No-op once catalog.ts is fixed.
 */
let indexesReady = false
async function ensureIndexes() {
  if (indexesReady) return
  // Earlier test files may have left rows that a unique index would reject.
  await resetDb()
  await db.execute(
    sql`create index if not exists courses_title_search_idx on courses using gin (to_tsvector('simple', (title->>'en') || ' ' || (title->>'ar')))`,
  )
  const push = Bun.spawnSync(
    ['bunx', '--bun', 'drizzle-kit', 'push', '--force', '--config', './drizzle.config.ts'],
    { env: process.env, stdout: 'pipe', stderr: 'pipe' },
  )
  const check = await db.execute<{ n: number }>(
    sql`select count(*)::int as n from pg_indexes where indexname in ('points_ledger_source_uq', 'enrolments_user_course_uq', 'unit_progress_user_unit_uq')`,
  )
  if (push.exitCode !== 0 || check[0]?.n !== 3)
    throw new Error(`Schema indexes missing after push: ${push.stdout.toString().slice(-2000)}`)
  indexesReady = true
}

/** SEED base + learning slice (§2 content, §4.4 progress/points/certificates). */
export async function freshLearning() {
  await ensureIndexes()
  const base = await freshBase()
  const learning = await db.transaction((tx) =>
    seedLearning(tx, base.users, base.courses, base.microsites),
  )
  return { ...base, learning }
}

export type LearningSeed = Awaited<ReturnType<typeof freshLearning>>

export const PDF_BYTES = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n')
export const PNG_BYTES = Buffer.from(
  '89504e470d0a1a0a0000000d4948445200000001000000010806000000' +
    '1f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082',
  'hex',
)
