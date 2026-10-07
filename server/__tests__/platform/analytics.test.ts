import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { db } from '@server/db/connection'
import { enrolments } from '@server/db/schema/catalog'
import { auditLog } from '@server/db/schema/identity'
import { reportCache } from '@server/db/schema/platform'
import type { BaseSeed } from '@server/db/seed/fixtures'
import { runSchedule } from '@server/jobs/runtime'
import { setNow } from '@server/lib/clock'
import { resolveRange } from '@server/services/analytics/range'
import {
  type InsightsProvider,
  setInsightsProvider,
  stubInsightsProvider,
} from '@server/services/providers/insights.provider'
import { Dashboard, InsightsAnswer, MicrositeReport } from '@shared/schemas/analytics'
import { and, eq } from 'drizzle-orm'
import { expectDenied } from '../helpers/denials'
import { as } from '../helpers/http'
import { app, NOT_ADMIN, seedAnalytics } from './helpers'
import { freshPlatformBase as freshBase } from './schema-fix'

const ADMIN = 'aisha.admin@dctlearn.example'
let base: BaseSeed

beforeEach(async () => {
  base = await freshBase()
  await seedAnalytics(base)
})
afterEach(() => setInsightsProvider(stubInsightsProvider))

const sum = (s: { value: number }[]) => s.reduce((t, b) => t + b.value, 0)

describe('P45 dashboard', () => {
  test('platform KPIs, series, microsites and roles match SEED', async () => {
    const a = await as(ADMIN, app)
    const res = await a.get('/api/admin/dashboard?range=30d')
    expect(res.status).toBe(200)
    const d = Dashboard.parse(res.body)
    expect(d.kpis).toEqual({
      totalUsers: 20,
      newUsers: 2,
      activeUsers: 7,
      completions: 8,
      certificates: 8,
      growthPct: 100,
    })
    // 30 days ending 2026-10-06 09:00 → day buckets 2026-09-06 … 2026-10-06, zero-filled.
    expect(d.series.signups).toHaveLength(31)
    expect(d.series.signups[0]!.bucket).toBe('2026-09-06')
    expect(d.series.signups.at(-1)!.bucket).toBe('2026-10-06')
    expect(d.series.signups.find((b) => b.bucket === '2026-09-20')!.value).toBe(2)
    expect(sum(d.series.completions)).toBe(8)

    expect(d.byMicrosite.map((m) => m.microsite.id)).toHaveLength(9)
    const by = Object.fromEntries(d.byMicrosite.map((m) => [m.microsite.id, m]))
    expect(by.employees).toMatchObject({ members: 5, active: 4, completions: 4 })
    expect(by.znm).toMatchObject({ members: 2, active: 2, completions: 3 })
    expect(by.zu).toMatchObject({ members: 2, active: 1, completions: 1 })
    expect(by.ruwaad).toMatchObject({ members: 0, active: 0, completions: 0 })
    expect(Object.fromEntries(d.byRole.map((r) => [r.role, r.count]))).toEqual({
      learner: 9,
      mentor: 4,
      judge: 1,
      sub_admin: 5,
      admin: 1,
    })
    expect(
      d.recentSignups
        .map((u) => u.name)
        .slice(0, 2)
        .sort(),
    ).toEqual(['Mona Al Ameri', 'Saeed Al Hammadi'])
  })

  test('ranges bucket by day / week / month; previous period drives growth', async () => {
    const a = await as(ADMIN, app)
    const week = Dashboard.parse((await a.get('/api/admin/dashboard?range=7d')).body)
    expect(week.series.completions).toHaveLength(8)
    expect(week.kpis.completions).toBe(3) // Ahmed 09-29, Reem 09-30, Hamad 10-01
    const quarter = Dashboard.parse((await a.get('/api/admin/dashboard?range=90d')).body)
    expect(new Date(`${quarter.series.signups[0]!.bucket}T00:00:00Z`).getUTCDay()).toBe(1)
    expect(quarter.kpis.newUsers).toBe(3)
    expect(quarter.kpis.completions).toBe(9)
    const year = Dashboard.parse((await a.get('/api/admin/dashboard?range=12m')).body)
    expect(year.series.signups).toHaveLength(13)
    expect(year.series.signups[0]!.bucket).toBe('2025-10-01')
    expect(sum(year.series.signups)).toBe(20)
    expect(year.kpis.growthPct).toBe(100)
    const r = resolveRange('30d', new Date('2026-10-06T09:00:00Z'))
    expect(r.prevFrom.toISOString()).toBe('2026-08-07T09:00:00.000Z')
  })

  test('microsite filter scopes everything to its members and courses', async () => {
    const a = await as(ADMIN, app)
    const d = Dashboard.parse((await a.get('/api/admin/dashboard?microsite=employees')).body)
    expect(d.kpis).toMatchObject({ totalUsers: 5, newUsers: 2, completions: 4, certificates: 4 })
    expect(d.byMicrosite.map((m) => m.microsite.id)).toEqual(['employees'])
    expect(d.byRole).toEqual([{ role: 'learner', count: 5 }])
    expect((await a.get('/api/admin/dashboard?microsite=nope')).status).toBe(404)
  })

  test('invalid range → 422; everyone but admin denied', async () => {
    const a = await as(ADMIN, app)
    const bad = await a.get('/api/admin/dashboard?range=1y')
    expect(bad.status).toBe(422)
    expect(bad.body.error.fields.range).toBeString()
    expect((await a.get('/api/admin/dashboard?microsite=Bad_Slug')).status).toBe(422)
    await expectDenied(app, (c) => c.get('/api/admin/dashboard'), NOT_ADMIN)
  })
})

describe('P55 microsite report', () => {
  test('dashboard shape + top courses', async () => {
    const a = await as(ADMIN, app)
    const res = await a.get('/api/admin/microsites/employees/report?range=30d')
    expect(res.status).toBe(200)
    const r = MicrositeReport.parse(res.body)
    expect(r.kpis.totalUsers).toBe(5)
    expect(r.topCourses[0]).toMatchObject({ title: { en: 'DCT World' }, started: 4, completed: 3 })
    expect(r.topCourses[1]).toMatchObject({ title: { en: 'DCTLEARN' }, started: 1, completed: 1 })
    expect(r.topCourses).toHaveLength(8)
    expect((await a.get('/api/admin/microsites/nope/report')).status).toBe(404)
    expect((await a.get('/api/admin/microsites/znm/report?range=2w')).status).toBe(422)
    await expectDenied(app, (c) => c.get('/api/admin/microsites/employees/report'), NOT_ADMIN)
  })
})

describe('report cache (15-min schedule)', () => {
  test('schedule fills every range × scope; fresh rows are served, stale ones recomputed', async () => {
    const result = (await runSchedule('platform.report_cache')) as { written: number }
    expect(result.written).toBe(40)
    expect(await db.select().from(reportCache)).toHaveLength(40)

    // A completion after the refresh is not visible while the cache is fresh…
    await db
      .update(enrolments)
      .set({ state: 'completed', completedAt: new Date('2026-10-05T10:00:00Z') })
      .where(
        and(
          eq(enrolments.userId, base.users.mona!.id),
          eq(enrolments.courseId, base.courses.C01!.id),
        ),
      )
    const a = await as(ADMIN, app)
    expect(Dashboard.parse((await a.get('/api/admin/dashboard')).body).kpis.completions).toBe(8)
    // …and is once the cached row is older than the schedule interval (cold → live).
    setNow('2026-10-06T09:30:00Z')
    expect(Dashboard.parse((await a.get('/api/admin/dashboard')).body).kpis.completions).toBe(9)
  })
})

describe('P45 AI insights', () => {
  test('503 feature_off while AI is not configured', async () => {
    const a = await as(ADMIN, app)
    const res = await a.post('/api/admin/insights/ask').send({ question: 'Which microsite grew?' })
    expect(res.status).toBe(503)
    expect(res.body.error.code).toBe('feature_off')
    expect((await a.post('/api/admin/insights/ask').send({ question: '' })).status).toBe(422)
    await expectDenied(
      app,
      (c) => c.post('/api/admin/insights/ask').send({ question: 'Which microsite grew?' }),
      NOT_ADMIN,
    )
  })

  test('the provider only receives aggregates (no names or e-mails)', async () => {
    let seen: Record<string, unknown> = {}
    const fake: InsightsProvider = {
      enabled: true,
      async ask(_q, aggregates) {
        seen = aggregates
        return { answer: 'Employees grew most.', dataUsed: Object.keys(aggregates) }
      },
    }
    setInsightsProvider(fake)
    const a = await as(ADMIN, app)
    const res = await a.post('/api/admin/insights/ask').send({ question: 'Which microsite grew?' })
    expect(res.status).toBe(200)
    expect(InsightsAnswer.parse(res.body).answer).toBe('Employees grew most.')
    const text = JSON.stringify(seen)
    expect(text).not.toContain('@')
    expect(text).not.toContain('Saeed')
    expect(text).toContain('"completions":8')
  })
})

describe('P55 progress CSV', () => {
  test('rows per enrolment, filters, audit', async () => {
    const a = await as(ADMIN, app)
    const all = await a.get('/api/admin/exports/progress.csv?microsite=employees')
    expect(all.status).toBe(200)
    expect(all.headers['content-type']).toStartWith('text/csv')
    const lines = all.text.trim().split('\r\n')
    expect(lines[0]).toBe('user,email,course,progress_pct,state,completed_at')
    expect(lines).toHaveLength(1 + 5 * 8) // members × employees courses
    const ranged = await a.get(
      '/api/admin/exports/progress.csv?microsite=employees&from=2026-09-25&to=2026-09-30',
    )
    const rows = ranged.text.trim().split('\r\n').slice(1).sort()
    expect(rows).toEqual([
      'Reem Al Shamsi,reem.s@dctlearn.example,DCT World,100,completed,2026-09-30T10:00:00.000Z',
      'Saeed Al Hammadi,saeed.h@dctlearn.example,DCT World,100,completed,2026-09-25T10:00:00.000Z',
      'Saeed Al Hammadi,saeed.h@dctlearn.example,DCTLEARN,100,completed,2026-09-26T10:00:00.000Z',
    ])
    const audit = await db.select().from(auditLog).where(eq(auditLog.action, 'export.progress_csv'))
    expect(audit).toHaveLength(2)
  })

  test('bad ranges 422, unknown microsite 404, non-admins denied', async () => {
    const a = await as(ADMIN, app)
    const bad = await a.get('/api/admin/exports/progress.csv?from=2026-10-01&to=2026-09-01')
    expect(bad.status).toBe(422)
    expect(bad.body.error.fields.to).toBeString()
    expect((await a.get('/api/admin/exports/progress.csv?from=yesterday')).status).toBe(422)
    expect((await a.get('/api/admin/exports/progress.csv?microsite=nope')).status).toBe(404)
    await expectDenied(app, (c) => c.get('/api/admin/exports/progress.csv'), NOT_ADMIN)
  })
})
