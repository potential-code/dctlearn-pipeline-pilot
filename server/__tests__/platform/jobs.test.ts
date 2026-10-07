import { beforeEach, describe, expect, test } from 'bun:test'
import { db } from '@server/db/connection'
import { files } from '@server/db/schema/files'
import { auditLog, sessions, verifications } from '@server/db/schema/identity'
import { csvImports } from '@server/db/schema/imports'
import { jobRuns } from '@server/db/schema/jobs'
import { progressExports } from '@server/db/schema/platform'
import type { BaseSeed } from '@server/db/seed/fixtures'
import { drainJobs, runSchedule } from '@server/jobs/runtime'
import { storage } from '@server/lib/storage'
import { dueExportDate } from '@server/services/platform/exports.service'
import { ExportsPage, JobRun, JobsPage, ScheduleList } from '@shared/schemas/platform'
import { eq } from 'drizzle-orm'
import { expectDenied } from '../helpers/denials'
import { as } from '../helpers/http'
import { app, NOT_ADMIN, seedAnalytics } from './helpers'
import { freshPlatformBase } from './schema-fix'

const ADMIN = 'aisha.admin@dctlearn.example'
let base: BaseSeed

beforeEach(async () => {
  base = await freshPlatformBase()
})

async function deadLetter() {
  const [row] = await db
    .insert(jobRuns)
    .values({
      name: 'email.send',
      payload: {
        to: 'mona.a@dctlearn.example',
        template: 'set-password',
        data: { name: 'Mona', url: 'https://example.com/set' },
        locale: 'en',
      },
      status: 'dead',
      attempts: 5,
      maxAttempts: 5,
      lastError: 'SMTP unavailable',
      finishedAt: new Date('2026-10-05T10:00:00Z'),
    })
    .returning()
  return row!
}

describe('admin jobs screen', () => {
  test('lists runs with dead letters, never payloads; filters; 422 on bad status', async () => {
    const dead = await deadLetter()
    await db.insert(jobRuns).values({ name: 'platform.data_export', payload: {} })
    const a = await as(ADMIN, app)
    const res = await a.get('/api/admin/jobs?status=dead')
    expect(res.status).toBe(200)
    const page = JobsPage.parse(res.body)
    expect(page.total).toBe(1)
    expect(page.items[0]).toMatchObject({
      id: dead.id,
      status: 'dead',
      lastError: 'SMTP unavailable',
    })
    expect(JSON.stringify(res.body)).not.toContain('mona.a@')
    expect(JobsPage.parse((await a.get('/api/admin/jobs?name=data_export')).body).total).toBe(1)
    expect(JobsPage.parse((await a.get('/api/admin/jobs')).body).total).toBe(2)
    expect((await a.get('/api/admin/jobs?status=stuck')).status).toBe(422)
    await expectDenied(app, (c) => c.get('/api/admin/jobs'), NOT_ADMIN)
  })

  test('retry: dead/failed → queued (audited); others 409; unknown 404', async () => {
    const dead = await deadLetter()
    const a = await as(ADMIN, app)
    const res = await a.post(`/api/admin/jobs/${dead.id}/retry`)
    expect(res.status).toBe(200)
    expect(JobRun.parse(res.body)).toMatchObject({ status: 'queued', attempts: 0 })
    const [audit] = await db.select().from(auditLog).where(eq(auditLog.action, 'job.retry'))
    expect(audit).toMatchObject({ targetId: dead.id, targetLabel: 'email.send' })
    expect((await a.post(`/api/admin/jobs/${dead.id}/retry`)).status).toBe(409)
    // The retried e-mail is delivered by the next poll.
    const ran = await drainJobs()
    expect(ran.find((r) => r.id === dead.id)?.status).toBe('succeeded')
    expect(
      (await a.post('/api/admin/jobs/00000000-0000-4000-8000-000000000000/retry')).status,
    ).toBe(404)
    expect((await a.post('/api/admin/jobs/not-a-uuid/retry')).status).toBe(404)
    await expectDenied(app, (c) => c.post(`/api/admin/jobs/${dead.id}/retry`), NOT_ADMIN)
  })

  test('schedules list with last run state', async () => {
    await runSchedule('platform.cleanup')
    const a = await as(ADMIN, app)
    const res = await a.get('/api/admin/jobs/schedules')
    expect(res.status).toBe(200)
    const list = ScheduleList.parse(res.body)
    const byName = Object.fromEntries(list.map((s) => [s.name, s]))
    expect(byName['platform.cleanup']).toMatchObject({
      everySeconds: 86400,
      lastStatus: 'succeeded',
    })
    expect(byName['platform.report_cache']!.everySeconds).toBe(900)
    expect(byName['platform.machine_translation']!.everySeconds).toBe(60)
    expect(byName['platform.nightly_progress_export']!.lastRunAt).toBeUndefined()
    await expectDenied(app, (c) => c.get('/api/admin/jobs/schedules'), NOT_ADMIN)
  })
})

describe('cleanup schedule', () => {
  test('removes expired tokens, sessions, import previews and orphaned tmp files only', async () => {
    const past = new Date('2026-10-01T00:00:00Z')
    const future = new Date('2026-12-01T00:00:00Z')
    await db.insert(verifications).values([
      { identifier: 'a@x.example', value: 'old', expiresAt: past },
      { identifier: 'b@x.example', value: 'live', expiresAt: future },
    ])
    const saeed = base.users.saeed!.id
    await db.insert(sessions).values([
      { token: 'expired-token', userId: saeed, expiresAt: past },
      { token: 'live-token', userId: saeed, expiresAt: future },
    ])
    await db.insert(csvImports).values([
      {
        kind: 'users',
        scope: 'platform',
        tokenHash: 'h1',
        rows: [{ email: 'x@example.com' }],
        createdById: base.users.aisha!.id,
        expiresAt: past,
      },
    ])
    await storage().put('tmp/old.bin', new Uint8Array([1]), 'application/octet-stream')
    const old = new Date('2026-10-04T00:00:00Z')
    const recent = new Date('2026-10-06T08:00:00Z')
    await db.insert(files).values([
      { key: 'tmp/old.bin', category: 'tmp', contentType: 'x', size: 1, createdAt: old },
      { key: 'tmp/new.bin', category: 'tmp', contentType: 'x', size: 1, createdAt: recent },
      { key: 'image/old.png', category: 'image', contentType: 'x', size: 1, createdAt: old },
    ])

    const result = await runSchedule('platform.cleanup')
    expect(result).toEqual({
      verificationsRemoved: 1,
      sessionsRemoved: 1,
      importsRemoved: 1,
      tmpRemoved: 1,
      dataExportsRemoved: 0,
      progressExportsRemoved: 0,
    })
    expect((await db.select().from(files)).map((f) => f.key).sort()).toEqual([
      'image/old.png',
      'tmp/new.bin',
    ])
    expect(await storage().exists('tmp/old.bin')).toBe(false)
    expect(await db.select().from(sessions)).toHaveLength(1)
  })
})

describe('nightly progress export', () => {
  test('due after 02:00 Gulf time', () => {
    expect(dueExportDate(new Date('2026-10-05T21:30:00Z'))).toBeNull() // 01:30 Gulf
    expect(dueExportDate(new Date('2026-10-05T22:30:00Z'))).toBe('2026-10-06') // 02:30 Gulf
  })

  test('one export per Gulf day, listed and downloadable (audited), purged after 30 days', async () => {
    await seedAnalytics(base)
    expect(await runSchedule('platform.nightly_progress_export')).toEqual({
      enqueued: true,
      forDate: '2026-10-06',
    })
    await drainJobs()
    expect(await runSchedule('platform.nightly_progress_export')).toEqual({ enqueued: false })

    const a = await as(ADMIN, app)
    const list = ExportsPage.parse((await a.get('/api/admin/exports')).body)
    expect(list.total).toBe(1)
    const item = list.items[0]!
    expect(item).toMatchObject({ kind: 'nightly', forDate: '2026-10-06' })
    expect(item.expiresAt).toBe('2026-11-05T09:00:00.000Z')
    const dl = await a.get(item.downloadUrl)
    expect(dl.status).toBe(200)
    expect(dl.headers['content-disposition']).toContain('progress-2026-10-06.csv')
    const lines = dl.text.trim().split('\r\n')
    expect(lines[0]).toBe('user,email,course,progress_pct,state,completed_at')
    expect(lines.length - 1).toBe(item.rows)
    expect(
      await db.select().from(auditLog).where(eq(auditLog.action, 'export.download')),
    ).toHaveLength(1)
    expect((await a.get('/api/admin/exports/00000000-0000-4000-8000-000000000000')).status).toBe(
      404,
    )
    await expectDenied(app, (c) => c.get('/api/admin/exports'), NOT_ADMIN)
    await expectDenied(app, (c) => c.get(item.downloadUrl), NOT_ADMIN)

    await db.update(progressExports).set({ expiresAt: new Date('2026-10-01T00:00:00Z') })
    const cleaned = (await runSchedule('platform.cleanup')) as { progressExportsRemoved: number }
    expect(cleaned.progressExportsRemoved).toBe(1)
    expect(ExportsPage.parse((await a.get('/api/admin/exports')).body).total).toBe(0)
  })
})
