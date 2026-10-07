import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { db } from '@server/db/connection'
import { mentorBookings, mentorProfiles } from '@server/db/schema/mentoring'
import { E } from '@server/db/seed/data'
import { setNow } from '@server/lib/clock'
import { setVideoProvider, zoomProvider } from '@server/services/providers/video.provider'
import {
  BookingCreated,
  BookingStatusResponse,
  GrowLogsPage,
  MyBookingsPage,
  SessionState,
  SessionToken,
} from '@shared/schemas/mentoring'
import { eq } from 'drizzle-orm'
import { expectDenied } from '../helpers/denials'
import { as } from '../helpers/http'
import { deliveredMail, lastMailTo } from '../helpers/mail'
import { app, freshMentoring, joinElevate, type MentoringSeed } from './setup'

let seed: MentoringSeed
beforeEach(async () => {
  seed = await freshMentoring()
})
afterEach(() => setVideoProvider(zoomProvider))

async function booking(id: string) {
  const [b] = await db.select().from(mentorBookings).where(eq(mentorBookings.id, id))
  return b!
}

describe('P21 POST /api/bookings', () => {
  test('matched learner books a free slot → confirmed at once, both notified', async () => {
    const c = await as(E.saeed!, app)
    const res = await c
      .post('/api/bookings')
      .send({ mentorId: seed.m.mentors.hessa, startsAt: '2026-10-07T06:00:00Z', topic: 'Budget' })
    expect(res.status).toBe(201)
    expect(BookingCreated.parse(res.body).status).toBe('confirmed')
    expect(await lastMailTo(E.saeed!, 'booking-confirmed')).toBeDefined()
    expect(await lastMailTo(E.hessa!, 'booking-confirmed')).toBeDefined()
    const slots = await c.get(
      `/api/mentors/${seed.m.mentors.hessa}/slots?from=2026-10-07T00:00:00Z&to=2026-10-08T00:00:00Z`,
    )
    expect(slots.body.slots.map((s: { startsAt: string }) => s.startsAt)).toEqual([
      '2026-10-07T07:00:00.000Z',
      '2026-10-07T08:00:00.000Z',
    ])
  })

  test('mentor without auto-confirm → requested; mentor confirms (409 twice)', async () => {
    await db
      .update(mentorProfiles)
      .set({ autoConfirm: false })
      .where(eq(mentorProfiles.id, seed.m.mentors.hessa!))
    const c = await as(E.saeed!, app)
    const res = await c
      .post('/api/bookings')
      .send({ mentorId: seed.m.mentors.hessa, startsAt: '2026-10-07T06:00:00Z' })
    expect(res.body.status).toBe('requested')
    expect(await lastMailTo(E.hessa!, 'booking-requested')).toBeDefined()
    const id = res.body.bookingId
    expect((await c.post(`/api/bookings/${id}/confirm`).send({})).status).toBe(403)
    expect(
      (await (await as(E.rashid!, app)).post(`/api/bookings/${id}/confirm`).send({})).status,
    ).toBe(404)
    const hessa = await as(E.hessa!, app)
    const ok = await hessa.post(`/api/bookings/${id}/confirm`).send({})
    expect(ok.status).toBe(200)
    expect(BookingStatusResponse.parse(ok.body)).toEqual({ bookingId: id, status: 'confirmed' })
    expect((await hessa.post(`/api/bookings/${id}/confirm`).send({})).status).toBe(409)
  })

  test('slot race: two learners, one slot → one 201, one 409 "slot just taken"', async () => {
    await joinElevate(seed, 'mona', 'hessa')
    const [saeed, mona] = await Promise.all([as(E.saeed!, app), as(E.mona!, app)])
    const body = { mentorId: seed.m.mentors.hessa, startsAt: '2026-10-08T06:00:00Z' }
    const results = await Promise.all([
      saeed.post('/api/bookings').send(body),
      mona.post('/api/bookings').send(body),
    ])
    expect(results.map((r) => r.status).sort()).toEqual([201, 409])
    const loser = results.find((r) => r.status === 409)!
    expect(loser.body.error).toMatchObject({
      code: 'conflict',
      message: 'This slot was just taken',
    })
  })

  test('taken slot 409 · not a slot 422 · not matched 409 · invalid input 422', async () => {
    const c = await as(E.saeed!, app)
    const taken = await c
      .post('/api/bookings')
      .send({ mentorId: seed.m.mentors.hessa, startsAt: '2026-10-12T07:00:00Z' })
    expect(taken.status).toBe(409)
    const offGrid = await c
      .post('/api/bookings')
      .send({ mentorId: seed.m.mentors.hessa, startsAt: '2026-10-07T06:30:00Z' })
    expect(offGrid.status).toBe(422)
    expect(offGrid.body.error.fields.startsAt).toBeString()
    const past = await c
      .post('/api/bookings')
      .send({ mentorId: seed.m.mentors.hessa, startsAt: '2026-10-06T06:00:00Z' })
    expect(past.status).toBe(422)
    const otherMentor = await c
      .post('/api/bookings')
      .send({ mentorId: seed.m.mentors.rashid, startsAt: '2026-10-07T10:00:00Z' })
    expect(otherMentor.status).toBe(409)
    const invalid = await c.post('/api/bookings').send({ mentorId: 'x', startsAt: 'tomorrow' })
    expect(invalid.status).toBe(422)
    expect(Object.keys(invalid.body.error.fields).sort()).toEqual(['mentorId', 'startsAt'])
    // A learner who is not in a microsite with that mentor cannot even see them.
    const reem = await as(E.reem!, app)
    expect(
      (
        await reem
          .post('/api/bookings')
          .send({ mentorId: seed.m.mentors.hessa, startsAt: '2026-10-07T06:00:00Z' })
      ).status,
    ).toBe(404)
  })

  test('only learners book', async () => {
    const send = { mentorId: seed.m.mentors.hessa, startsAt: '2026-10-07T06:00:00Z' }
    await expectDenied(app, (c) => c.post('/api/bookings').send(send), {
      signedOut: null,
      mentor: E.hessa!,
      admin: E.aisha!,
      subAdmin: E.layla!,
      judge: E.noura!,
    })
  })
})

describe('P22 my bookings, cancel, lobby, token, feedback', () => {
  test('GET /api/me/bookings: own only, status filter, feedbackGiven', async () => {
    const c = await as(E.saeed!, app)
    const res = await c.get('/api/me/bookings')
    expect(res.status).toBe(200)
    const page = MyBookingsPage.parse(res.body)
    expect(page.items.map((b) => b.id)).toEqual([seed.m.bookings.B2, seed.m.bookings.B1])
    expect(page.items[0]!.joinUrl).toContain(seed.m.bookings.B2)
    expect(page.items[1]).toMatchObject({ status: 'completed', feedbackGiven: true })
    expect(page.items[0]!.mentor.name).toBe('Dr. Hessa Al Nuaimi')
    const done = await c.get('/api/me/bookings?status=completed')
    expect(done.body.total).toBe(1)
    expect((await c.get('/api/me/bookings?status=bogus')).status).toBe(422)
    const reem = await (await as(E.reem!, app)).get('/api/me/bookings')
    expect(reem.body.items.map((b: { id: string }) => b.id)).toEqual([seed.m.bookings.B3])
    await expectDenied(app, (x) => x.get('/api/me/bookings'), {
      signedOut: null,
      mentor: E.hessa!,
    })
  })

  test('cancel: mentee ≥ 2 h before start; too late 409; twice 409; others 404', async () => {
    const reem = await as(E.reem!, app)
    expect((await reem.post(`/api/bookings/${seed.m.bookings.B2}/cancel`).send({})).status).toBe(
      404,
    )
    expect(
      (await (await as(E.mariam!, app)).post(`/api/bookings/${seed.m.bookings.B2}/cancel`).send({}))
        .status,
    ).toBe(404)

    const c = await as(E.saeed!, app)
    setNow('2026-10-12T05:30:00Z')
    const late = await c.post(`/api/bookings/${seed.m.bookings.B2}/cancel`).send({})
    expect(late.status).toBe(409)
    setNow('2026-10-12T04:59:00Z')
    const ok = await c
      .post(`/api/bookings/${seed.m.bookings.B2}/cancel`)
      .send({ reason: '<i>Clash</i>' })
    expect(ok.status).toBe(200)
    expect(ok.body).toEqual({ bookingId: seed.m.bookings.B2, status: 'cancelled' })
    const b = await booking(seed.m.bookings.B2)
    expect(b.cancelReason).toBe('Clash')
    const mail = await lastMailTo(E.hessa!, 'booking-cancelled')
    expect(mail?.data.cancelledBy).toBe('Saeed Al Hammadi')
    expect((await c.post(`/api/bookings/${seed.m.bookings.B2}/cancel`).send({})).status).toBe(409)
    // The freed slot can be booked again (unique index ignores cancelled rows).
    const again = await c
      .post('/api/bookings')
      .send({ mentorId: seed.m.mentors.hessa, startsAt: '2026-10-12T07:00:00Z' })
    expect(again.status).toBe(201)
  })

  test('mentor can cancel too', async () => {
    const hessa = await as(E.hessa!, app)
    const res = await hessa
      .post(`/api/bookings/${seed.m.bookings.B2}/cancel`)
      .send({ reason: 'Travel' })
    expect(res.status).toBe(200)
    expect(await lastMailTo(E.saeed!, 'booking-cancelled')).toBeDefined()
  })

  test('lobby states: early → waiting/ready → closed; cancelled', async () => {
    const c = await as(E.saeed!, app)
    const url = `/api/bookings/${seed.m.bookings.B2}/session`
    const early = await c.get(url)
    expect(early.status).toBe(200)
    expect(SessionState.parse(early.body)).toMatchObject({
      status: 'confirmed',
      lobbyState: 'early',
      startsAt: '2026-10-12T07:00:00.000Z',
      canJoinFrom: '2026-10-12T06:50:00.000Z',
    })
    setNow('2026-10-12T06:55:00Z')
    expect((await c.get(url)).body.lobbyState).toBe('waiting')
    await db
      .update(mentorBookings)
      .set({ mentorJoinedAt: new Date('2026-10-12T06:54:00Z') })
      .where(eq(mentorBookings.id, seed.m.bookings.B2))
    expect((await c.get(url)).body.lobbyState).toBe('ready')
    setNow('2026-10-12T08:01:00Z')
    expect((await c.get(url)).body.lobbyState).toBe('closed')
    expect((await (await as(E.hessa!, app)).get(url)).status).toBe(200)
    expect((await (await as(E.reem!, app)).get(url)).status).toBe(404)
    const b3 = await (await as(E.reem!, app)).get(`/api/bookings/${seed.m.bookings.B3}/session`)
    expect(b3.body.lobbyState).toBe('cancelled')
  })

  test('session token: outside window 409; inside window Zoom stub 503; provider on → token', async () => {
    const c = await as(E.saeed!, app)
    const url = `/api/bookings/${seed.m.bookings.B2}/session/token`
    expect((await c.post(url).send({})).status).toBe(409)
    setNow('2026-10-12T06:55:00Z')
    const off = await c.post(url).send({})
    expect(off.status).toBe(503)
    expect(off.body.error.code).toBe('feature_off')
    expect((await (await as(E.reem!, app)).post(url).send({})).status).toBe(404)

    setVideoProvider({
      enabled: true,
      verifyWebhook: () => true,
      sessionToken: async (i) => ({
        sdkKey: 'key',
        signature: `sig-${i.role}`,
        sessionName: i.sessionName,
        userName: i.userName,
        expiresAt: '2026-10-12T08:15:00.000Z',
      }),
    })
    const on = await c.post(url).send({})
    expect(on.status).toBe(200)
    expect(SessionToken.parse(on.body)).toMatchObject({
      sessionName: `dct-${seed.m.bookings.B2}`,
      userName: 'Saeed Al Hammadi',
      signature: 'sig-0',
    })
    const mentor = await (await as(E.hessa!, app)).post(url).send({})
    expect(mentor.body.signature).toBe('sig-1')
  })

  test('mentee feedback: after start only, once, 422 rating, own only', async () => {
    const c = await as(E.saeed!, app)
    const b2 = `/api/bookings/${seed.m.bookings.B2}/feedback`
    expect((await c.post(b2).send({ rating: 5, attendance: 'attended' })).status).toBe(409)
    expect((await c.post(b2).send({ rating: 9, attendance: 'maybe' })).status).toBe(422)
    // B1 already has Saeed's feedback.
    expect(
      (
        await c
          .post(`/api/bookings/${seed.m.bookings.B1}/feedback`)
          .send({ rating: 4, attendance: 'attended' })
      ).status,
    ).toBe(409)
    setNow('2026-10-12T08:10:00Z')
    const ok = await c
      .post(b2)
      .send({ rating: 4, comment: 'Useful <script>x</script>', attendance: 'attended' })
    expect(ok.status).toBe(201)
    expect(ok.body.id).toBeString()
    expect(
      (await (await as(E.reem!, app)).post(b2).send({ rating: 4, attendance: 'attended' })).status,
    ).toBe(404)
    await expectDenied(app, (x) => x.post(b2).send({ rating: 4, attendance: 'attended' }), {
      signedOut: null,
      mentor: E.hessa!,
    })
  })

  test('GET /api/me/grow-logs: the mentee reads own logs only', async () => {
    const c = await as(E.saeed!, app)
    const res = await c.get('/api/me/grow-logs')
    expect(res.status).toBe(200)
    const page = GrowLogsPage.parse(res.body)
    expect(page.items).toHaveLength(1)
    expect(page.items[0]).toMatchObject({
      bookingId: seed.m.bookings.B1,
      sessionNo: 1,
      sessionDate: '2026-09-28',
      goal: 'Lead a small exhibition project by Q2 2027',
    })
    expect((await (await as(E.reem!, app)).get('/api/me/grow-logs')).body.total).toBe(0)
    await expectDenied(app, (x) => x.get('/api/me/grow-logs'), {
      signedOut: null,
      admin: E.aisha!,
      mentor: E.hessa!,
    })
  })
})

describe('§9.3 jobs and the Zoom webhook', () => {
  test('session reminders: 24 h then 1 h, each once, to both sides', async () => {
    const { runSchedule } = await import('@server/jobs/runtime')
    setNow('2026-10-11T08:00:00Z')
    expect(await runSchedule('mentoring.session_reminders')).toBe(1)
    expect(await runSchedule('mentoring.session_reminders')).toBe(0)
    const mail = await lastMailTo(E.saeed!, 'session-reminder')
    expect(mail?.data.inLabel).toBe('24 hours')
    expect(await lastMailTo(E.hessa!, 'session-reminder')).toBeDefined()
    setNow('2026-10-12T06:15:00Z')
    expect(await runSchedule('mentoring.session_reminders')).toBe(1)
    expect((await lastMailTo(E.saeed!, 'session-reminder'))?.data.inLabel).toBe('1 hour')
    const reminders = (await deliveredMail()).filter((m) => m.template === 'session-reminder')
    expect(reminders).toHaveLength(4)
  })

  test('auto-complete: confirmed sessions close 2 h after end (Zoom off → completed)', async () => {
    const { runSchedule } = await import('@server/jobs/runtime')
    setNow('2026-10-12T09:59:00Z')
    expect(await runSchedule('mentoring.auto_complete')).toBe(0)
    setNow('2026-10-12T10:00:00Z')
    expect(await runSchedule('mentoring.auto_complete')).toBe(1)
    expect((await booking(seed.m.bookings.B2)).status).toBe('completed')
  })

  test('webhook: bad signature 401; joins recorded; Zoom on → completed only if both joined', async () => {
    const c = await as(E.saeed!, app)
    const anonPost = (payload: object, sig = 'v0=bad') =>
      c
        .post('/api/webhooks/zoom')
        .set('x-zm-signature', sig)
        .set('x-zm-request-timestamp', '1')
        .send(payload)
    const joined = (name: string, id: string) => ({
      event: 'session.user_joined',
      payload: { object: { session_name: `dct-${id}`, participant: { user_name: name } } },
    })
    const bad = await anonPost(joined('Saeed Al Hammadi', seed.m.bookings.B2))
    expect(bad.status).toBe(401)

    setVideoProvider({ ...zoomProvider, enabled: true, verifyWebhook: () => true })
    const validation = await anonPost(
      { event: 'endpoint.url_validation', payload: { plainToken: 'abc' } },
      'v0=good',
    )
    expect(validation.status).toBe(200)
    expect(validation.body.plainToken).toBe('abc')
    expect(validation.body.encryptedToken).toMatch(/^[0-9a-f]{64}$/)
    await joinElevate(seed, 'mona', 'hessa')
    const mona = await as(E.mona!, app)
    const other = await mona
      .post('/api/bookings')
      .send({ mentorId: seed.m.mentors.hessa, startsAt: '2026-10-07T06:00:00Z' })
    expect(other.status).toBe(201)

    for (const [name, id] of [
      ['Saeed Al Hammadi', seed.m.bookings.B2],
      ['Dr. Hessa Al Nuaimi', seed.m.bookings.B2],
      ['Mona Al Ameri', other.body.bookingId],
    ] as const) {
      const r = await anonPost(joined(name, id), 'v0=good')
      expect(r.status).toBe(200)
      expect(r.body).toEqual({ ok: true })
    }
    const b2 = await booking(seed.m.bookings.B2)
    expect(b2.menteeJoinedAt).not.toBeNull()
    expect(b2.mentorJoinedAt).not.toBeNull()

    const { runSchedule } = await import('@server/jobs/runtime')
    setNow('2026-10-12T10:00:00Z')
    expect(await runSchedule('mentoring.auto_complete')).toBe(2)
    expect((await booking(seed.m.bookings.B2)).status).toBe('completed')
    expect((await booking(other.body.bookingId)).status).toBe('no_show')
  })
})
