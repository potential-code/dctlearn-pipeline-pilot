import { beforeEach, describe, expect, test } from 'bun:test'
import { app } from '@server/app'
import { db } from '@server/db/connection'
import { enrolments } from '@server/db/schema/catalog'
import { E } from '@server/db/seed/data'
import type { BaseSeed } from '@server/db/seed/fixtures'
import { drainJobs } from '@server/jobs/runtime'
import { AdminMicrositeDetail, AdminMicrositeList } from '@shared/schemas/microsites'
import { and, eq } from 'drizzle-orm'
import { expectDenied } from '../helpers/denials'
import { freshBase, userByEmail } from '../helpers/fixtures'
import { as } from '../helpers/http'
import { lastMailTo } from '../helpers/mail'

let seed: BaseSeed
beforeEach(async () => {
  seed = await freshBase()
})

const body = (id: string, courseIds: string[] = []) => ({
  id,
  name: { en: 'Alumni', ar: 'الخريجون' },
  templateId: 'standard',
  branding: { logo: '', accentColor: '#123456', hero: '' },
  signInMode: 'invite_only',
  landingOnly: false,
  courseIds,
  mandatoryCourseIds: [],
  tabs: [{ key: 'courses', enabled: true, label: { en: 'Courses', ar: 'الدورات' } }],
})

describe('P50 / P36 microsites', () => {
  test('list, create (draft), duplicate id 409, admin only', async () => {
    const a = await as(E.aisha!)
    const list = await a.get('/api/admin/microsites')
    AdminMicrositeList.parse(list.body)
    expect(list.body).toHaveLength(9)
    const created = await a
      .post('/api/admin/microsites')
      .send(body('alumni', [seed.courses.C01!.id]))
    expect(created.status).toBe(201)
    expect((await a.post('/api/admin/microsites').send(body('alumni'))).status).toBe(409)
    const detail = await a.get('/api/admin/microsites/alumni')
    AdminMicrositeDetail.parse(detail.body)
    expect(detail.body.status).toBe('draft')
    await expectDenied(app, (c) => c.get('/api/admin/microsites'), {
      signedOut: null,
      learner: E.saeed!,
      subAdmin: E.omar!,
      mentor: E.hessa!,
    })
  })

  test('draft → live needs a published landing; illegal moves 409', async () => {
    const a = await as(E.aisha!)
    await a.post('/api/admin/microsites').send(body('alumni'))
    expect(
      (await a.post('/api/admin/microsites/alumni/status').send({ status: 'live' })).status,
    ).toBe(409)
    expect((await a.post('/api/microsites/alumni/admin/landing/publish')).status).toBe(200)
    expect(
      (await a.post('/api/admin/microsites/alumni/status').send({ status: 'live' })).status,
    ).toBe(200)
    expect(
      (await a.post('/api/admin/microsites/alumni/status').send({ status: 'draft' })).status,
    ).toBe(409)
    expect(
      (await a.post('/api/admin/microsites/alumni/status').send({ status: 'archived' })).status,
    ).toBe(200)
  })

  test('adding a course enrols existing members (job); ifMatch conflict', async () => {
    const a = await as(E.aisha!)
    const detail = (await a.get('/api/admin/microsites/zu')).body
    const update = {
      ...body('zu', [...detail.courseIds, seed.courses.C04!.id]),
      name: detail.name,
      ifMatch: detail.updatedAt,
    }
    const { id: _id, ...rest } = update
    const res = await a.put('/api/admin/microsites/zu').send(rest)
    expect(res.status).toBe(200)
    await drainJobs()
    const ahmed = await userByEmail(E.ahmed!)
    const rows = await db
      .select()
      .from(enrolments)
      .where(and(eq(enrolments.userId, ahmed.id), eq(enrolments.courseId, seed.courses.C04!.id)))
    expect(rows).toHaveLength(1)
    expect((await a.put('/api/admin/microsites/zu').send(rest)).status).toBe(409)
  })

  test('sub admin by e-mail: unknown address gets a sub_admin invitation', async () => {
    const a = await as(E.aisha!)
    await a
      .post('/api/admin/microsites')
      .send({ ...body('alumni'), subAdminEmail: 'lead@example.com' })
    const mail = await lastMailTo('lead@example.com', 'invitation')
    expect(mail?.data.roleLabel).toBe('a microsite admin')
  })
})

describe('microsite requests', () => {
  test('sub admin requests; admin approves → draft microsite owned by requester', async () => {
    const layla = await as(E.layla!)
    const req = await layla
      .post('/api/microsite-requests')
      .send({ name: 'Elevate Alumni', purpose: 'keep 2025 cohort engaged' })
    expect(req.status).toBe(201)
    expect(
      (
        await (
          await as(E.saeed!)
        )
          .post('/api/microsite-requests')
          .send({ name: 'x', purpose: 'yy' })
      ).status,
    ).toBe(403)
    const a = await as(E.aisha!)
    const list = await a.get('/api/admin/microsite-requests')
    expect(list.body[0]).toMatchObject({ name: 'Elevate Alumni', status: 'requested' })
    const approved = await a.post(`/api/admin/microsite-requests/${req.body.id}/approve`)
    expect(approved.status).toBe(201)
    expect(approved.body.micrositeId).toBe('elevate-alumni')
    expect(
      (await a.post(`/api/admin/microsite-requests/${req.body.id}/reject`).send({ note: 'x' }))
        .status,
    ).toBe(409)
    expect((await layla.get('/api/microsites/elevate-alumni/admin/dashboard')).status).toBe(200)
  })
})
