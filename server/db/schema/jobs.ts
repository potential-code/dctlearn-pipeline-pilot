import { createdAt, id, timestamps, tstz } from '@server/db/columns'
import { index, integer, jsonb, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'

/**
 * Durable job queue (contract §9.3). The runner claims rows with `FOR UPDATE SKIP LOCKED`, so
 * several processes can share it; failed runs back off exponentially and dead-letter after
 * `max_attempts`.
 */
export const jobRuns = pgTable(
  'job_runs',
  {
    id: id(),
    name: text('name').notNull(),
    payload: jsonb('payload').$type<unknown>().notNull(),
    /** queued · running · succeeded · failed · dead */
    status: text('status').default('queued').notNull(),
    attempts: integer('attempts').default(0).notNull(),
    maxAttempts: integer('max_attempts').default(5).notNull(),
    runAt: tstz('run_at').defaultNow().notNull(),
    lockedAt: tstz('locked_at'),
    finishedAt: tstz('finished_at'),
    lastError: text('last_error'),
    /** Optional idempotency key: one live run per key. */
    dedupeKey: text('dedupe_key'),
    ...timestamps(),
  },
  (t) => [
    index('job_runs_due_idx').on(t.status, t.runAt),
    uniqueIndex('job_runs_dedupe_uq').on(t.dedupeKey),
  ],
)

/** Last run of each repeatable schedule, so restarts do not double-fire. */
export const jobSchedules = pgTable('job_schedules', {
  name: text('name').primaryKey(),
  lastRunAt: tstz('last_run_at'),
  lastStatus: text('last_status'),
  lastError: text('last_error'),
  createdAt: createdAt(),
})
