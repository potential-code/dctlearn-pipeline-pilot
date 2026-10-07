import { env, isTest } from '@server/config/env'
import { type DbOrTx, db } from '@server/db/connection'
import { jobRuns, jobSchedules } from '@server/db/schema/jobs'
import { now } from '@server/lib/clock'
import { logger } from '@server/lib/logger'
import { and, eq, inArray, lte, sql } from 'drizzle-orm'
import type { z } from 'zod'

/**
 * The jobs seam (contract §9.3). Modules call `defineJob` / `defineSchedule` at import time and
 * `enqueue` inside their transactions, so a job only exists if the change that caused it
 * committed. The runner polls Postgres (`FOR UPDATE SKIP LOCKED`), which works with or without
 * Redis; tests call `runDueJobs()` / `runSchedule()` directly instead of starting the loop.
 */

type JobDef<P> = {
  name: string
  schema?: z.ZodType<P>
  maxAttempts: number
  handler: (payload: P, ctx: { attempt: number; runId: string }) => Promise<void>
}

type ScheduleDef = {
  name: string
  everySeconds: number
  handler: () => Promise<unknown>
}

const jobs = new Map<string, JobDef<unknown>>()
const schedules = new Map<string, ScheduleDef>()

export function defineJob<P>(
  name: string,
  handler: JobDef<P>['handler'],
  options: { maxAttempts?: number; schema?: z.ZodType<P> } = {},
) {
  if (jobs.has(name)) throw new Error(`Job ${name} is defined twice`)
  jobs.set(name, {
    name,
    handler,
    maxAttempts: options.maxAttempts ?? 3,
    schema: options.schema,
  } as JobDef<unknown>)
  return {
    name,
    enqueue: (payload: P, opts?: EnqueueOptions) => enqueue(name, payload, opts),
  }
}

export function defineSchedule(
  name: string,
  everySeconds: number,
  handler: () => Promise<unknown>,
) {
  if (schedules.has(name)) throw new Error(`Schedule ${name} is defined twice`)
  schedules.set(name, { name, everySeconds, handler })
}

export type EnqueueOptions = { runAt?: Date; dedupeKey?: string; maxAttempts?: number; tx?: DbOrTx }

export async function enqueue(name: string, payload: unknown, opts: EnqueueOptions = {}) {
  const def = jobs.get(name)
  if (!def) throw new Error(`Unknown job ${name}`)
  const handle = opts.tx ?? db
  const [row] = await handle
    .insert(jobRuns)
    .values({
      name,
      payload: payload as object,
      runAt: opts.runAt ?? now(),
      maxAttempts: opts.maxAttempts ?? def.maxAttempts,
      dedupeKey: opts.dedupeKey,
    })
    .onConflictDoNothing()
    .returning({ id: jobRuns.id })
  return row?.id ?? null
}

/** Exponential backoff: 30 s, 60 s, 120 s, … capped at 1 h. */
export function backoffSeconds(attempt: number) {
  return Math.min(30 * 2 ** Math.max(0, attempt - 1), 3600)
}

async function claim(limit: number) {
  return db.transaction(async (tx) => {
    const due = await tx
      .select({ id: jobRuns.id })
      .from(jobRuns)
      .where(and(inArray(jobRuns.status, ['queued', 'failed']), lte(jobRuns.runAt, now())))
      .orderBy(jobRuns.runAt)
      .limit(limit)
      .for('update', { skipLocked: true })
    if (due.length === 0) return []
    return tx
      .update(jobRuns)
      .set({ status: 'running', lockedAt: new Date(), attempts: sql`${jobRuns.attempts} + 1` })
      .where(
        inArray(
          jobRuns.id,
          due.map((r) => r.id),
        ),
      )
      .returning()
  })
}

async function execute(run: typeof jobRuns.$inferSelect) {
  const def = jobs.get(run.name)
  try {
    if (!def) throw new Error(`No handler for job ${run.name}`)
    const payload = def.schema ? def.schema.parse(run.payload) : run.payload
    await def.handler(payload, { attempt: run.attempts, runId: run.id })
    await db
      .update(jobRuns)
      .set({ status: 'succeeded', finishedAt: new Date(), lastError: null, dedupeKey: null })
      .where(eq(jobRuns.id, run.id))
    return 'succeeded' as const
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const dead = run.attempts >= run.maxAttempts
    await db
      .update(jobRuns)
      .set({
        status: dead ? 'dead' : 'failed',
        lastError: message.slice(0, 2000),
        finishedAt: dead ? new Date() : null,
        runAt: dead ? run.runAt : new Date(now().getTime() + backoffSeconds(run.attempts) * 1000),
        dedupeKey: dead ? null : run.dedupeKey,
      })
      .where(eq(jobRuns.id, run.id))
    if (!isTest)
      logger.warn(
        { job: run.name, runId: run.id, attempt: run.attempts, dead, err: message },
        'Job failed',
      )
    return dead ? ('dead' as const) : ('failed' as const)
  }
}

/** Runs every due job once (tests, and the poll loop). Returns the outcome per run. */
export async function runDueJobs(limit = 50) {
  const claimed = await claim(limit)
  const results: { id: string; name: string; status: 'succeeded' | 'failed' | 'dead' }[] = []
  for (const run of claimed)
    results.push({ id: run.id, name: run.name, status: await execute(run) })
  return results
}

/** Drains the queue, including jobs enqueued by jobs (tests). */
export async function drainJobs(maxRounds = 10) {
  const all: Awaited<ReturnType<typeof runDueJobs>> = []
  for (let i = 0; i < maxRounds; i++) {
    const batch = await runDueJobs()
    if (batch.length === 0) break
    all.push(...batch)
  }
  return all
}

export async function runSchedule(name: string) {
  const def = schedules.get(name)
  if (!def) throw new Error(`Unknown schedule ${name}`)
  try {
    const result = await def.handler()
    await db
      .insert(jobSchedules)
      .values({ name, lastRunAt: new Date(), lastStatus: 'succeeded', lastError: null })
      .onConflictDoUpdate({
        target: jobSchedules.name,
        set: { lastRunAt: new Date(), lastStatus: 'succeeded', lastError: null },
      })
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await db
      .insert(jobSchedules)
      .values({ name, lastRunAt: new Date(), lastStatus: 'failed', lastError: message })
      .onConflictDoUpdate({
        target: jobSchedules.name,
        set: { lastRunAt: new Date(), lastStatus: 'failed', lastError: message },
      })
    throw error
  }
}

export function listJobs() {
  return [...jobs.values()].map((j) => ({ name: j.name, maxAttempts: j.maxAttempts }))
}

export function listSchedules() {
  return [...schedules.values()].map((s) => ({ name: s.name, everySeconds: s.everySeconds }))
}

let timer: ReturnType<typeof setInterval> | null = null
let ticking = false
const lastScheduleRun = new Map<string, number>()

async function tick() {
  if (ticking) return
  ticking = true
  try {
    await runDueJobs()
    const t = Date.now()
    for (const s of schedules.values()) {
      const last = lastScheduleRun.get(s.name) ?? 0
      if (t - last >= s.everySeconds * 1000) {
        lastScheduleRun.set(s.name, t)
        await runSchedule(s.name).catch((err) =>
          logger.error({ err, schedule: s.name }, 'Schedule failed'),
        )
      }
    }
  } catch (err) {
    logger.error({ err }, 'Job tick failed')
  } finally {
    ticking = false
  }
}

export function startJobs() {
  if (timer || !env.JOBS_ENABLED) return
  // Schedules first fire one interval after boot, not at boot.
  for (const s of schedules.values()) lastScheduleRun.set(s.name, Date.now())
  timer = setInterval(() => void tick(), env.JOBS_POLL_SECONDS * 1000)
  logger.info({ jobs: jobs.size, schedules: schedules.size }, 'Job runner started (Postgres poll)')
}

export async function stopJobs() {
  if (timer) clearInterval(timer)
  timer = null
  while (ticking) await new Promise((r) => setTimeout(r, 50))
}
