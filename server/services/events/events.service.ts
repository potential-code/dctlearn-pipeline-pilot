import { type DbOrTx, db } from '@server/db/connection'
import { type EventRow, eventAudiences, events } from '@server/db/schema/events'
import { users } from '@server/db/schema/identity'
import { type Microsite, memberships, microsites } from '@server/db/schema/microsites'
import { recordAudit } from '@server/lib/audit'
import { now } from '@server/lib/clock'
import { conflict, notFound } from '@server/lib/errors'
import { assertIfMatch } from '@server/lib/if-match'
import { paged, pageWindow } from '@server/lib/pagination'
import { sanitizeI18nRich } from '@server/lib/sanitize'
import { urlForStored } from '@server/services/files.service'
import { toUserDto } from '@server/services/identity/user-dto'
import { toMicrositeRef } from '@server/services/microsites/lookup.service'
import type { PaginationInput } from '@shared/schemas/common'
import type { AdminEventsQuery, EventInput, WorkshopsQuery } from '@shared/schemas/events'
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  sql,
} from 'drizzle-orm'
import type { z } from 'zod'
import { micrositeIdsForSlugs, slugsById } from './audience'
import { pastCutoff, statusOf, upcomingCutoff } from './phase'

/** P57 admin events, P52 workshops tab, P14 events section. Create / cancel are audited. */

const live = isNull(events.deletedAt)

async function findEvent(id: string, tx: DbOrTx = db, lock = false) {
  const q = tx
    .select()
    .from(events)
    .where(and(eq(events.id, id), live))
  const [row] = lock ? await q.for('update') : await q
  if (!row) throw notFound()
  return row
}

async function audienceIds(eventIds: string[], tx: DbOrTx = db) {
  const map = new Map<string, string[]>()
  if (eventIds.length === 0) return map
  const rows = await tx
    .select()
    .from(eventAudiences)
    .where(inArray(eventAudiences.eventId, eventIds))
  for (const r of rows) map.set(r.eventId, [...(map.get(r.eventId) ?? []), r.micrositeId])
  return map
}

async function toAdminEvent(row: EventRow, micrositeIds: string[], viewerId: string) {
  const slugs = await slugsById(micrositeIds)
  const imageUrl = await urlForStored(row.imageUrl, viewerId)
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    ...(row.venue ? { venue: row.venue } : {}),
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    timezone: row.timezone,
    ...(row.zoomUrl ? { zoomUrl: row.zoomUrl } : {}),
    ...(row.recordingUrl ? { recordingUrl: row.recordingUrl } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    status: statusOf(row),
    audiences: micrositeIds
      .map((id) => slugs.get(id))
      .filter((s): s is string => Boolean(s))
      .sort()
      .map((micrositeId) => ({ micrositeId })),
  }
}

async function adminDto(id: string, viewerId: string) {
  const row = await findEvent(id)
  return toAdminEvent(row, (await audienceIds([id])).get(id) ?? [], viewerId)
}

function statusFilter(status: z.infer<typeof AdminEventsQuery>['status']) {
  const at = now()
  switch (status) {
    case 'cancelled':
      return isNotNull(events.cancelledAt)
    case 'upcoming':
      return and(isNull(events.cancelledAt), gt(events.startsAt, upcomingCutoff(at)))
    case 'live':
      return and(
        isNull(events.cancelledAt),
        lte(events.startsAt, upcomingCutoff(at)),
        gte(events.endsAt, pastCutoff(at)),
      )
    case 'past':
      return and(isNull(events.cancelledAt), lt(events.endsAt, pastCutoff(at)))
    default:
      return undefined
  }
}

export async function listAdminEvents(query: z.infer<typeof AdminEventsQuery>, viewer: Viewer) {
  const where = and(
    live,
    statusFilter(query.status),
    query.q
      ? sql`${events.title}->>'en' ilike ${`%${query.q.replace(/[%_\\]/g, '\\$&')}%`}`
      : undefined,
  )
  const [total] = await db.select({ n: count() }).from(events).where(where)
  const rows = await db
    .select()
    .from(events)
    .where(where)
    .orderBy(desc(events.startsAt))
    .limit(pageWindow(query).limit)
    .offset(pageWindow(query).offset)
  const audiences = await audienceIds(rows.map((r) => r.id))
  const items = await Promise.all(
    rows.map((r) => toAdminEvent(r, audiences.get(r.id) ?? [], viewer.id)),
  )
  return paged(items, total?.n ?? 0, query)
}

function values(input: EventInput) {
  return {
    title: input.title,
    description: sanitizeI18nRich(input.description),
    category: input.category,
    venue: input.venue || null,
    startsAt: new Date(input.startsAt),
    endsAt: new Date(input.endsAt),
    timezone: input.timezone,
    zoomUrl: input.zoomUrl || null,
    recordingUrl: input.recordingUrl || null,
    imageUrl: input.imageUrl || null,
  }
}

async function setAudiences(tx: DbOrTx, eventId: string, slugs: string[]) {
  const ids = await micrositeIdsForSlugs(slugs, 'audiences', tx)
  await tx.delete(eventAudiences).where(eq(eventAudiences.eventId, eventId))
  if (ids.length)
    await tx.insert(eventAudiences).values(ids.map((micrositeId) => ({ eventId, micrositeId })))
}

export async function createEvent(input: EventInput, viewer: Viewer) {
  const id = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(events)
      .values({ ...values(input), createdById: viewer.id })
      .returning()
    await setAudiences(
      tx,
      row!.id,
      input.audiences.map((a) => a.micrositeId),
    )
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'event.create',
      target: { type: 'event', id: row!.id, label: input.title.en },
      ip: viewer.ip,
    })
    return row!.id
  })
  return adminDto(id, viewer.id)
}

export async function updateEvent(id: string, input: EventInput, viewer: Viewer) {
  await db.transaction(async (tx) => {
    const row = await findEvent(id, tx, true)
    if (row.cancelledAt) throw conflict('A cancelled event cannot be edited')
    assertIfMatch(row.updatedAt, input.ifMatch)
    await tx.update(events).set(values(input)).where(eq(events.id, id))
    await setAudiences(
      tx,
      id,
      input.audiences.map((a) => a.micrositeId),
    )
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'event.update',
      target: { type: 'event', id, label: input.title.en },
      ip: viewer.ip,
    })
  })
  return adminDto(id, viewer.id)
}

/** Soft delete (§9.2). */
export async function deleteEvent(id: string, viewer: Viewer) {
  await db.transaction(async (tx) => {
    const row = await findEvent(id, tx, true)
    await tx.update(events).set({ deletedAt: now() }).where(eq(events.id, id))
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'event.delete',
      target: { type: 'event', id, label: row.title.en },
      ip: viewer.ip,
    })
  })
}

/** §9.1 `upcoming → cancelled` only (live, past or already cancelled → 409). Audited. */
export async function cancelEvent(id: string, reason: string, viewer: Viewer) {
  await db.transaction(async (tx) => {
    const row = await findEvent(id, tx, true)
    if (statusOf(row) !== 'upcoming') throw conflict('Only upcoming events can be cancelled')
    await tx
      .update(events)
      .set({ cancelledAt: now(), cancelReason: reason })
      .where(eq(events.id, id))
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'event.cancel',
      target: { type: 'event', id, label: row.title.en },
      ip: viewer.ip,
      meta: { reason },
    })
  })
  return adminDto(id, viewer.id)
}

export async function setRecording(
  id: string,
  input: { url: string; publish: boolean },
  viewer: Viewer,
) {
  await db.transaction(async (tx) => {
    const row = await findEvent(id, tx, true)
    if (row.cancelledAt) throw conflict('A cancelled event has no recording')
    await tx
      .update(events)
      .set({ recordingUrl: input.url, recordingPublished: input.publish })
      .where(eq(events.id, id))
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'event.recording',
      target: { type: 'event', id, label: row.title.en },
      ip: viewer.ip,
      meta: { publish: input.publish },
    })
  })
  return adminDto(id, viewer.id)
}

/** Participants = members of the audience microsites (no RSVP); one row per membership. */
export async function listParticipants(id: string, query: PaginationInput, viewer: Viewer) {
  await findEvent(id)
  const ids = (await audienceIds([id])).get(id) ?? []
  if (ids.length === 0) return paged([], 0, query)
  const where = inArray(memberships.micrositeId, ids)
  const [total] = await db.select({ n: count() }).from(memberships).where(where)
  const rows = await db
    .select({ user: users, microsite: microsites })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .innerJoin(microsites, eq(microsites.id, memberships.micrositeId))
    .where(where)
    .orderBy(asc(users.name), asc(microsites.slug))
    .limit(pageWindow(query).limit)
    .offset(pageWindow(query).offset)
  const items = await Promise.all(
    rows.map(async (r) => ({
      ...(await toUserDto(r.user, viewer.id)),
      microsite: await toMicrositeRef(r.microsite, viewer.id),
    })),
  )
  return paged(items, total?.n ?? 0, query)
}

/* ------------------------------------------------------------------ learner */

function forMicrosite(micrositeId: string) {
  return and(
    live,
    inArray(
      events.id,
      db
        .select({ id: eventAudiences.eventId })
        .from(eventAudiences)
        .where(eq(eventAudiences.micrositeId, micrositeId)),
    ),
  )
}

/** Learner view: join link only while live; recording only once published. */
async function learnerFields(row: EventRow, viewerId: string) {
  const status = statusOf(row)
  const imageUrl = await urlForStored(row.imageUrl, viewerId)
  return {
    status,
    joinUrl: status === 'live' && row.zoomUrl ? row.zoomUrl : undefined,
    recordingUrl:
      status !== 'cancelled' && row.recordingPublished && row.recordingUrl
        ? row.recordingUrl
        : undefined,
    imageUrl: imageUrl || undefined,
  }
}

/** P52 workshops: `upcoming` = not yet past (incl. live and cancelled), soonest first; `past` newest first. */
export async function listWorkshops(
  viewer: Viewer,
  m: Microsite,
  query: z.infer<typeof WorkshopsQuery>,
) {
  const cutoff = pastCutoff()
  const where = and(
    forMicrosite(m.id),
    query.when === 'past' ? lt(events.endsAt, cutoff) : gte(events.endsAt, cutoff),
  )
  const [total] = await db.select({ n: count() }).from(events).where(where)
  const rows = await db
    .select()
    .from(events)
    .where(where)
    .orderBy(query.when === 'past' ? desc(events.startsAt) : asc(events.startsAt))
    .limit(pageWindow(query).limit)
    .offset(pageWindow(query).offset)
  const items = await Promise.all(
    rows.map(async (r) => {
      const f = await learnerFields(r, viewer.id)
      return {
        id: r.id,
        title: r.title,
        category: r.category,
        ...(r.venue ? { venue: r.venue } : {}),
        startsAt: r.startsAt.toISOString(),
        endsAt: r.endsAt.toISOString(),
        status: f.status,
        ...(f.joinUrl ? { zoomUrl: f.joinUrl } : {}),
        ...(f.recordingUrl ? { recordingUrl: f.recordingUrl } : {}),
        ...(f.imageUrl ? { imageUrl: f.imageUrl } : {}),
      }
    }),
  )
  return paged(items, total?.n ?? 0, query)
}

/** P14 events: the next 3 not yet past (live first by start time). */
export async function dashboardEvents(viewer: Viewer, m: Microsite) {
  const rows = await db
    .select()
    .from(events)
    .where(and(forMicrosite(m.id), gte(events.endsAt, pastCutoff())))
    .orderBy(asc(events.startsAt))
    .limit(3)
  return Promise.all(
    rows.map(async (r) => {
      const f = await learnerFields(r, viewer.id)
      return {
        id: r.id,
        title: r.title,
        startsAt: r.startsAt.toISOString(),
        status: f.status,
        ...(f.joinUrl ? { joinUrl: f.joinUrl } : {}),
      }
    }),
  )
}
