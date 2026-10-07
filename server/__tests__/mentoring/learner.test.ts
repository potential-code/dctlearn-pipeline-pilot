import { beforeEach, describe, expect, test } from 'bun:test'
import { db } from '@server/db/connection'
import { menteeApplications } from '@server/db/schema/mentoring'
import { E } from '@server/db/seed/data'
import { setNow } from '@server/lib/clock'
import { getHubTab } from '@server/services/microsites/dashboard.service'
import { findMicrositeBySlug } from '@server/services/microsites/lookup.service'
import {
  ChooseResponse,
  MatchResponse,
  MentorDetail,
  MentorsTabResponse,
  RegistrationState,
  SlotsResponse,
} from '@shared/schemas/mentoring'
import { DashboardResponse } from '@shared/schemas/microsites'
import { eq } from 'drizzle-orm'
import { expectDenied } from '../helpers/denials'
import { as } from '../helpers/http'
import { lastMailTo } from '../helpers/mail'
import { app, freshMentoring, joinElevate, type MentoringSeed } from './setup'

let seed: MentoringSeed
beforeEach(async () => {
  seed = await freshMentoring()
})

/**
 * P52 through the hub registry. The shared hub route (microsites.routes.ts) has no `response`
 * schema, so `route()` answers 204 without a body — requested shared change; until then the
 * registered tab is exercised through `getHubTab` (same tab-enabled check and schema).
 */
async function hubMentors(userKey: string, slug: string, query: Record<string, string> = {}) {
  const u = seed.base.users[userKey]!
  const viewer = { ...u, role: 'learner' } as unknown as Viewer
  const { result, response } = await getHubTab(
    viewer,
    (await findMicrositeBySlug(slug))!,
    'mentors',
    query,
  )
  return response.parse(result)
}

const MONA_ANSWERS = {
  goals: 'Grow as a people leader',
  yearsAtDct: '3-5',
  preferredAreas: ['People and Performance'],
  language: 'en',
}

describe('P17 / P52 mentors list', () => {
  test('elevate member sees the three linked mentors with stats, no e-mail', async () => {
    const c = await as(E.saeed!, app)
    const res = await c.get('/api/microsites/elevate/mentors')
    expect(res.status).toBe(200)
    const body = MentorsTabResponse.parse(res.body)
    expect(body.items.total).toBe(3)
    expect(body.categories).toContain('Museums and Curation')
    const hessa = body.items.items.find((m) => m.mentorId === seed.m.mentors.hessa)!
    expect(hessa).toMatchObject({
      name: 'Dr. Hessa Al Nuaimi',
      microsites: ['elevate'],
      rating: 5,
      sessionsCount: 1,
      bookingEnabled: true,
      // Today is Tue 2026-10-06 09:00Z; Hessa's next free hour is Wed 10:00 Dubai.
      nextFreeSlot: '2026-10-07T06:00:00.000Z',
    })
    expect(JSON.stringify(res.body)).not.toContain('@example.com')

    const filtered = await c.get(
      '/api/microsites/elevate/mentors?category=People%20and%20Performance',
    )
    expect(filtered.body.items.items.map((m: { name: string }) => m.name)).toEqual([
      'Mariam Khoury',
    ])
    const hub = await hubMentors('saeed', 'elevate', { q: 'rashid' })
    expect(MentorsTabResponse.parse(hub).items.items).toHaveLength(1)
  })

  test('MuseoPro hub lists the trainer (mentoring off: browse only, courses linked)', async () => {
    const c = await as(E.elise!, app)
    const body = MentorsTabResponse.parse(await hubMentors('elise', 'museopro'))
    expect(body.items.items).toHaveLength(1)
    expect(body.items.items[0]).toMatchObject({
      name: 'Jean-Luc Morel',
      bookingEnabled: false,
      courseIds: [seed.base.courses.C14!.id, seed.base.courses.C15!.id],
    })
    // The mentoring routes stay off for museopro.
    expect((await c.get('/api/microsites/museopro/mentors')).status).toBe(404)
    const detail = await c.get(`/api/mentors/${seed.m.mentors.jeanluc}`)
    expect(detail.status).toBe(200)
    expect(MentorDetail.parse(detail.body).courses).toHaveLength(2)
    const slots = await c.get(`/api/mentors/${seed.m.mentors.jeanluc}/slots`)
    expect(slots.body).toEqual({ slots: [] })
  })

  test('access: mentoring off → 404 feature_off; other roles denied; admin may browse', async () => {
    const saeed = await as(E.saeed!, app)
    const off = await saeed.get('/api/microsites/employees/mentors')
    expect(off.status).toBe(404)
    expect(off.body.error.code).toBe('feature_off')
    await expectDenied(app, (c) => c.get('/api/microsites/elevate/mentors'), {
      signedOut: null,
      nonMember: E.yousef!,
      mentor: E.hessa!,
      judge: E.noura!,
      ownSubAdmin: E.layla!,
      otherSubAdmin: E.omar!,
    })
    expect((await (await as(E.aisha!, app)).get('/api/microsites/elevate/mentors')).status).toBe(
      200,
    )
  })
})

describe('P18 mentor profile and P21 slots', () => {
  test('profile has bio, courses, availability; never e-mail or phone', async () => {
    const c = await as(E.saeed!, app)
    const res = await c.get(`/api/mentors/${seed.m.mentors.hessa}`)
    expect(res.status).toBe(200)
    const body = MentorDetail.parse(res.body)
    expect(body.availabilitySummary.timezone).toBe('Asia/Dubai')
    expect(body.availabilitySummary.rules).toHaveLength(5)
    expect(body.bio.ar).not.toBe('')
    expect(JSON.stringify(res.body)).not.toContain('hessa.n@example.com')
  })

  test('mentor visibility: unlinked learner 404, other mentor 404, judge/sub admin 403', async () => {
    const url = `/api/mentors/${seed.m.mentors.hessa}`
    await expectDenied(
      app,
      (c) => c.get(url),
      {
        signedOut: null,
        unlinkedLearner: E.yousef!,
        otherMentor: E.mariam!,
        judge: E.noura!,
        subAdmin: E.layla!,
      },
      { unlinkedLearner: 404, otherMentor: 404 },
    )
    expect((await (await as(E.hessa!, app)).get(url)).status).toBe(200)
    expect(
      (await (await as(E.saeed!, app)).get('/api/mentors/00000000-0000-4000-8000-000000000000'))
        .status,
    ).toBe(404)
  })

  test('slots are 60 min, UTC, from Dubai rules, minus bookings; range checked', async () => {
    const c = await as(E.saeed!, app)
    const res = await c.get(
      `/api/mentors/${seed.m.mentors.hessa}/slots?from=2026-10-11T00:00:00Z&to=2026-10-13T00:00:00Z`,
    )
    expect(res.status).toBe(200)
    const { slots } = SlotsResponse.parse(res.body)
    // Sun 11th: 06,07,08Z · Mon 12th: 06, (07 = B2 taken), 08Z
    expect(slots.map((s) => s.startsAt)).toEqual([
      '2026-10-11T06:00:00.000Z',
      '2026-10-11T07:00:00.000Z',
      '2026-10-11T08:00:00.000Z',
      '2026-10-12T06:00:00.000Z',
      '2026-10-12T08:00:00.000Z',
    ])
    expect(slots[0]!.endsAt).toBe('2026-10-11T07:00:00.000Z')
    const bad = await c.get(
      `/api/mentors/${seed.m.mentors.hessa}/slots?from=2026-10-11T00:00:00Z&to=2026-12-13T00:00:00Z`,
    )
    expect(bad.status).toBe(422)
    expect(bad.body.error.fields.to).toBeString()
  })
})

describe('P19–P20 registration, match, choose', () => {
  test('register → match (rules) → choose → mentor notified → accept → matched', async () => {
    await joinElevate(seed, 'mona')
    const c = await as(E.mona!, app)
    expect((await c.post('/api/microsites/elevate/mentoring/match').send({})).status).toBe(409)

    const before = await c.get('/api/microsites/elevate/mentoring/registration')
    expect(before.status).toBe(200)
    expect(RegistrationState.parse(before.body)).toEqual({
      formId: seed.m.registrationFormId,
      complete: false,
    })
    const bad = await c
      .post('/api/microsites/elevate/mentoring/registration')
      .send({ answers: { ...MONA_ANSWERS, goals: '', language: 'fr' } })
    expect(bad.status).toBe(422)
    expect(Object.keys(bad.body.error.fields).sort()).toEqual(['goals', 'language'])

    const ok = await c
      .post('/api/microsites/elevate/mentoring/registration')
      .send({ answers: { ...MONA_ANSWERS, goals: '<b>Grow</b> as a leader' } })
    expect(ok.status).toBe(200)
    expect(ok.body).toEqual({ complete: true })
    const after = await c.get('/api/microsites/elevate/mentoring/registration')
    expect(after.body.answers.goals).toBe('Grow as a leader')
    expect(
      (
        await c
          .post('/api/microsites/elevate/mentoring/registration')
          .send({ answers: MONA_ANSWERS })
      ).status,
    ).toBe(409)

    const match = await c.post('/api/microsites/elevate/mentoring/match').send({})
    expect(match.status).toBe(200)
    const m = MatchResponse.parse(match.body)
    expect(m.source).toBe('rules')
    expect(m.suggestions[0]).toMatchObject({ name: 'Mariam Khoury', matchScore: 1 })
    expect(m.suggestions[0]!.reasons.map((r) => r.en)).toContain('People and Performance overlap')

    const choose = await c
      .post('/api/microsites/elevate/mentoring/match/choose')
      .send({ mentorId: seed.m.mentors.mariam })
    expect(choose.status).toBe(200)
    expect(ChooseResponse.parse(choose.body).matchedMentor.name).toBe('Mariam Khoury')
    expect(await lastMailTo(E.mariam!, 'mentee-application-received')).toBeDefined()
    expect(
      (
        await c
          .post('/api/microsites/elevate/mentoring/match/choose')
          .send({ mentorId: seed.m.mentors.hessa })
      ).status,
    ).toBe(409)

    const [app1] = await db
      .select()
      .from(menteeApplications)
      .where(eq(menteeApplications.menteeId, seed.base.users.mona!.id))
    const mariam = await as(E.mariam!, app)
    const accepted = await mariam.post(`/api/mentor/applications/${app1!.id}/accept`).send({})
    expect(accepted.status).toBe(200)
    expect(accepted.body.matchId).toBeString()
    expect(await lastMailTo(E.mona!, 'mentee-application-accepted')).toBeDefined()

    const dash = await c.get('/api/microsites/elevate/dashboard')
    expect(DashboardResponse.parse(dash.body).mentoring).toMatchObject({
      enabled: true,
      registrationComplete: true,
      matchedMentor: { name: 'Mariam Khoury' },
    })
    // Mariam (Tue/Thu 09–12 Dubai) → Thu 2026-10-08 05:00Z is free.
    const booked = await c
      .post('/api/bookings')
      .send({ mentorId: seed.m.mentors.mariam, startsAt: '2026-10-08T05:00:00Z' })
    expect(booked.status).toBe(201)
  })

  test('choose: unknown/unlinked mentor 404, invalid id 422, trainer 404; sub admin 403', async () => {
    await joinElevate(seed, 'mona')
    const c = await as(E.mona!, app)
    await c.post('/api/microsites/elevate/mentoring/registration').send({ answers: MONA_ANSWERS })
    const url = '/api/microsites/elevate/mentoring/match/choose'
    expect((await c.post(url).send({ mentorId: seed.m.mentors.jeanluc })).status).toBe(404)
    expect((await c.post(url).send({ mentorId: 'nope' })).status).toBe(422)
    await expectDenied(app, (x) => x.post(url).send({ mentorId: seed.m.mentors.hessa }), {
      signedOut: null,
      ownSubAdmin: E.layla!,
      admin: E.aisha!,
      mentor: E.hessa!,
      nonMember: E.yousef!,
    })
  })

  test('decline frees the learner to choose again', async () => {
    await joinElevate(seed, 'hamad')
    const c = await as(E.hamad!, app)
    await c
      .post('/api/microsites/elevate/mentoring/registration')
      .send({ answers: { ...MONA_ANSWERS, preferredAreas: ['Visitor Experience and Events'] } })
    await c
      .post('/api/microsites/elevate/mentoring/match/choose')
      .send({ mentorId: seed.m.mentors.rashid })
    const [a] = await db
      .select()
      .from(menteeApplications)
      .where(eq(menteeApplications.menteeId, seed.base.users.hamad!.id))
    // Another mentor cannot act on it.
    expect(
      (await (await as(E.hessa!, app)).post(`/api/mentor/applications/${a!.id}/decline`).send({}))
        .status,
    ).toBe(404)
    const rashid = await as(E.rashid!, app)
    const res = await rashid
      .post(`/api/mentor/applications/${a!.id}/decline`)
      .send({ reason: 'Fully booked this term' })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
    expect((await rashid.post(`/api/mentor/applications/${a!.id}/accept`).send({})).status).toBe(
      409,
    )
    const mail = await lastMailTo(E.hamad!, 'mentee-application-declined')
    expect(mail?.data.reason).toBe('Fully booked this term')
    expect(
      (
        await c
          .post('/api/microsites/elevate/mentoring/match/choose')
          .send({ mentorId: seed.m.mentors.hessa })
      ).status,
    ).toBe(200)
  })

  test('registration route needs the form configured and membership', async () => {
    await expectDenied(app, (c) => c.get('/api/microsites/elevate/mentoring/registration'), {
      signedOut: null,
      nonMember: E.reem!,
      mentor: E.rashid!,
    })
  })
})

describe('P14 dashboard mentoring section', () => {
  test('Saeed: registered, matched with Hessa, next session B2 with join URL', async () => {
    const c = await as(E.saeed!, app)
    const res = await c.get('/api/microsites/elevate/dashboard')
    expect(res.status).toBe(200)
    const mentoring = DashboardResponse.parse(res.body).mentoring!
    expect(mentoring).toMatchObject({
      enabled: true,
      registrationComplete: true,
      matchedMentor: { mentorId: seed.m.mentors.hessa },
      nextSession: { bookingId: seed.m.bookings.B2, startsAt: '2026-10-12T07:00:00.000Z' },
    })
    expect(mentoring.nextSession!.joinUrl).toContain(seed.m.bookings.B2)
  })

  test('section respects the clock (after B2 ends no next session)', async () => {
    setNow('2026-10-12T08:30:00Z')
    const c = await as(E.saeed!, app)
    const res = await c.get('/api/microsites/elevate/dashboard')
    expect(res.body.mentoring.nextSession).toBeUndefined()
  })
})
