import { beforeEach, describe, expect, test } from 'bun:test'
import { app } from '@server/app'
import { E } from '@server/db/seed/data'
import { AdminUserDetail, AdminUsersPage, AuditPage } from '@shared/schemas/admin-users'
import { expectDenied } from '../helpers/denials'
import { freshBase, sessionsOf, userByEmail } from '../helpers/fixtures'
import { as } from '../helpers/http'
import { lastMailTo } from '../helpers/mail'

beforeEach(async () => {
  await freshBase()
})

describe('P47 users & roles', () => {
  test('list with filters; detail with full profile', async () => {
    const a = await as(E.aisha!)
    const list = await a.get('/api/admin/users?microsite=znm')
    AdminUsersPage.parse(list.body)
    expect(list.body.items.map((u: { email: string }) => u.email).sort()).toEqual(
      [E.reem, E.yousef].sort(),
    )
    const mentors = await a.get('/api/admin/users?role=mentor')
    expect(mentors.body.total).toBe(4)
    const saeed = await userByEmail(E.saeed!)
    const detail = await a.get(`/api/admin/users/${saeed.id}`)
    AdminUserDetail.parse(detail.body)
    expect(detail.body.microsites).toEqual(['elevate', 'employees'])
    await expectDenied(app, (c) => c.get('/api/admin/users'), {
      signedOut: null,
      learner: E.saeed!,
      subAdmin: E.omar!,
      judge: E.noura!,
    })
  })

  test('disable ends sessions; memberships synced; all audited; cannot demote self', async () => {
    const a = await as(E.aisha!)
    const mona = await userByEmail(E.mona!)
    const monaClient = await as(E.mona!)
    const res = await a
      .put(`/api/admin/users/${mona.id}`)
      .send({ status: 'disabled', microsites: ['employees', 'znm'] })
    expect(res.status).toBe(200)
    expect(res.body.microsites).toEqual(['employees', 'znm'])
    expect(await sessionsOf(mona.id)).toHaveLength(0)
    expect((await monaClient.get('/api/me')).status).toBe(401)
    const aisha = await userByEmail(E.aisha!)
    expect((await a.put(`/api/admin/users/${aisha.id}`).send({ role: 'learner' })).status).toBe(409)
    const audit = await a.get('/api/admin/audit?action=user.')
    AuditPage.parse(audit.body)
    expect(audit.body.items.map((i: { action: string }) => i.action)).toContain('user.status')
  })

  test('reset password sends the set-password e-mail', async () => {
    const a = await as(E.aisha!)
    const mona = await userByEmail(E.mona!)
    expect((await a.post(`/api/admin/users/${mona.id}/reset-password`)).status).toBe(204)
    expect(await lastMailTo(E.mona!, 'set-password')).toBeDefined()
  })

  test('CSV import: preview → confirm creates, updates, skips', async () => {
    const a = await as(E.aisha!)
    const csv = [
      'email,first_name,last_name,employee_id,position,sector,department,hire_date,microsites,role',
      'fresh@dctabudhabi.ae,Fresh,Face,E9,Analyst,Culture,Heritage,2026-01-10,employees;znm,learner',
      `${E.mona},Mona,Al Ameri,E1,Head,Support,Ops,2020-02-01,employees,`,
      'bad,X,Y,,,,,,employees,',
      'z@example.com,Z,Z,,,,,,unknown-site,',
    ].join('\n')
    const preview = await a
      .post('/api/admin/users/import')
      .attach('file', Buffer.from(csv), { filename: 'u.csv', contentType: 'text/csv' })
    expect(preview.status).toBe(200)
    expect(preview.body.preview.map((p: { action: string }) => p.action)).toEqual([
      'create',
      'update',
      'skip',
      'skip',
    ])
    const confirm = await a
      .post('/api/admin/users/import/confirm')
      .send({ token: preview.body.token, sendWelcome: true })
    expect(confirm.body).toEqual({ created: 1, updated: 1, skipped: 2 })
    const fresh = await userByEmail('fresh@dctabudhabi.ae')
    expect(fresh.mustSetPassword).toBe(true)
    expect(await lastMailTo('fresh@dctabudhabi.ae', 'set-password')).toBeDefined()
    expect((await a.get('/api/admin/users/import/sample.csv')).text).toStartWith('email,first_name')
  })
})
