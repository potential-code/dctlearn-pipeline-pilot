import { beforeAll, describe, expect, test } from 'bun:test'
import { app } from '@server/app'
import { db } from '@server/db/connection'
import { enrolments, pointsLedger } from '@server/db/schema/catalog'
import { courseBlocks } from '@server/db/schema/learning'
import { E } from '@server/db/seed/data'
import type { BaseSeed } from '@server/db/seed/fixtures'
import { type SeededLearning, seedLearning } from '@server/db/seed/slices/learning.seed'
import { drainJobs } from '@server/jobs/runtime'
import { outbox } from '@server/services/email.service'
import { and, eq, sql } from 'drizzle-orm'
import { freshBase, userByEmail } from '../helpers/fixtures'
import { anon, as } from '../helpers/http'

/** Regression tests for the six high findings of the QA pass (2026-10-07). */

let base: BaseSeed
let learning: SeededLearning

beforeAll(async () => {
  base = await freshBase()
  learning = await db.transaction((tx) =>
    seedLearning(tx, base.users, base.courses, base.microsites),
  )
})

describe('Q1-1 forgot password with only { email } gives a working link', () => {
  test('the e-mail link redirects to the app reset page with the token', async () => {
    outbox.length = 0
    const res = await anon(app).post('/api/auth/forget-password').send({ email: E.elise })
    expect(res.status).toBe(200)
    await new Promise((r) => setTimeout(r, 30))
    await drainJobs()
    const mail = outbox.find((m) => m.to === E.elise && m.template === 'set-password')
    expect(mail).toBeDefined()
    const link = new URL(String(mail!.data.url))
    expect(link.searchParams.get('callbackURL')).toBe('http://localhost:5173/reset-password')
    const open = await anon(app)
      .get(link.pathname + link.search)
      .redirects(0)
    expect(open.status).toBe(302)
    expect(open.headers.location).toStartWith('http://localhost:5173/reset-password?token=')
  })
})

describe('Q2-1 a partial microsite update keeps courses, tabs and flags', () => {
  test('PUT with only a new name changes only the name', async () => {
    const a = await as(E.aisha!, app)
    const before = (await a.get('/api/admin/microsites/znm')).body
    const res = await a
      .put('/api/admin/microsites/znm')
      .send({ name: { en: 'ZNM renamed', ar: 'متحف' }, ifMatch: before.updatedAt })
    expect(res.status).toBe(200)
    expect(res.body.name.en).toBe('ZNM renamed')
    expect(res.body.courseIds).toEqual(before.courseIds)
    expect(res.body.mandatoryCourseIds).toEqual(before.mandatoryCourseIds)
    expect(res.body.tabs).toEqual(before.tabs)
    expect(res.body.mentoringEnabled).toBe(before.mentoringEnabled)
    const yousef = await as(E.yousef!, app)
    expect((await yousef.get('/api/microsites/znm/hub/courses')).status).toBe(200)
  })

  test('a live microsite cannot lose its last enabled tab', async () => {
    const a = await as(E.aisha!, app)
    const res = await a.put('/api/admin/microsites/znm').send({ tabs: [] })
    expect(res.status).toBe(409)
  })
})

describe('Q3-1 external-certificate courses complete only by approval', () => {
  test('finishing the unit of C19 does not complete the course or award course points', async () => {
    const hamad = await userByEmail(E.hamad!)
    const unitId = learning.content.C19!.units[0]!
    const c = await as(E.hamad!, app)
    for (const blockId of learning.content.C19!.blocks[0]!) {
      await c.post(`/api/units/${unitId}/blocks/${blockId}/progress`).send({ completed: true })
    }
    const res = await c.post(`/api/units/${unitId}/complete`)
    expect(res.status).toBe(200)
    expect(res.body.certificate).toBeUndefined()
    const [e] = await db
      .select()
      .from(enrolments)
      .where(and(eq(enrolments.userId, hamad.id), eq(enrolments.courseId, base.courses.C19!.id)))
    expect(e!.state).not.toBe('completed')
    const coursePoints = await db
      .select()
      .from(pointsLedger)
      .where(
        and(
          eq(pointsLedger.userId, hamad.id),
          eq(pointsLedger.courseId, base.courses.C19!.id),
          eq(pointsLedger.sourceType, 'course'),
        ),
      )
    expect(coursePoints).toHaveLength(0)
  })
})

describe('Q3-2 unit quizzes are reachable', () => {
  test('course and unit responses list the unit assessments with status', async () => {
    const quizId = learning.content.C08!.assessments.quiz!
    const unitId = learning.content.C08!.units[1]!
    const c = await as(E.mona!, app)
    const course = await c.get(`/api/microsites/employees/courses/${base.courses.C08!.slug}`)
    expect(course.status).toBe(200)
    const unitRow = course.body.modules
      .flatMap((m: { units: { id: string }[] }) => m.units)
      .find((u: { id: string }) => u.id === unitId)
    expect(unitRow.assessments.map((a: { id: string }) => a.id)).toContain(quizId)
    // Unit 2 is locked until unit 1 is done.
    expect(unitRow.assessments[0].status).toBe('locked')
    const first = learning.content.C08!.units[0]!
    for (const blockId of learning.content.C08!.blocks[0]!) {
      await c.post(`/api/units/${first}/blocks/${blockId}/progress`).send({ completed: true })
    }
    expect((await c.post(`/api/units/${first}/complete`)).status).toBe(200)
    const unit = await c.get(`/api/units/${unitId}`)
    expect(unit.status).toBe(200)
    expect(unit.body.assessments).toEqual([
      expect.objectContaining({ id: quizId, type: 'quiz_blocking', status: 'available' }),
    ])
    expect((await c.get(`/api/assessments/${quizId}`)).status).toBe(200)
  })
})

describe('Q4-1 the Zoom webhook is reachable without a browser Origin', () => {
  test('no Origin → the signature check answers (401), not the CSRF check (403)', async () => {
    const res = await anon(app).post('/api/webhooks/zoom').unset('Origin').send({ event: 'x' })
    expect(res.status).toBe(401)
  })

  test('other mutating routes still need the Origin', async () => {
    const c = await as(E.mona!, app)
    expect((await c.put('/api/me/locale').unset('Origin').send({ locale: 'ar' })).status).toBe(403)
  })
})

describe('Q5-1 block text is translatable', () => {
  test('text blocks are listed per path and saving writes into that path', async () => {
    const a = await as(E.aisha!, app)
    const list = await a.get('/api/admin/translations?entity=block&pageSize=100')
    expect(list.status).toBe(200)
    expect(list.body.total).toBeGreaterThan(0)
    const html = list.body.items.find((i: { field: string }) => i.field === 'html')
    expect(html).toBeDefined()
    const res = await a.put('/api/admin/translations').send({
      entity: 'block',
      id: html.id,
      field: 'html',
      ar: '<p>نص جديد</p><script>x()</script>',
    })
    expect(res.status).toBe(200)
    const [block] = await db.select().from(courseBlocks).where(eq(courseBlocks.id, html.id))
    const payload = block!.payload as { html: { en: string; ar: string }; ar?: unknown }
    expect(payload.html.ar).toBe('<p>نص جديد</p>')
    expect(payload.ar).toBeUndefined()
    expect(payload.html.en).toBe(html.en)
  })

  test('nested paths (quotes items) and unknown paths', async () => {
    const a = await as(E.aisha!, app)
    const list = await a.get('/api/admin/translations?entity=block&pageSize=100')
    const nested = list.body.items.find((i: { field: string }) =>
      /^items\.\d+\.text$/.test(i.field),
    )
    expect(nested).toBeDefined()
    const ok = await a
      .put('/api/admin/translations')
      .send({ entity: 'block', id: nested.id, field: nested.field, ar: 'اقتباس' })
    expect(ok.status).toBe(200)
    const bad = await a
      .put('/api/admin/translations')
      .send({ entity: 'block', id: nested.id, field: 'items.99.text', ar: 'x' })
    expect(bad.status).toBe(422)
    const [row] = await db
      .select({
        v: sql<string>`${courseBlocks.payload} #>> ${`{${nested.field.split('.').join(',')},ar}`}::text[]`,
      })
      .from(courseBlocks)
      .where(eq(courseBlocks.id, nested.id))
    expect(row!.v).toBe('اقتباس')
  })
})
