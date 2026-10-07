import { beforeEach, describe, expect, test } from 'bun:test'
import { db } from '@server/db/connection'
import { courseCertificates } from '@server/db/schema/catalog'
import { files } from '@server/db/schema/files'
import {
  accounts,
  auditLog,
  dataRequests,
  sessions,
  userProfiles,
  users,
} from '@server/db/schema/identity'
import type { BaseSeed } from '@server/db/seed/fixtures'
import { drainJobs, runSchedule } from '@server/jobs/runtime'
import { setNow } from '@server/lib/clock'
import { AnonymiseResult, DataRequestAccepted } from '@shared/schemas/platform'
import { and, eq } from 'drizzle-orm'
import { expectDenied } from '../helpers/denials'
import { anon, as, PASSWORD } from '../helpers/http'
import { lastMailTo } from '../helpers/mail'
import { app, NOT_ADMIN, seedAnalytics } from './helpers'
import { freshPlatformBase } from './schema-fix'

const ADMIN = 'aisha.admin@dctlearn.example'
const SAEED = 'saeed.h@dctlearn.example'
const MONA = 'mona.a@dctlearn.example'
let base: BaseSeed

beforeEach(async () => {
  base = await freshPlatformBase()
  await seedAnalytics(base)
})

describe('§9.7 data export', () => {
  test('202 → job builds own JSON, e-mails link; only the owner downloads, within 24 h', async () => {
    const s = await as(SAEED, app)
    const res = await s.get('/api/me/export')
    expect(res.status).toBe(202)
    const req = DataRequestAccepted.parse(res.body)
    expect(req).toMatchObject({ kind: 'export', status: 'requested' })
    // A second click reuses the open request (one job).
    expect((await s.get('/api/me/export')).body.id).toBe(req.id)
    // Not ready yet.
    expect((await s.get(`/api/me/exports/${req.id}`)).status).toBe(409)

    const mail = await lastMailTo(SAEED, 'data-export')
    expect(mail).toBeDefined()
    expect(mail!.data.url).toEndWith(`/api/me/exports/${req.id}`)

    const dl = await s.get(`/api/me/exports/${req.id}`)
    expect(dl.status).toBe(200)
    expect(dl.headers['content-type']).toStartWith('application/json')
    const data = JSON.parse(dl.text)
    expect(data.account.email).toBe(SAEED)
    expect(data.memberships.map((m: { microsite: string }) => m.microsite)).toEqual([
      'elevate',
      'employees',
    ])
    expect(data.certificates).toHaveLength(2)
    expect(data.enrolments.length).toBeGreaterThan(0)
    expect(data.profile.firstName).toBe('Saeed')
    expect(JSON.stringify(data)).not.toContain(MONA)

    // Other users (even admins) cannot open it: 404, not 403.
    expect((await (await as(MONA, app)).get(`/api/me/exports/${req.id}`)).status).toBe(404)
    expect((await (await as(ADMIN, app)).get(`/api/me/exports/${req.id}`)).status).toBe(404)
    expect((await anon(app).get(`/api/me/exports/${req.id}`)).status).toBe(401)
    // The link lapses after 24 h.
    setNow('2026-10-07T09:30:00Z')
    expect((await s.get(`/api/me/exports/${req.id}`)).status).toBe(404)
  })

  test('cleanup removes data exports after 24 h', async () => {
    const s = await as(SAEED, app)
    const id = (await s.get('/api/me/export')).body.id
    await drainJobs()
    await db
      .update(files)
      .set({ createdAt: new Date('2026-10-04T00:00:00Z') })
      .where(eq(files.category, 'data-export'))
    const result = (await runSchedule('platform.cleanup')) as { dataExportsRemoved: number }
    expect(result.dataExportsRemoved).toBe(1)
    const [r] = await db.select().from(dataRequests).where(eq(dataRequests.id, id))
    expect(r!.fileKey).toBeNull()
  })

  test('signed out → 401', async () => {
    await expectDenied(app, (c) => c.get('/api/me/export'), { signedOut: null })
    await expectDenied(app, (c) => c.post('/api/me/delete-request'), { signedOut: null })
  })
})

describe('§9.7 deletion', () => {
  test('request sets deleteRequestedAt; admin anonymises in place', async () => {
    const mona = base.users.mona!.id
    const m = await as(MONA, app)
    const res = await m.post('/api/me/delete-request')
    expect(res.status).toBe(202)
    const req = DataRequestAccepted.parse(res.body)
    expect(req.kind).toBe('delete')
    expect((await m.post('/api/me/delete-request')).body.id).toBe(req.id)
    const [before] = await db.select().from(users).where(eq(users.id, mona))
    expect(before!.deleteRequestedAt?.toISOString()).toBe('2026-10-06T09:00:00.000Z')
    // Mona exported her data earlier: that file goes too.
    await m.get('/api/me/export')
    await drainJobs()
    const auditBefore = await db.select().from(auditLog).where(eq(auditLog.targetId, mona))

    const a = await as(ADMIN, app)
    const out = await a.post(`/api/admin/users/${mona}/anonymise`)
    expect(out.status).toBe(200)
    expect(AnonymiseResult.parse(out.body).id).toBe(mona)

    const [u] = await db.select().from(users).where(eq(users.id, mona))
    expect(u!.name).toBe('Deleted user')
    expect(u!.email).toMatch(/^deleted\+[0-9a-f]{40}@anonymised\.invalid$/)
    expect(u!.status).toBe('disabled')
    expect(u!.anonymisedAt).not.toBeNull()
    const [p] = await db.select().from(userProfiles).where(eq(userProfiles.userId, mona))
    expect([p!.firstName, p!.lastName, p!.mobile]).toEqual(['', '', ''])
    expect(await db.select().from(sessions).where(eq(sessions.userId, mona))).toHaveLength(0)
    expect(await db.select().from(accounts).where(eq(accounts.userId, mona))).toHaveLength(0)
    expect(await db.select().from(files).where(eq(files.category, 'data-export'))).toHaveLength(0)
    const [delReq] = await db
      .select()
      .from(dataRequests)
      .where(and(eq(dataRequests.userId, mona), eq(dataRequests.kind, 'delete')))
    expect(delReq).toMatchObject({ status: 'done', decidedById: base.users.aisha!.id })

    // Audit entries are kept, plus one for the anonymisation.
    const auditAfter = await db.select().from(auditLog).where(eq(auditLog.targetId, mona))
    expect(auditAfter.length).toBe(auditBefore.length + 1)
    expect(auditAfter.map((x) => x.action)).toContain('user.anonymise')
    expect(JSON.stringify(auditAfter.find((x) => x.action === 'user.anonymise'))).not.toContain(
      MONA,
    )
    // The old session is gone and the old password no longer works.
    expect((await m.get('/api/me')).status).toBe(401)
    const signIn = await anon(app)
      .post('/api/auth/sign-in/email')
      .send({ email: MONA, password: PASSWORD })
    expect(signIn.status).not.toBe(200)
    // Twice → 409.
    expect((await a.post(`/api/admin/users/${mona}/anonymise`)).status).toBe(409)
  })

  test('certificates keep their serial but drop the name', async () => {
    const saeed = base.users.saeed!.id
    await (await as(SAEED, app)).post('/api/me/delete-request')
    const before = await db
      .select()
      .from(courseCertificates)
      .where(eq(courseCertificates.userId, saeed))
    await (await as(ADMIN, app)).post(`/api/admin/users/${saeed}/anonymise`)
    const after = await db
      .select()
      .from(courseCertificates)
      .where(eq(courseCertificates.userId, saeed))
    expect(after.map((c) => c.serial).sort()).toEqual(before.map((c) => c.serial).sort())
    expect(after.every((c) => c.learnerName === '')).toBe(true)
  })

  test('without a request 409; unknown 404; own account 409; non-admins denied', async () => {
    const a = await as(ADMIN, app)
    const reem = base.users.reem!.id
    const res = await a.post(`/api/admin/users/${reem}/anonymise`)
    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('conflict')
    expect(
      (await a.post('/api/admin/users/00000000-0000-4000-8000-000000000000/anonymise')).status,
    ).toBe(404)
    await a.post('/api/me/delete-request')
    expect((await a.post(`/api/admin/users/${base.users.aisha!.id}/anonymise`)).status).toBe(409)
    await expectDenied(app, (c) => c.post(`/api/admin/users/${reem}/anonymise`), NOT_ADMIN)
  })
})
