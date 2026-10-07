import { beforeEach, describe, expect, test } from 'bun:test'
import { db } from '@server/db/connection'
import { auditLog } from '@server/db/schema/identity'
import { mentorMicrosites } from '@server/db/schema/mentoring'
import { E } from '@server/db/seed/data'
import { generateSlots } from '@server/services/mentoring/slots.service'
import {
  AdminMentorMentees,
  AdminMentorRow,
  AdminMentorsPage,
  MentorInviteResult,
} from '@shared/schemas/mentoring'
import { and, eq } from 'drizzle-orm'
import { expectDenied } from '../helpers/denials'
import { anon, as } from '../helpers/http'
import { lastMailTo, tokenFromUrl } from '../helpers/mail'
import { app, freshMentoring, type MentoringSeed } from './setup'

let seed: MentoringSeed
beforeEach(async () => {
  seed = await freshMentoring()
})

const notAdmin = () => ({
  signedOut: null,
  learner: E.saeed!,
  mentor: E.hessa!,
  subAdmin: E.layla!,
  judge: E.noura!,
})

describe('P48 mentor pool', () => {
  test('list with filters; admin sees e-mail and counts', async () => {
    const c = await as(E.aisha!, app)
    const res = await c.get('/api/admin/mentors')
    expect(res.status).toBe(200)
    const page = AdminMentorsPage.parse(res.body)
    expect(page.total).toBe(4)
    const hessa = page.items.find((m) => m.mentorId === seed.m.mentors.hessa)!
    expect(hessa).toMatchObject({
      email: E.hessa,
      status: 'active',
      kind: 'mentor',
      mentees: 1,
      sessions: 2,
      sessionsCount: 1,
    })
    const museo = await c.get('/api/admin/mentors?microsite=museopro')
    expect(museo.body.items.map((m: { name: string }) => m.name)).toEqual(['Jean-Luc Morel'])
    const q = await c.get('/api/admin/mentors?q=mariam')
    expect(q.body.total).toBe(1)
    expect((await c.get('/api/admin/mentors?status=paused')).status).toBe(422)
    await expectDenied(app, (x) => x.get('/api/admin/mentors'), notAdmin())
  })

  test('invite → accept → mentor profile and microsite links created', async () => {
    const c = await as(E.aisha!, app)
    const bad = await c
      .post('/api/admin/mentors/invite')
      .send({ emails: ['new.mentor@example.com'], microsites: ['nowhere'] })
    expect(bad.status).toBe(422)
    expect(bad.body.error.fields.microsites).toBeString()
    const res = await c.post('/api/admin/mentors/invite').send({
      emails: ['new.mentor@example.com', 'not-an-email'],
      microsites: ['elevate', 'employees'],
      categories: ['Research'],
    })
    expect(res.status).toBe(201)
    expect(MentorInviteResult.parse(res.body)).toEqual({
      created: 1,
      skipped: [{ email: 'not-an-email', reason: 'invalid_email' }],
    })
    const mail = await lastMailTo('new.mentor@example.com', 'invitation')
    expect(mail?.data.roleLabel).toBe('a mentor')
    const accept = await anon(app)
      .post(`/api/public/invitations/${tokenFromUrl(String(mail!.data.url))}/accept`)
      .send({ name: 'New Mentor', password: 'Welcome2026!!', locale: 'en' })
    expect(accept.status).toBe(201)
    const list = await c.get('/api/admin/mentors?q=new.mentor')
    expect(list.body.items[0]).toMatchObject({
      name: 'New Mentor',
      categories: ['Research'],
      microsites: ['employees', 'elevate'],
    })
    const mentor = await as('new.mentor@example.com', app, 'Welcome2026!!')
    expect((await mentor.get('/api/mentor/profile')).status).toBe(200)
    await expectDenied(
      app,
      (x) =>
        x
          .post('/api/admin/mentors/invite')
          .send({ emails: ['x@example.com'], microsites: ['elevate'] }),
      notAdmin(),
    )
  })

  test('update: microsites, courses, kind, status (audited); learners stop seeing inactive', async () => {
    const c = await as(E.aisha!, app)
    const url = `/api/admin/mentors/${seed.m.mentors.rashid}`
    const res = await c.put(url).send({
      microsites: ['elevate'],
      categories: ['Visitor Experience and Events'],
      courseIds: [seed.base.courses.C05!.id],
      bookingEnabled: true,
      kind: 'mentor',
      status: 'inactive',
    })
    expect(res.status).toBe(200)
    expect(AdminMentorRow.parse(res.body)).toMatchObject({
      status: 'inactive',
      courseIds: [seed.base.courses.C05!.id],
      categories: ['Visitor Experience and Events'],
    })
    const [audit] = await db
      .select()
      .from(auditLog)
      .where(
        and(eq(auditLog.action, 'mentor.update'), eq(auditLog.targetId, seed.m.mentors.rashid!)),
      )
    expect(audit).toBeDefined()
    const saeed = await as(E.saeed!, app)
    const list = await saeed.get('/api/microsites/elevate/mentors')
    expect(list.body.items.total).toBe(2)
    expect((await saeed.get(`/api/mentors/${seed.m.mentors.rashid}`)).status).toBe(404)

    const bad = await c.put(url).send({
      microsites: ['elevate'],
      categories: ['Cooking'],
      courseIds: ['00000000-0000-4000-8000-000000000000'],
      bookingEnabled: 'yes',
      kind: 'coach',
      status: 'active',
    })
    expect(bad.status).toBe(422)
    const unknownCourse = await c.put(url).send({
      microsites: ['elevate'],
      categories: [],
      courseIds: ['00000000-0000-4000-8000-000000000000'],
      bookingEnabled: true,
      kind: 'mentor',
      status: 'active',
    })
    expect(unknownCourse.status).toBe(422)
    expect(
      (
        await c.put('/api/admin/mentors/00000000-0000-4000-8000-000000000000').send({
          microsites: [],
          categories: [],
          courseIds: [],
          bookingEnabled: true,
          kind: 'mentor',
          status: 'active',
        })
      ).status,
    ).toBe(404)
    const links = await db
      .select()
      .from(mentorMicrosites)
      .where(eq(mentorMicrosites.mentorId, seed.m.mentors.rashid!))
    expect(links).toHaveLength(1)
    await expectDenied(app, (x) => x.put(url).send({}), notAdmin())
  })

  test('mentees of a mentor (admin sees e-mail, never GROW text)', async () => {
    const c = await as(E.aisha!, app)
    const res = await c.get(`/api/admin/mentors/${seed.m.mentors.hessa}/mentees`)
    expect(res.status).toBe(200)
    const list = AdminMentorMentees.parse(res.body)
    expect(list).toEqual([
      {
        user: { id: seed.base.users.saeed!.id, name: 'Saeed Al Hammadi', email: E.saeed! },
        microsite: 'elevate',
        matchedAt: '2026-09-21T08:00:00.000Z',
        sessions: 1,
        lastLogAt: '2026-09-28T09:00:00.000Z',
      },
    ])
    expect(JSON.stringify(res.body)).not.toContain('exhibition')
    await expectDenied(
      app,
      (x) => x.get(`/api/admin/mentors/${seed.m.mentors.hessa}/mentees`),
      notAdmin(),
    )
  })

  test('P47 user detail: growLogsSummary counts only', async () => {
    const c = await as(E.aisha!, app)
    const hessa = await c.get(`/api/admin/users/${seed.base.users.hessa!.id}`)
    expect(hessa.status).toBe(200)
    expect(hessa.body.growLogsSummary).toEqual({ logs: 1, mentees: 1 })
    const saeed = await c.get(`/api/admin/users/${seed.base.users.saeed!.id}`)
    expect(saeed.body.growLogsSummary).toEqual({ logs: 1, mentees: 0 })
    expect(JSON.stringify(saeed.body)).not.toContain('exhibition project')
    const mona = await c.get(`/api/admin/users/${seed.base.users.mona!.id}`)
    expect(mona.body.growLogsSummary).toBeUndefined()
  })
})

describe('slot generation (pure)', () => {
  test('weekly rules in the mentor zone across a DST change; blocked and past slots skipped', () => {
    const slots = generateSlots({
      rules: [{ weekday: 0, startTime: '09:00', endTime: '11:00' }],
      timezone: 'Europe/Paris',
      from: new Date('2026-10-18T00:00:00Z'),
      to: new Date('2026-11-02T00:00:00Z'),
      blocked: [
        { startsAt: new Date('2026-10-18T07:30:00Z'), endsAt: new Date('2026-10-18T08:30:00Z') },
      ],
      notBefore: new Date('2026-10-01T00:00:00Z'),
    })
    // Sun 18 Oct (UTC+2): 07:00Z blocked by overlap, 08:00Z blocked too → none.
    // Sun 25 Oct (UTC+1 after the change): 08:00Z, 09:00Z. Sun 1 Nov: 08:00Z, 09:00Z.
    expect(slots.map((s) => s.startsAt.toISOString())).toEqual([
      '2026-10-25T08:00:00.000Z',
      '2026-10-25T09:00:00.000Z',
      '2026-11-01T08:00:00.000Z',
      '2026-11-01T09:00:00.000Z',
    ])
  })
})
