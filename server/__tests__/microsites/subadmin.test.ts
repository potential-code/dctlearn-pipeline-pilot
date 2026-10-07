import { beforeEach, describe, expect, test } from 'bun:test'
import { app } from '@server/app'
import { db } from '@server/db/connection'
import { auditLog } from '@server/db/schema/identity'
import { memberships } from '@server/db/schema/microsites'
import { E } from '@server/db/seed/data'
import { MembersPage, SubAdminDashboard } from '@shared/schemas/microsites'
import { eq } from 'drizzle-orm'
import { expectDenied } from '../helpers/denials'
import { freshBase, userByEmail } from '../helpers/fixtures'
import { anon, as } from '../helpers/http'

beforeEach(async () => {
  await freshBase()
})

const landing = (heading: string) => ({
  hero: { heading: { en: heading, ar: '' }, subheading: { en: 'Sub', ar: '' }, imageUrl: '' },
  cta: {
    signedOut: { label: { en: 'Sign in', ar: '' }, url: '/znm/login' },
    signedIn: { label: { en: 'Dashboard', ar: '' }, url: '/znm/dashboard' },
  },
  popup: { kind: 'text', text: { en: '<img src=x onerror=alert(1)>Hi', ar: '' } },
  section: {
    kind: 'custom',
    customHtml: '<p onclick="x()">Hello</p><script>steal()</script><a href="javascript:x">l</a>',
  },
})

describe('P35 landing editor', () => {
  test('draft saved sanitised, published separately, audited', async () => {
    const k = await as(E.khalid!)
    const dash = await k.get('/api/microsites/znm/admin/dashboard')
    expect(dash.status).toBe(200)
    SubAdminDashboard.parse(dash.body)
    expect(dash.body.hasUnpublishedChanges).toBe(false)

    const saved = await k
      .put('/api/microsites/znm/admin/landing')
      .send({ ...landing('New heading'), ifMatch: dash.body.updatedAt })
    expect(saved.status).toBe(200)
    expect(saved.body.landing.section.customHtml).toBe(
      '<p>Hello</p><a rel="noopener noreferrer">l</a>',
    )
    expect(saved.body.landing.popup.text.en).toBe('Hi')
    expect(saved.body.hasUnpublishedChanges).toBe(true)
    // Public still sees the old version.
    expect((await anon().get('/api/public/microsites/znm/landing')).body.hero.heading.en).not.toBe(
      'New heading',
    )

    // Stale ifMatch → 409.
    const stale = await k
      .put('/api/microsites/znm/admin/landing')
      .send({ ...landing('Other'), ifMatch: dash.body.updatedAt })
    expect(stale.status).toBe(409)

    const pub = await k.post('/api/microsites/znm/admin/landing/publish')
    expect(pub.status).toBe(200)
    expect((await anon().get('/api/public/microsites/znm/landing')).body.hero.heading.en).toBe(
      'New heading',
    )
    const audits = await db.select().from(auditLog).where(eq(auditLog.action, 'landing.publish'))
    expect(audits).toHaveLength(1)
  })

  test('https-only links; only own microsite', async () => {
    const k = await as(E.khalid!)
    const bad = {
      ...landing('x'),
      section: {
        kind: 'partners',
        partners: [{ name: 'X', imageUrl: '', url: 'http://insecure.example' }],
      },
    }
    expect((await k.put('/api/microsites/znm/admin/landing').send(bad)).status).toBe(422)
    await expectDenied(app, (c) => c.get('/api/microsites/znm/admin/dashboard'), {
      signedOut: null,
      learnerMember: E.yousef!,
      otherSubAdmin: E.omar!,
      mentor: E.hessa!,
    })
    expect((await (await as(E.aisha!)).get('/api/microsites/znm/admin/dashboard')).status).toBe(200)
  })
})

describe('P40 members', () => {
  test('list shows only allowed fields; search; remove keeps progress', async () => {
    const k = await as(E.khalid!)
    const res = await k.get('/api/microsites/znm/admin/members?q=reem')
    expect(res.status).toBe(200)
    MembersPage.parse(res.body)
    expect(res.body.total).toBe(1)
    expect(Object.keys(res.body.items[0]).sort()).toEqual(
      ['email', 'joinedAt', 'lastSignInAt', 'name', 'progressPct', 'status', 'userId'].filter(
        (k) => k !== 'lastSignInAt' || res.body.items[0].lastSignInAt,
      ),
    )
    const reem = await userByEmail(E.reem!)
    expect((await k.delete(`/api/microsites/znm/admin/members/${reem.id}`)).status).toBe(204)
    expect((await k.delete(`/api/microsites/znm/admin/members/${reem.id}`)).status).toBe(404)
    const left = await db.select().from(memberships).where(eq(memberships.userId, reem.id))
    expect(left).toHaveLength(1) // employees membership remains
  })

  test('CSV invitations: preview then confirm; second concurrent import by someone else 409', async () => {
    const k = await as(E.khalid!)
    const csv = 'email,name\nnew1@example.com,New One\nnot-an-email,Bad\nnew1@example.com,Dup\n'
    const preview = await k
      .post('/api/microsites/znm/admin/invitations/csv')
      .attach('file', Buffer.from(csv), { filename: 'i.csv', contentType: 'text/csv' })
    expect(preview.status).toBe(200)
    expect(preview.body.preview.map((p: { valid: boolean }) => p.valid)).toEqual([
      true,
      false,
      false,
    ])
    const admin = await as(E.aisha!)
    const blocked = await admin
      .post('/api/microsites/znm/admin/invitations/csv')
      .attach('file', Buffer.from(csv), { filename: 'i.csv', contentType: 'text/csv' })
    expect(blocked.status).toBe(409)
    const confirm = await k
      .post('/api/microsites/znm/admin/invitations/csv/confirm')
      .send({ token: preview.body.token })
    expect(confirm.status).toBe(201)
    expect(confirm.body.created).toBe(1)
    expect(
      (
        await k
          .post('/api/microsites/znm/admin/invitations/csv/confirm')
          .send({ token: preview.body.token })
      ).status,
    ).toBe(404)
  })

  test('invite role limited to learner or judge', async () => {
    const k = await as(E.khalid!)
    const res = await k
      .post('/api/microsites/znm/admin/invitations')
      .send({ emails: ['x@example.com'], role: 'admin' })
    expect(res.status).toBe(422)
  })
})
