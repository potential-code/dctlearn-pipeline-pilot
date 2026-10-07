import { db } from '@server/db/connection'
import { jobRuns, jobSchedules } from '@server/db/schema/jobs'
import { listSchedules } from '@server/jobs/runtime'
import { recordAudit } from '@server/lib/audit'
import { now } from '@server/lib/clock'
import { conflict, notFound } from '@server/lib/errors'
import { paged, pageWindow } from '@server/lib/pagination'
import type { JOB_STATUSES } from '@shared/schemas/platform'
import { and, count, desc, eq, ilike } from 'drizzle-orm'

/**
 * Admin jobs screen (contract §9.3: dead letters "visible in admin jobs screen"; endpoints are a
 * v0.4 addition). Payloads are never returned — they can carry e-mails and invitation links.
 */
type JobStatus = (typeof JOB_STATUSES)[number]

function toDto(r: typeof jobRuns.$inferSelect) {
  return {
    id: r.id,
    name: r.name,
    status: r.status as JobStatus,
    attempts: r.attempts,
    maxAttempts: r.maxAttempts,
    runAt: r.runAt.toISOString(),
    ...(r.finishedAt ? { finishedAt: r.finishedAt.toISOString() } : {}),
    ...(r.lastError ? { lastError: r.lastError } : {}),
    createdAt: r.createdAt.toISOString(),
  }
}

export async function listJobRuns(q: {
  status?: JobStatus
  name?: string
  page: number
  pageSize: number
}) {
  const where = and(
    q.status ? eq(jobRuns.status, q.status) : undefined,
    q.name ? ilike(jobRuns.name, `%${q.name.replace(/[%_\\]/g, '\\$&')}%`) : undefined,
  )
  const [total] = await db.select({ n: count() }).from(jobRuns).where(where)
  const { limit, offset } = pageWindow(q)
  const rows = await db
    .select()
    .from(jobRuns)
    .where(where)
    .orderBy(desc(jobRuns.createdAt), desc(jobRuns.id))
    .limit(limit)
    .offset(offset)
  return paged(rows.map(toDto), total?.n ?? 0, q)
}

export async function listScheduleStates() {
  const states = new Map((await db.select().from(jobSchedules)).map((s) => [s.name, s]))
  return listSchedules()
    .map((s) => {
      const st = states.get(s.name)
      return {
        name: s.name,
        everySeconds: s.everySeconds,
        ...(st?.lastRunAt ? { lastRunAt: st.lastRunAt.toISOString() } : {}),
        ...(st?.lastStatus === 'succeeded' || st?.lastStatus === 'failed'
          ? { lastStatus: st.lastStatus as 'succeeded' | 'failed' }
          : {}),
        ...(st?.lastError ? { lastError: st.lastError } : {}),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** Dead or failed → queued now, with a fresh set of attempts. Audit: yes. */
export async function retryJob(id: string, viewer: Viewer) {
  return db.transaction(async (tx) => {
    const [run] = await tx.select().from(jobRuns).where(eq(jobRuns.id, id)).for('update')
    if (!run) throw notFound()
    if (run.status !== 'dead' && run.status !== 'failed')
      throw conflict('Only failed or dead jobs can be retried')
    const [updated] = await tx
      .update(jobRuns)
      .set({ status: 'queued', attempts: 0, runAt: now(), finishedAt: null, lockedAt: null })
      .where(eq(jobRuns.id, id))
      .returning()
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'job.retry',
      target: { type: 'job', id, label: run.name },
      ip: viewer.ip,
      meta: { from: run.status, attempts: run.attempts },
    })
    return toDto(updated!)
  })
}
