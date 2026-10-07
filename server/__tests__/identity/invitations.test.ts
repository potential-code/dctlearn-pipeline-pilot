import { beforeEach, describe, expect, test } from 'bun:test'
import { db } from '@server/db/connection'
import { auditLog, invitations } from '@server/db/schema/identity'
import { E } from '@server/db/seed/data'
import { runSchedule } from '@server/jobs/runtime'
import { setNow } from '@server/lib/clock'
import { InvitationView } from '@shared/schemas/identity'
import { eq } from 'drizzle-orm'
import { freshBase, userByEmail } from '../helpers/fixtures'
import { anon, as } from '../helpers/http'
import { lastMailTo, tokenFromUrl } from '../helpers/mail'

beforeEach(async () => {
  await freshBase()
})

async function inviteToElevate(emails: string[], role: 'learner' | 'judge' = 'learner') {
  const layla = await as(E.layla!)
  const res = await layla
    .post('/api/microsites/elevate/admin/invitations')
    .send({ emails, role, message: 'Welcome!' })
  expect(res.status).toBe(201)
  return res.body
}

describe('P11 invitation lifecycle', () => {
  test('invite → e-mail → view → accept → signed in member of elevate', async () => {
    const result = await inviteToElevate(['New.Member@dctlearn.example', 'bad-email', E.saeed!])
    expect(result.created).toBe(1)
    expect(result.skipped).toEqual([
      { email: 'bad-email', reason: 'invalid_email' },
      { email: E.saeed, reason: 'already_member' },
    ])
    const mail = await lastMailTo('new.member@dctlearn.example', 'invitation')
    expect(mail).toBeDefined()
    const token = tokenFromUrl(String(mail!.data.url))

    const view = await anon().get(`/api/public/invitations/${token}`)
    expect(view.status).toBe(200)
    InvitationView.parse(view.body)
    expect(view.body).toMatchObject({
      valid: true,
      email: 'new.member@dctlearn.example',
      role: 'learner',
      microsite: { id: 'elevate' },
    })

    const c = anon()
    const accept = await c
      .post(`/api/public/invitations/${token}/accept`)
      .send({ name: 'New Member', password: 'Welcome2026!!', locale: 'ar' })
    expect(accept.status).toBe(201)
    expect(accept.body.defaultRoute).toBe('/elevate/dashboard')
    const me = await c.get('/api/me')
    expect(me.status).toBe(200)
    expect(me.body.user).toMatchObject({ role: 'learner', locale: 'ar' })

    const again = await anon()
      .post(`/api/public/invitations/${token}/accept`)
      .send({ name: 'X', password: 'Welcome2026!!' })
    expect(again.status).toBe(410)
    expect(again.body.error.code).toBe('invitation_invalid')
    const audits = await db.select().from(auditLog).where(eq(auditLog.action, 'invitation.accept'))
    expect(audits).toHaveLength(1)
  })

  test('unknown token → 410; expired → valid:false and accept 410', async () => {
    expect((await anon().get('/api/public/invitations/this-token-does-not-exist-xx')).status).toBe(
      410,
    )
    await inviteToElevate(['late@example.com'])
    const token = tokenFromUrl(String((await lastMailTo('late@example.com'))!.data.url))
    setNow('2026-10-30T00:00:00Z')
    expect((await anon().get(`/api/public/invitations/${token}`)).body.valid).toBe(false)
    expect(
      (
        await anon()
          .post(`/api/public/invitations/${token}/accept`)
          .send({ name: 'Late', password: 'Welcome2026!!' })
      ).status,
    ).toBe(410)
    await runSchedule('invitations.expire')
    const [row] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.email, 'late@example.com'))
    expect(row!.status).toBe('expired')
  })

  test('existing learner invited as judge: current password required, role upgraded and audited', async () => {
    await inviteToElevate([E.mona!], 'judge')
    const token = tokenFromUrl(String((await lastMailTo(E.mona!, 'invitation'))!.data.url))
    const wrong = await anon()
      .post(`/api/public/invitations/${token}/accept`)
      .send({ name: 'Mona', password: 'not-her-password' })
    expect(wrong.status).toBe(422)
    const ok = await anon()
      .post(`/api/public/invitations/${token}/accept`)
      .send({ name: 'Mona', password: 'Dct!2026demo' })
    expect(ok.status).toBe(201)
    expect(ok.body.defaultRoute).toBe('/judge')
    expect((await userByEmail(E.mona!)).role).toBe('judge')
    const upgrade = await db.select().from(auditLog).where(eq(auditLog.action, 'user.role_upgrade'))
    expect(upgrade).toHaveLength(1)
  })

  test('mentor cannot be invited as learner (role conflict)', async () => {
    const r = await inviteToElevate([E.hessa!])
    expect(r.skipped).toEqual([{ email: E.hessa, reason: 'role_conflict' }])
  })

  test('resend creates a new token and kills the old one; revoke only from sent', async () => {
    await inviteToElevate(['twice@example.com'])
    const oldToken = tokenFromUrl(String((await lastMailTo('twice@example.com'))!.data.url))
    const layla = await as(E.layla!)
    const list = await layla.get('/api/microsites/elevate/admin/invitations?status=sent')
    const id = list.body.items.find((i: { email: string }) => i.email === 'twice@example.com').id
    expect(
      (await layla.post(`/api/microsites/elevate/admin/invitations/${id}/resend`)).status,
    ).toBe(200)
    const newToken = tokenFromUrl(String((await lastMailTo('twice@example.com'))!.data.url))
    expect(newToken).not.toBe(oldToken)
    expect((await anon().get(`/api/public/invitations/${oldToken}`)).body.valid).toBe(false)
    expect(
      (await layla.post(`/api/microsites/elevate/admin/invitations/${id}/revoke`)).status,
    ).toBe(409)
    // Another microsite's sub admin cannot touch it.
    const omar = await as(E.omar!)
    expect((await omar.post(`/api/microsites/elevate/admin/invitations/${id}/resend`)).status).toBe(
      403,
    )
  })
})

describe('P08 registration and P07 sign-up', () => {
  test('employee registration: domain enforced; membership employees; verification mail', async () => {
    const bad = await anon().post('/api/public/register/employee').send({
      fullName: 'Out Sider',
      email: 'out@gmail.com',
      password: 'Welcome2026!!',
      level: 'Specialist',
      timeAtDct: 'lt6m',
    })
    expect(bad.status).toBe(422)
    const ok = await anon().post('/api/public/register/employee').send({
      fullName: 'New Hire',
      email: 'new.hire@dctabudhabi.ae',
      password: 'Welcome2026!!',
      level: 'Specialist',
      timeAtDct: 'lt6m',
      role: 'admin',
    })
    expect(ok.status).toBe(201)
    expect(ok.body.verificationSent).toBe(true)
    const user = await userByEmail('new.hire@dctabudhabi.ae')
    expect(user.role).toBe('learner')
    expect(user.emailVerified).toBe(false)
    expect(await lastMailTo('new.hire@dctabudhabi.ae', 'verify-email')).toBeDefined()
    // Cannot sign in before verifying.
    const signIn = await anon()
      .post('/api/auth/sign-in/email')
      .send({ email: 'new.hire@dctabudhabi.ae', password: 'Welcome2026!!' })
    expect(signIn.status).toBe(403)
  })

  test('open microsite sign-up works; invite-only and unknown microsites refuse', async () => {
    const open = await anon().post('/api/auth/sign-up/email').send({
      name: 'Forum Guest',
      email: 'guest@example.com',
      password: 'Welcome2026!!',
      microsite: 'chkforum',
    })
    expect(open.status).toBe(200)
    const closed = await anon().post('/api/auth/sign-up/email').send({
      name: 'Sneaky',
      email: 'sneaky@example.com',
      password: 'Welcome2026!!',
      microsite: 'znm',
    })
    expect(closed.status).toBe(403)
    const none = await anon()
      .post('/api/auth/sign-up/email')
      .send({ name: 'Sneaky', email: 'sneaky2@example.com', password: 'Welcome2026!!' })
    expect(none.status).toBe(403)
  })

  test('password-token tells reset from invite', async () => {
    await inviteToElevate(['pt@example.com'])
    const token = tokenFromUrl(String((await lastMailTo('pt@example.com'))!.data.url))
    expect((await anon().get(`/api/public/password-token/${token}`)).body).toEqual({
      valid: true,
      purpose: 'invite',
      email: 'pt@example.com',
    })
    expect((await anon().get('/api/public/password-token/aaaaaaaaaaaaaaaaaaaaaaaa')).body).toEqual({
      valid: false,
      purpose: 'reset',
    })
  })
})
