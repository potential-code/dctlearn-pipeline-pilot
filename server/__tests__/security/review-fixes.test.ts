import { beforeAll, describe, expect, test } from 'bun:test'
import { app } from '@server/app'
import { db } from '@server/db/connection'
import { auditLog, invitations } from '@server/db/schema/identity'
import { courseAssessments } from '@server/db/schema/learning'
import { E } from '@server/db/seed/data'
import type { BaseSeed } from '@server/db/seed/fixtures'
import { type SeededLearning, seedLearning } from '@server/db/seed/slices/learning.seed'
import { type SeededMentoring, seedMentoring } from '@server/db/seed/slices/mentoring.seed'
import { and, eq, like } from 'drizzle-orm'
import { freshBase, userByEmail } from '../helpers/fixtures'
import { anon, as } from '../helpers/http'
import { lastMailTo, tokenFromUrl } from '../helpers/mail'

/** Regression tests for the security review findings (M1–M7, L2, L5, L6). */

let base: BaseSeed
let learning: SeededLearning
let mentoring: SeededMentoring
const PNG = Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000', 'hex')

beforeAll(async () => {
  base = await freshBase()
  learning = await db.transaction((tx) =>
    seedLearning(tx, base.users, base.courses, base.microsites),
  )
  mentoring = await db.transaction((tx) => seedMentoring(tx, base))
})

async function uploadPhotoAs(email: string) {
  const c = await as(email, app)
  const res = await c
    .post('/api/me/photo')
    .attach('file', PNG, { filename: 'p.png', contentType: 'image/png' })
  expect(res.status).toBe(200)
  return new URL(res.body.imageUrl, 'http://x').pathname.split('/').pop()!
}

describe('M1 Better Auth endpoints outside the contract are closed', () => {
  test('update-user and change-password answer 404', async () => {
    const c = await as(E.mona!, app)
    expect((await c.post('/api/auth/update-user').send({ image: 'x', name: 'y' })).status).toBe(404)
    expect(
      (
        await c.post('/api/auth/change-password').send({
          currentPassword: 'Dct!2026demo',
          newPassword: 'Another2026!!',
          revokeOtherSessions: false,
        })
      ).status,
    ).toBe(404)
    expect((await c.get('/api/auth/get-session')).status).toBe(200)
  })
})

describe('M2 file ids from bodies must be the caller’s own images', () => {
  test('mentor photo pointing at another user’s private file → 422', async () => {
    const monaFile = await uploadPhotoAs(E.mona!)
    const hessa = await as(E.hessa!, app)
    const profile = (await hessa.get('/api/mentor/profile')).body
    const res = await hessa.put('/api/mentor/profile').send({
      title: profile.title,
      bio: profile.bio,
      categories: profile.categories,
      linkedinUrl: '',
      photo: monaFile,
    })
    expect(res.status).toBe(422)
    const own = await uploadPhotoAs(E.hessa!)
    const ok = await hessa.put('/api/mentor/profile').send({
      title: profile.title,
      bio: profile.bio,
      categories: profile.categories,
      linkedinUrl: '',
      photo: own,
    })
    expect(ok.status).toBe(200)
    expect(mentoring.mentors.hessa).toBeString()
  })

  test('landing hero pointing at another user’s private file → 422', async () => {
    const monaFile = await uploadPhotoAs(E.mona!)
    const k = await as(E.khalid!, app)
    const res = await k.put('/api/microsites/znm/admin/landing').send({
      hero: { heading: { en: 'x', ar: '' }, subheading: { en: '', ar: '' }, imageUrl: monaFile },
      cta: {
        signedOut: { label: { en: 'a', ar: '' }, url: '/znm/login' },
        signedIn: { label: { en: 'b', ar: '' }, url: '/znm/dashboard' },
      },
      section: { kind: 'none' },
    })
    expect(res.status).toBe(422)
  })
})

describe('M3 / M4 sub-admin invitations cannot take a microsite over', () => {
  test('changing the sub admin revokes the older pending sub-admin invitation', async () => {
    const a = await as(E.aisha!, app)
    const detail = (await a.get('/api/admin/microsites/zu')).body
    const body = {
      name: detail.name,
      templateId: detail.templateId,
      branding: { logo: '', accentColor: detail.accentColor, hero: '' },
      signInMode: detail.signInMode,
      landingOnly: detail.landingOnly,
      courseIds: detail.courseIds,
      mandatoryCourseIds: detail.mandatoryCourseIds,
      tabs: detail.tabs,
      mentoringEnabled: detail.mentoringEnabled,
      competitionEnabled: detail.competitionEnabled,
    }
    expect(
      (
        await a
          .put('/api/admin/microsites/zu')
          .send({ ...body, subAdminEmail: 'first.lead@example.com' })
      ).status,
    ).toBe(200)
    const firstToken = tokenFromUrl(
      String((await lastMailTo('first.lead@example.com', 'invitation'))!.data.url),
    )
    expect(
      (await a.put('/api/admin/microsites/zu').send({ ...body, subAdminEmail: E.omar })).status,
    ).toBe(200)
    const accept = await anon(app)
      .post(`/api/public/invitations/${firstToken}/accept`)
      .send({ name: 'First Lead', password: 'Welcome2026!!' })
    expect(accept.status).toBe(410)
  })

  test('a sub admin cannot re-send a sub_admin invitation', async () => {
    const [inv] = await db
      .select()
      .from(invitations)
      .where(
        and(eq(invitations.role, 'sub_admin'), eq(invitations.email, 'first.lead@example.com')),
      )
    const omar = await as(E.omar!, app)
    expect((await omar.post(`/api/microsites/zu/admin/invitations/${inv!.id}/resend`)).status).toBe(
      404,
    )
  })
})

describe('M5 course-level final assessment stays locked until every unit is complete', () => {
  test('GET and attempts answer 409 locked for a learner part-way through', async () => {
    const finalId = learning.content.C01!.assessments.final!
    await db
      .update(courseAssessments)
      .set({ unitId: null })
      .where(eq(courseAssessments.id, finalId))
    const mona = await as(E.mona!, app)
    expect((await mona.get(`/api/assessments/${finalId}`)).status).toBe(409)
    expect(
      (await mona.post(`/api/assessments/${finalId}/attempts`).send({ answers: [] })).status,
    ).toBe(409)
  })
})

describe('M7 slot queries are always capped', () => {
  test('a far `to` returns quickly with at most 31 days of slots', async () => {
    const saeed = await as(E.saeed!, app)
    const started = Date.now()
    const res = await saeed.get(
      `/api/mentors/${mentoring.mentors.hessa}/slots?to=9999-12-31T00:00:00Z`,
    )
    expect(res.status).toBe(200)
    expect(Date.now() - started).toBeLessThan(5000)
    const last = res.body.slots.at(-1)
    if (last)
      expect(
        new Date(last.startsAt).getTime() - Date.parse('2026-10-06T09:00:00Z'),
      ).toBeLessThanOrEqual(31 * 86_400_000)
  })
})

describe('M6 anonymisation leaves no link back to the e-mail', () => {
  test('audit labels no longer contain the old e-mail', async () => {
    const mona = await userByEmail(E.mona!)
    const c = await as(E.mona!, app)
    expect((await c.post('/api/me/delete-request')).status).toBe(202)
    const a = await as(E.aisha!, app)
    await a.put(`/api/admin/users/${mona.id}`).send({ name: 'Mona A.' })
    expect((await a.post(`/api/admin/users/${mona.id}/anonymise`)).status).toBe(200)
    const left = await db
      .select()
      .from(auditLog)
      .where(like(auditLog.targetLabel, `%${E.mona}%`))
    expect(left).toHaveLength(0)
  })
})

describe('L5 / L6 sub-admin scope', () => {
  test('invite results do not reveal accounts elsewhere', async () => {
    const layla = await as(E.layla!, app)
    const res = await layla
      .post('/api/microsites/elevate/admin/invitations')
      .send({ emails: [E.noura], role: 'learner' })
    expect(res.body.skipped).toEqual([{ email: E.noura, reason: 'not_invitable' }])
  })
})
