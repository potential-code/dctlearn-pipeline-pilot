import { beforeEach, describe, expect, test } from 'bun:test'
import { db } from '@server/db/connection'
import { events } from '@server/db/schema/events'
import { auditLog } from '@server/db/schema/identity'
import { E } from '@server/db/seed/data'
import { setNow } from '@server/lib/clock'
import {
  AdminEvent,
  AdminEventsPage,
  ParticipantsPage,
  WorkshopsPage,
} from '@shared/schemas/events'
import { DashboardResponse } from '@shared/schemas/microsites'
import { eq } from 'drizzle-orm'
import { expectDenied } from '../helpers/denials'
import { as } from '../helpers/http'
import { app, freshContent, hub } from './helpers'

let seeded: Awaited<ReturnType<typeof freshContent>>
beforeEach(async () => {
  seeded = await freshContent()
})

const newEvent = (over: Record<string, unknown> = {}) => ({
  title: { en: 'Heritage Walk', ar: 'جولة تراثية' },
  description: { en: 'A walk', ar: '' },
  category: 'Workshops',
  startsAt: '2026-10-20T06:00:00Z',
  endsAt: '2026-10-20T08:00:00Z',
  timezone: 'Asia/Dubai',
  zoomUrl: 'https://zoom.example/walk',
  audiences: [{ micrositeId: 'employees' }, { micrositeId: 'znm' }],
  ...over,
})

const nonAdmins = {
  signedOut: null,
  learner: E.saeed!,
  subAdmin: E.omar!,
  mentor: E.hessa!,
  judge: E.noura!,
}

describe('P57 admin events', () => {
  test('list shows computed statuses; status filter', async () => {
    const a = await as(E.aisha!, app)
    const res = await a.get('/api/admin/events')
    expect(res.status).toBe(200)
    AdminEventsPage.parse(res.body)
    const byTitle = Object.fromEntries(
      res.body.items.map((e: { title: { en: string }; status: string }) => [e.title.en, e.status]),
    )
    expect(byTitle).toEqual({
      'Mentoring Kick-off Session': 'upcoming',
      'Museum Safety Briefing': 'live',
      'Creative Economy Masterclass': 'past',
    })
    const live = await a.get('/api/admin/events?status=live')
    expect(live.body.total).toBe(1)
    expect((await a.get('/api/admin/events?status=past')).body.items[0].recordingUrl).toBe(
      'https://video.example/masterclass',
    )
    await expectDenied(app, (c) => c.get('/api/admin/events'), nonAdmins)
  })

  test('create (audited), https only, end after start, known microsites', async () => {
    const a = await as(E.aisha!, app)
    const res = await a.post('/api/admin/events').send(newEvent())
    expect(res.status).toBe(201)
    AdminEvent.parse(res.body)
    expect(res.body.status).toBe('upcoming')
    expect(res.body.audiences).toEqual([{ micrositeId: 'employees' }, { micrositeId: 'znm' }])
    const audits = await db.select().from(auditLog).where(eq(auditLog.action, 'event.create'))
    expect(audits).toHaveLength(1)

    const bad = [
      newEvent({ zoomUrl: 'http://zoom.example/x' }),
      newEvent({ recordingUrl: 'javascript:alert(1)' }),
      newEvent({ endsAt: '2026-10-20T05:00:00Z' }),
      newEvent({ audiences: [{ micrositeId: 'nope' }] }),
      newEvent({ audiences: [] }),
      newEvent({ title: { en: '', ar: '' } }),
      newEvent({ timezone: 'Mars/Olympus' }),
    ]
    for (const body of bad) {
      const r = await a.post('/api/admin/events').send(body)
      expect(r.status).toBe(422)
      expect(r.body.error.fields).toBeObject()
    }
    await expectDenied(app, (c) => c.post('/api/admin/events').send(newEvent()), nonAdmins)
  })

  test('update, cancel (§9.1 upcoming → cancelled only, audited), recording, soft delete', async () => {
    const a = await as(E.aisha!, app)
    const { kickoff, safety, masterclass } = seeded.content.events

    const upd = await a
      .put(`/api/admin/events/${kickoff}`)
      .send(newEvent({ audiences: [{ micrositeId: 'elevate' }] }))
    expect(upd.status).toBe(200)
    expect(upd.body.title.en).toBe('Heritage Walk')

    // live and past events cannot be cancelled
    expect((await a.post(`/api/admin/events/${safety}/cancel`).send({ reason: 'x' })).status).toBe(
      409,
    )
    expect(
      (await a.post(`/api/admin/events/${masterclass}/cancel`).send({ reason: 'x' })).status,
    ).toBe(409)
    expect((await a.post(`/api/admin/events/${kickoff}/cancel`).send({})).status).toBe(422)

    const cancelled = await a.post(`/api/admin/events/${kickoff}/cancel`).send({ reason: 'Rain' })
    expect(cancelled.status).toBe(200)
    expect(cancelled.body.status).toBe('cancelled')
    expect(
      (await a.post(`/api/admin/events/${kickoff}/cancel`).send({ reason: 'again' })).status,
    ).toBe(409)
    expect((await a.put(`/api/admin/events/${kickoff}`).send(newEvent())).status).toBe(409)
    const audits = await db.select().from(auditLog).where(eq(auditLog.action, 'event.cancel'))
    expect(audits).toHaveLength(1)

    const rec = await a
      .put(`/api/admin/events/${masterclass}/recording`)
      .send({ url: 'https://video.example/new', publish: true })
    expect(rec.status).toBe(200)
    expect(rec.body.recordingUrl).toBe('https://video.example/new')
    expect(
      (
        await a
          .put(`/api/admin/events/${masterclass}/recording`)
          .send({ url: 'http://video.example/new', publish: true })
      ).status,
    ).toBe(422)

    // soft delete
    expect((await a.delete(`/api/admin/events/${masterclass}`)).status).toBe(204)
    const [row] = await db.select().from(events).where(eq(events.id, masterclass))
    expect(row?.deletedAt).not.toBeNull()
    expect((await a.get('/api/admin/events')).body.total).toBe(2)
    expect((await a.delete(`/api/admin/events/${masterclass}`)).status).toBe(404)
    expect((await a.put(`/api/admin/events/${masterclass}`).send(newEvent())).status).toBe(404)
    expect(
      (await a.get('/api/admin/events/00000000-0000-4000-8000-000000000000/participants')).status,
    ).toBe(404)

    await expectDenied(
      app,
      (c) => c.post(`/api/admin/events/${safety}/cancel`).send({ reason: 'x' }),
      nonAdmins,
    )
    await expectDenied(
      app,
      (c) =>
        c
          .put(`/api/admin/events/${safety}/recording`)
          .send({ url: 'https://v.example', publish: true }),
      nonAdmins,
    )
    await expectDenied(app, (c) => c.delete(`/api/admin/events/${safety}`), nonAdmins)
  })

  test('participants = members of the audience microsites', async () => {
    const a = await as(E.aisha!, app)
    const res = await a.get(`/api/admin/events/${seeded.content.events.safety}/participants`)
    expect(res.status).toBe(200)
    ParticipantsPage.parse(res.body)
    expect(res.body.items.map((u: { email: string }) => u.email).sort()).toEqual(
      [E.reem!, E.yousef!].sort(),
    )
    expect(res.body.items[0].microsite.id).toBe('znm')
    await expectDenied(
      app,
      (c) => c.get(`/api/admin/events/${seeded.content.events.safety}/participants`),
      nonAdmins,
    )
  })
})

describe('P52 workshops tab and P14 events', () => {
  test('upcoming / past, join link only while live, recording only when published', async () => {
    const up = await hub(E.saeed!, 'elevate', 'workshops')
    expect(up.status).toBe(200)
    WorkshopsPage.parse(up.body)
    expect(up.body.items).toHaveLength(1)
    expect(up.body.items[0].status).toBe('upcoming')
    expect(up.body.items[0].zoomUrl).toBeUndefined()

    setNow('2026-10-08T05:50:00Z')
    const live = await hub(E.saeed!, 'elevate', 'workshops', 'when=upcoming')
    expect(live.body.items[0].status).toBe('live')
    expect(live.body.items[0].zoomUrl).toBe('https://zoom.example/kickoff')
    setNow('2026-10-08T07:20:00Z')
    const after = await hub(E.saeed!, 'elevate', 'workshops', 'when=past')
    expect(after.body.items[0].status).toBe('past')
    expect(after.body.items[0].zoomUrl).toBeUndefined()

    const past = await hub(E.mona!, 'employees', 'workshops', 'when=past')
    expect(past.status).toBe(200)
    WorkshopsPage.parse(past.body)
    expect(past.body.items[0].recordingUrl).toBe('https://video.example/masterclass')
    await (await as(E.aisha!, app))
      .put(`/api/admin/events/${seeded.content.events.masterclass}/recording`)
      .send({ url: 'https://video.example/masterclass', publish: false })
    const hidden = await hub(E.mona!, 'employees', 'workshops', 'when=past')
    expect(hidden.body.items[0].recordingUrl).toBeUndefined()

    expect((await hub(E.mona!, 'employees', 'workshops', 'when=soon')).status).toBe(422)
  })

  test('only the audience microsite; tab must be enabled; non-members denied', async () => {
    const znm = await hub(E.yousef!, 'znm', 'workshops')
    expect(znm.body.items.map((e: { title: { en: string } }) => e.title.en)).toEqual([
      'Museum Safety Briefing',
    ])
    expect(znm.body.items[0].venue).toBe('Zayed National Museum, Saadiyat')
    // museopro has no workshops tab
    expect((await hub(E.elise!, 'museopro', 'workshops')).status).toBe(404)
    await expectDenied(app, (c) => c.get('/api/microsites/znm/hub/workshops'), {
      signedOut: null,
      otherLearner: E.mona!,
      mentor: E.hessa!,
      otherSubAdmin: E.omar!,
    })
  })

  test('dashboard events: next 3 not past, cancelled shown as cancelled', async () => {
    const s = await as(E.saeed!, app)
    const dash = await s.get('/api/microsites/elevate/dashboard')
    expect(dash.status).toBe(200)
    DashboardResponse.parse(dash.body)
    expect(dash.body.events).toHaveLength(1)
    expect(dash.body.events[0]).toMatchObject({ status: 'upcoming' })
    await (await as(E.aisha!, app))
      .post(`/api/admin/events/${seeded.content.events.kickoff}/cancel`)
      .send({ reason: 'Postponed' })
    const again = await s.get('/api/microsites/elevate/dashboard')
    expect(again.body.events[0].status).toBe('cancelled')

    const y = await as(E.yousef!, app)
    const znm = await y.get('/api/microsites/znm/dashboard')
    expect(znm.body.events).toEqual([
      expect.objectContaining({ status: 'live', title: expect.any(Object) }),
    ])
  })
})
