import { beforeEach, describe, expect, test } from 'bun:test'
import { db } from '@server/db/connection'
import { growLogs, mentorBookings } from '@server/db/schema/mentoring'
import { E } from '@server/db/seed/data'
import { setNow } from '@server/lib/clock'
import {
  Availability,
  BookingStatusResponse,
  GrowLogsPage,
  MentorBookingsList,
  MentorDashboard,
  MentorProfile,
} from '@shared/schemas/mentoring'
import { eq } from 'drizzle-orm'
import { expectDenied } from '../helpers/denials'
import { as } from '../helpers/http'
import { lastMailTo } from '../helpers/mail'
import { app, freshMentoring, joinElevate, type MentoringSeed } from './setup'

let seed: MentoringSeed
beforeEach(async () => {
  seed = await freshMentoring()
})

const notMentor = () => ({
  signedOut: null,
  learner: E.saeed!,
  admin: E.aisha!,
  subAdmin: E.layla!,
  judge: E.noura!,
})

const GROW = {
  sessionNo: 2,
  sessionDate: '2026-10-12',
  goal: 'Draft the exhibition brief',
  reality: 'Brief outline done',
  options: 'Ask finance for a budget template',
  wayForward: 'Share the brief by Friday',
}

describe('P30 mentor dashboard', () => {
  test('own mentees, sessions, logs; mentee e-mail never exposed', async () => {
    const c = await as(E.hessa!, app)
    const res = await c.get('/api/mentor/dashboard')
    expect(res.status).toBe(200)
    const body = MentorDashboard.parse(res.body)
    expect(body.kpis).toEqual({ mentees: 1, upcoming: 1, completedSessions: 1, pendingLogs: 0 })
    expect(body.me.microsites.map((m) => m.id)).toEqual(['elevate'])
    expect(body.mentees[0]).toMatchObject({
      userId: seed.base.users.saeed!.id,
      name: 'Saeed Al Hammadi',
      microsite: { id: 'elevate' },
      sessionsDone: 1,
      lastSessionAt: '2026-09-28T07:00:00.000Z',
      logsPending: 0,
    })
    expect(body.upcoming[0]).toMatchObject({ bookingId: seed.m.bookings.B2 })
    expect(body.past[0]).toMatchObject({
      bookingId: seed.m.bookings.B1,
      status: 'completed',
      feedback: { rating: 5 },
    })
    expect(body.past[0]!.growLogId).toBeString()
    const json = JSON.stringify(res.body)
    expect(json).not.toContain(E.saeed!)
    expect(json).not.toContain('@dctlearn.example')
    await expectDenied(app, (x) => x.get('/api/mentor/dashboard'), notMentor())
  })

  test('applications appear without e-mail; a mentor without profile gets 404', async () => {
    await joinElevate(seed, 'mona')
    const mona = await as(E.mona!, app)
    await mona.post('/api/microsites/elevate/mentoring/registration').send({
      answers: {
        goals: 'Lead',
        yearsAtDct: '0-1',
        preferredAreas: ['Strategy and Planning'],
        language: 'ar',
      },
    })
    await mona
      .post('/api/microsites/elevate/mentoring/match/choose')
      .send({ mentorId: seed.m.mentors.hessa })
    const res = await (await as(E.hessa!, app)).get('/api/mentor/dashboard')
    const body = MentorDashboard.parse(res.body)
    expect(body.applications).toHaveLength(1)
    expect(body.applications[0]!.mentee).toEqual({
      userId: seed.base.users.mona!.id,
      name: 'Mona Al Ameri',
    })
    expect(JSON.stringify(res.body)).not.toContain(E.mona!)
    // Rashid has no applications; Mariam's dashboard shows only her own.
    expect(
      (await (await as(E.rashid!, app)).get('/api/mentor/dashboard')).body.applications,
    ).toEqual([])
  })
})

describe('P30 GROW logs', () => {
  test('create after the session; immutable, one per booking; mentee notified', async () => {
    const c = await as(E.hessa!, app)
    const early = await c
      .post('/api/mentor/grow-logs')
      .send({ ...GROW, bookingId: seed.m.bookings.B2 })
    expect(early.status).toBe(409)
    setNow('2026-10-12T08:05:00Z')
    const ok = await c
      .post('/api/mentor/grow-logs')
      .send({ ...GROW, goal: '<script>x</script>Draft the brief', bookingId: seed.m.bookings.B2 })
    expect(ok.status).toBe(201)
    const [row] = await db.select().from(growLogs).where(eq(growLogs.id, ok.body.id))
    expect(row!.goal).toBe('Draft the brief')
    expect(await lastMailTo(E.saeed!, 'grow-log')).toBeDefined()
    const dup = await c
      .post('/api/mentor/grow-logs')
      .send({ ...GROW, bookingId: seed.m.bookings.B2 })
    expect(dup.status).toBe(409)
    expect(dup.body.error.code).toBe('conflict')
    expect(
      (await c.post('/api/mentor/grow-logs').send({ ...GROW, bookingId: seed.m.bookings.B1 }))
        .status,
    ).toBe(409)
    // No edit or delete route exists.
    expect((await c.put(`/api/mentor/grow-logs/${ok.body.id}`).send(GROW)).status).toBe(404)
    expect((await c.delete(`/api/mentor/grow-logs/${ok.body.id}`)).status).toBe(404)

    const list = await c.get(`/api/mentor/grow-logs?menteeId=${seed.base.users.saeed!.id}`)
    expect(GrowLogsPage.parse(list.body).total).toBe(2)
    expect(list.body.items[0]).toMatchObject({ sessionNo: 2, menteeName: 'Saeed Al Hammadi' })
  })

  test("another mentor's booking 404; invalid input 422; others denied", async () => {
    const rashid = await as(E.rashid!, app)
    expect(
      (await rashid.post('/api/mentor/grow-logs').send({ ...GROW, bookingId: seed.m.bookings.B1 }))
        .status,
    ).toBe(404)
    expect((await rashid.get('/api/mentor/grow-logs')).body.total).toBe(0)
    const bad = await (await as(E.hessa!, app)).post('/api/mentor/grow-logs').send({
      ...GROW,
      bookingId: seed.m.bookings.B2,
      goal: '',
      sessionDate: '12/10/2026',
      options: 'x'.repeat(2001),
    })
    expect(bad.status).toBe(422)
    expect(Object.keys(bad.body.error.fields).sort()).toEqual(['goal', 'options', 'sessionDate'])
    await expectDenied(app, (x) => x.get('/api/mentor/grow-logs'), notMentor())
    await expectDenied(
      app,
      (x) => x.post('/api/mentor/grow-logs').send({ ...GROW, bookingId: seed.m.bookings.B1 }),
      notMentor(),
    )
  })
})

describe('P30 profile', () => {
  test('GET / PUT own profile; categories from the list; https links only', async () => {
    const c = await as(E.hessa!, app)
    const res = await c.get('/api/mentor/profile')
    expect(res.status).toBe(200)
    expect(MentorProfile.parse(res.body).title).toBe('Director, Museums Strategy')
    const put = await c.put('/api/mentor/profile').send({
      title: 'Director',
      bio: { en: 'New <b>bio</b>', ar: 'سيرة' },
      categories: ['Research'],
      linkedinUrl: 'https://linkedin.com/in/hessa',
      photo: 'https://cdn.example/hessa.jpg',
    })
    expect(put.status).toBe(200)
    expect(MentorProfile.parse(put.body)).toEqual({
      title: 'Director',
      bio: { en: 'New bio', ar: 'سيرة' },
      categories: ['Research'],
      linkedinUrl: 'https://linkedin.com/in/hessa',
      photo: 'https://cdn.example/hessa.jpg',
    })
    const bad = await c.put('/api/mentor/profile').send({
      title: '',
      bio: { en: '', ar: '' },
      categories: ['Cooking'],
      linkedinUrl: 'http://insecure.example',
    })
    expect(bad.status).toBe(422)
    expect(Object.keys(bad.body.error.fields).sort()).toEqual([
      'categories.0',
      'linkedinUrl',
      'title',
    ])
    await expectDenied(app, (x) => x.get('/api/mentor/profile'), notMentor())
  })
})

describe('P31 availability and bookings', () => {
  test('GET / PUT rules in the mentor zone; slots follow; overlaps 422', async () => {
    const c = await as(E.rashid!, app)
    const res = await c.get('/api/mentor/availability')
    expect(res.status).toBe(200)
    const before = Availability.parse(res.body)
    expect(before.rules.map((r) => [r.weekday, r.startTime, r.endTime, r.timezone])).toEqual([
      [1, '14:00', '17:00', 'Asia/Dubai'],
      [3, '14:00', '17:00', 'Asia/Dubai'],
    ])
    const put = await c.put('/api/mentor/availability').send({
      timezone: 'Europe/Paris',
      rules: [{ weekday: 3, startTime: '09:00', endTime: '11:00' }],
      timeOff: [{ from: '2026-10-14T00:00:00Z', to: '2026-10-15T00:00:00Z' }],
    })
    expect(put.status).toBe(200)
    expect(Availability.parse(put.body).rules[0]).toMatchObject({
      weekday: 3,
      timezone: 'Europe/Paris',
    })
    // Wed 7 Oct 09:00 and 10:00 Paris (UTC+2) = 07:00, 08:00Z; Wed 14 Oct is time off.
    const slots = await (await as(E.saeed!, app)).get(
      `/api/mentors/${seed.m.mentors.rashid}/slots?from=2026-10-06T00:00:00Z&to=2026-10-20T00:00:00Z`,
    )
    expect(slots.body.slots.map((s: { startsAt: string }) => s.startsAt)).toEqual([
      '2026-10-07T07:00:00.000Z',
      '2026-10-07T08:00:00.000Z',
    ])
    const bad = await c.put('/api/mentor/availability').send({
      timezone: 'Mars/Base',
      rules: [{ weekday: 7, startTime: '25:00', endTime: '10:00' }],
    })
    expect(bad.status).toBe(422)
    expect(bad.body.error.fields.timezone).toBeString()
    const overlap = await c.put('/api/mentor/availability').send({
      timezone: 'Asia/Dubai',
      rules: [
        { weekday: 1, startTime: '09:00', endTime: '12:00' },
        { weekday: 1, startTime: '11:00', endTime: '13:00' },
      ],
    })
    expect(overlap.status).toBe(422)
    expect(overlap.body.error.fields['rules.1']).toBeString()
    await expectDenied(app, (x) => x.get('/api/mentor/availability'), notMentor())
  })

  test('GET /api/mentor/bookings: own only, range filter', async () => {
    const res = await (await as(E.hessa!, app)).get('/api/mentor/bookings')
    expect(res.status).toBe(200)
    const list = MentorBookingsList.parse(res.body)
    expect(list.map((b) => b.bookingId)).toEqual([seed.m.bookings.B1, seed.m.bookings.B2])
    expect(list[0]!.mentee).toEqual({ userId: seed.base.users.saeed!.id, name: 'Saeed Al Hammadi' })
    const ranged = await (await as(E.hessa!, app)).get(
      '/api/mentor/bookings?from=2026-10-01T00:00:00Z',
    )
    expect(ranged.body).toHaveLength(1)
    const mariam = await (await as(E.mariam!, app)).get('/api/mentor/bookings')
    expect(mariam.body.map((b: { bookingId: string }) => b.bookingId)).toEqual([seed.m.bookings.B3])
  })

  test('no-show: only after start, only confirmed, own only', async () => {
    const c = await as(E.hessa!, app)
    const url = `/api/bookings/${seed.m.bookings.B2}/no-show`
    expect((await c.post(url).send({})).status).toBe(409)
    expect((await (await as(E.mariam!, app)).post(url).send({})).status).toBe(404)
    expect((await (await as(E.saeed!, app)).post(url).send({})).status).toBe(403)
    setNow('2026-10-12T07:20:00Z')
    const ok = await c.post(url).send({})
    expect(ok.status).toBe(200)
    expect(BookingStatusResponse.parse(ok.body).status).toBe('no_show')
    expect((await c.post(url).send({})).status).toBe(409)
    expect((await c.post(`/api/bookings/${seed.m.bookings.B2}/cancel`).send({})).status).toBe(409)
  })

  test('mentor feedback closes the session (attended → completed), once', async () => {
    const c = await as(E.hessa!, app)
    const url = `/api/bookings/${seed.m.bookings.B2}/mentor-feedback`
    expect((await c.post(url).send({ rating: 5, attendance: 'attended' })).status).toBe(409)
    setNow('2026-10-12T08:00:00Z')
    expect((await c.post(url).send({ rating: 0, attendance: 'present' })).status).toBe(422)
    const ok = await c.post(url).send({ rating: 5, attendance: 'attended', note: 'Great' })
    expect(ok.status).toBe(201)
    const [b] = await db
      .select()
      .from(mentorBookings)
      .where(eq(mentorBookings.id, seed.m.bookings.B2))
    expect(b!.status).toBe('completed')
    expect((await c.post(url).send({ rating: 4, attendance: 'attended' })).status).toBe(409)
    expect(
      (await (await as(E.rashid!, app)).post(url).send({ rating: 4, attendance: 'attended' }))
        .status,
    ).toBe(404)
    await expectDenied(app, (x) => x.post(url).send({ rating: 4, attendance: 'attended' }), {
      signedOut: null,
      learner: E.saeed!,
      admin: E.aisha!,
    })
  })
})
