import { beforeAll, describe, expect, test } from 'bun:test'
import { db } from '@server/db/connection'
import { courses, enrolments, pointsLedger } from '@server/db/schema/catalog'
import { auditLog } from '@server/db/schema/identity'
import { E } from '@server/db/seed/data'
import {
  AwardCreated,
  BadgeDto,
  BadgeList,
  ExternalCertDecision,
  ExternalCertsPage,
  PointsAdjusted,
  PointsPage,
} from '@shared/schemas/achievements'
import { AdminUserDetail } from '@shared/schemas/admin-users'
import { and, eq } from 'drizzle-orm'
import { expectDenied } from '../helpers/denials'
import { userByEmail } from '../helpers/fixtures'
import { as } from '../helpers/http'
import { lastMailTo } from '../helpers/mail'
import { app, freshLearning, type LearningSeed, PDF_BYTES } from './helpers'

let seed: LearningSeed
beforeAll(async () => {
  seed = await freshLearning()
}, 120_000)

const deniedNonAdmins = { signedOut: null, learner: E.saeed!, subAdmin: E.omar!, mentor: E.hessa! }

describe('P58 badges', () => {
  test('list, create, duplicate 409, invalid 422, update, delete (soft), admin only', async () => {
    const a = await as(E.aisha!, app)
    const list = await a.get('/api/admin/badges')
    BadgeList.parse(list.body)
    expect(list.body).toHaveLength(4)
    const body = {
      key: 'museum-lover',
      name: { en: 'Museum lover', ar: 'محب المتاحف' },
      description: { en: 'Three museum courses', ar: '' },
      imageUrl: '',
      rule: 'courses_completed',
      threshold: 3,
    }
    const created = await a.post('/api/admin/badges').send(body)
    expect(created.status).toBe(201)
    BadgeDto.parse(created.body)
    expect((await a.post('/api/admin/badges').send(body)).status).toBe(409)
    expect(
      (await a.post('/api/admin/badges').send({ ...body, key: 'x-y', threshold: undefined }))
        .status,
    ).toBe(422)
    const upd = await a.put('/api/admin/badges/museum-lover').send({ threshold: 2 })
    expect(upd.body.threshold).toBe(2)
    expect((await a.delete('/api/admin/badges/museum-lover')).status).toBe(204)
    expect((await a.get('/api/admin/badges')).body).toHaveLength(4)
    expect((await a.put('/api/admin/badges/museum-lover').send({ threshold: 2 })).status).toBe(404)
    await expectDenied(app, (c) => c.get('/api/admin/badges'), deniedNonAdmins)
  })

  test('manual award: 201 once, 409 again; rule badge 409; unknown user 404; audited', async () => {
    const a = await as(E.aisha!, app)
    const mona = await userByEmail(E.mona!)
    const res = await a.post('/api/admin/badges/dct-champion/award').send({ userId: mona.id })
    expect(res.status).toBe(201)
    AwardCreated.parse(res.body)
    expect(
      (await a.post('/api/admin/badges/dct-champion/award').send({ userId: mona.id })).status,
    ).toBe(409)
    expect(
      (await a.post('/api/admin/badges/first-course/award').send({ userId: mona.id })).status,
    ).toBe(409)
    expect(
      (await a.post('/api/admin/badges/dct-champion/award').send({ userId: crypto.randomUUID() }))
        .status,
    ).toBe(404)
    expect(
      (await a.post('/api/admin/badges/dct-champion/award').send({ userId: 'x' })).status,
    ).toBe(422)
    const audit = await db.select().from(auditLog).where(eq(auditLog.action, 'badge.award'))
    expect(audit).toHaveLength(1)
    const ach = await (await as(E.mona!, app)).get('/api/microsites/employees/achievements')
    expect(
      ach.body.badges.find((b: { key: string }) => b.key === 'dct-champion').earnedAt,
    ).toBeString()
  })
})

describe('P58 points', () => {
  test('ledger list with filters', async () => {
    const a = await as(E.aisha!, app)
    const saeed = await userByEmail(E.saeed!)
    const res = await a.get(`/api/admin/points?userId=${saeed.id}&pageSize=100`)
    PointsPage.parse(res.body)
    expect(res.body.items.reduce((s: number, i: { points: number }) => s + i.points, 0)).toBe(280)
    const manual = await a.get('/api/admin/points?source=manual&pageSize=100')
    expect(manual.body.total).toBe(8)
    const zu = await a.get('/api/admin/points?microsite=zu&pageSize=100')
    const names = new Set(zu.body.items.map((i: { user: { name: string } }) => i.user.name))
    expect([...names].sort()).toEqual(['Ahmed Khan', 'Sara Haddad'])
    expect((await a.get('/api/admin/points?source=bogus')).status).toBe(422)
    await expectDenied(app, (c) => c.get('/api/admin/points'), deniedNonAdmins)
  })

  test('adjust ±: 201, shows in the learner total, audited; 0 or missing reason 422', async () => {
    const a = await as(E.aisha!, app)
    const mona = await userByEmail(E.mona!)
    const res = await a
      .post('/api/admin/points/adjust')
      .send({ userId: mona.id, points: 25, reason: 'Workshop host' })
    expect(res.status).toBe(201)
    PointsAdjusted.parse(res.body)
    const ach = await (await as(E.mona!, app)).get('/api/microsites/employees/achievements')
    expect(ach.body.points.total).toBe(65)
    expect(ach.body.ledger[0].reason.en).toBe('Workshop host')
    expect(
      (await a.post('/api/admin/points/adjust').send({ userId: mona.id, points: 0, reason: 'x' }))
        .status,
    ).toBe(422)
    expect(
      (await a.post('/api/admin/points/adjust').send({ userId: mona.id, points: 5 })).status,
    ).toBe(422)
    expect(
      (
        await a
          .post('/api/admin/points/adjust')
          .send({ userId: crypto.randomUUID(), points: 5, reason: 'x' })
      ).status,
    ).toBe(404)
    const audit = await db.select().from(auditLog).where(eq(auditLog.action, 'points.adjust'))
    expect(audit).toHaveLength(1)
    await expectDenied(
      app,
      (c) => c.post('/api/admin/points/adjust').send({ userId: mona.id, points: 5, reason: 'x' }),
      deniedNonAdmins,
    )
  })

  test('PUT course points writes courses.pointsConfig (audited); invalid 422', async () => {
    const a = await as(E.aisha!, app)
    const id = seed.courses.C08!.id
    const res = await a
      .put(`/api/admin/courses/${id}/points`)
      .send({ unit: 15, module: 5, course: 80, assessmentPass: 25 })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ unit: 15, module: 5, course: 80, assessmentPass: 25 })
    const [c] = await db.select().from(courses).where(eq(courses.id, id))
    expect(c!.pointsConfig.unit).toBe(15)
    expect(
      (
        await a
          .put(`/api/admin/courses/${id}/points`)
          .send({ unit: -1, module: 0, course: 0, assessmentPass: 0 })
      ).status,
    ).toBe(422)
    // New config applies to new completions: Mona completes C08 unit 1 → 15 points.
    const c08 = seed.learning.content.C08!
    const mona = await as(E.mona!, app)
    for (const b of c08.blocks[0]!)
      await mona.post(`/api/units/${c08.units[0]}/blocks/${b}/progress`).send({ completed: true })
    expect((await mona.post(`/api/units/${c08.units[0]}/complete`)).body.pointsAwarded).toBe(15)
  })
})

describe('P58 external certificates', () => {
  test('queue: pending only by filter; approve completes the course once; e-mail; 409 twice', async () => {
    const a = await as(E.aisha!, app)
    const res = await a.get('/api/admin/external-certificates?status=pending')
    ExternalCertsPage.parse(res.body)
    expect(res.body.total).toBe(1)
    expect(res.body.items[0]).toMatchObject({
      microsite: 'nibras',
      status: 'pending',
      user: { email: E.hamad },
    })
    const id = seed.learning.externalCertificates.hamadC19!
    const ok = await a.post(`/api/admin/external-certificates/${id}/approve`)
    expect(ok.status).toBe(200)
    ExternalCertDecision.parse(ok.body)
    expect(ok.body.status).toBe('approved')
    const hamad = await userByEmail(E.hamad!)
    const [e] = await db
      .select()
      .from(enrolments)
      .where(and(eq(enrolments.userId, hamad.id), eq(enrolments.courseId, seed.courses.C19!.id)))
    expect(e).toMatchObject({ state: 'completed', progressPct: 100 })
    const pts = await db
      .select()
      .from(pointsLedger)
      .where(
        and(
          eq(pointsLedger.userId, hamad.id),
          eq(pointsLedger.sourceType, 'course'),
          eq(pointsLedger.sourceId, seed.courses.C19!.id),
        ),
      )
    expect(pts).toHaveLength(1)
    expect((await lastMailTo(E.hamad!, 'external-cert-approved'))?.text).toContain('Ethics of AI')
    expect((await a.post(`/api/admin/external-certificates/${id}/approve`)).status).toBe(409)
    expect(
      (await a.post(`/api/admin/external-certificates/${crypto.randomUUID()}/approve`)).status,
    ).toBe(404)
    const audit = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.action, 'external_certificate.approve'))
    expect(audit).toHaveLength(1)
  })

  test('reject needs a note; learner is told; re-upload goes back to pending', async () => {
    const hamad = await as(E.hamad!, app)
    const up = await hamad
      .post('/api/microsites/nibras/external-certificates')
      .field('courseId', seed.courses.C20!.id)
      .attach('file', PDF_BYTES, { filename: 'c.pdf', contentType: 'application/pdf' })
    const a = await as(E.aisha!, app)
    expect(
      (await a.post(`/api/admin/external-certificates/${up.body.id}/reject`).send({})).status,
    ).toBe(422)
    const rej = await a
      .post(`/api/admin/external-certificates/${up.body.id}/reject`)
      .send({ note: 'The name on the certificate does not match' })
    expect(rej.body.status).toBe('rejected')
    expect((await lastMailTo(E.hamad!, 'external-cert-rejected'))?.text).toContain('does not match')
    const again = await hamad
      .post('/api/microsites/nibras/external-certificates')
      .field('courseId', seed.courses.C20!.id)
      .attach('file', PDF_BYTES, { filename: 'c2.pdf', contentType: 'application/pdf' })
    expect(again.status).toBe(201)
    expect(again.body.id).toBe(up.body.id)
    expect(again.body.status).toBe('pending')
    await expectDenied(app, (c) => c.get('/api/admin/external-certificates'), deniedNonAdmins)
  })

  test('P47 user detail carries the externalCertificates section', async () => {
    const hamad = await userByEmail(E.hamad!)
    const res = await (await as(E.aisha!, app)).get(`/api/admin/users/${hamad.id}`)
    expect(res.status).toBe(200)
    AdminUserDetail.parse(res.body)
    expect(res.body.externalCertificates.length).toBe(3)
  })
})
