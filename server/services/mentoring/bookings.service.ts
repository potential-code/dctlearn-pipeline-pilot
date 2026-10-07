import { createHmac } from 'node:crypto'
import { env } from '@server/config/env'
import { type DbOrTx, db } from '@server/db/connection'
import { users } from '@server/db/schema/identity'
import {
  bookingFeedback,
  type MentorBooking,
  mentorBookings,
  mentorMatches,
} from '@server/db/schema/mentoring'
import { now } from '@server/lib/clock'
import { conflict, HttpError, locked, notFound, validationFailed } from '@server/lib/errors'
import { sanitizeText } from '@server/lib/sanitize'
import { videoProvider } from '@server/services/providers/video.provider'
import type {
  BookingCreated,
  BookingInput,
  MenteeFeedbackInput,
  MentorFeedbackInput,
  SessionState,
} from '@shared/schemas/mentoring'
import { and, eq, gt, inArray, isNull, lte } from 'drizzle-orm'
import type { z } from 'zod'
import { bookingForParty, joinUrlFor, visibleMentor } from './access.service'
import { mentorRowById } from './cards.service'
import { lockKey } from './locks'
import { notifyBooking } from './notify'
import { freeSlots, SLOT_MINUTES } from './slots.service'
import { addMinutes } from './time'

/**
 * Booking state machine (contract §9.1):
 * requested → confirmed (mentor, or at once when slots come from availability)
 * requested/confirmed → cancelled (either side, up to 2 h before start)
 * confirmed → completed / no_show (mentor feedback or no-show, or the job 2 h after end)
 * Every move is a guarded UPDATE (`WHERE status = …`); anything else is 409.
 */

export const CANCEL_CUTOFF_MINUTES = 120
export const JOIN_EARLY_MINUTES = 10
export const AUTO_COMPLETE_AFTER_MINUTES = 120
const SLOT_TAKEN = 'This slot was just taken'

function isUniqueViolation(error: unknown): boolean {
  let e: unknown = error
  for (let i = 0; i < 4 && e; i++) {
    if ((e as { code?: string }).code === '23505') return true
    e = (e as { cause?: unknown }).cause
  }
  return false
}

/* ------------------------------------------------------------------ create */

export async function createBooking(
  viewer: Viewer,
  input: z.infer<typeof BookingInput>,
): Promise<z.infer<typeof BookingCreated>> {
  const startsAt = new Date(input.startsAt)
  try {
    return await db.transaction(async (tx) => {
      const { row, bookableIn } = await visibleMentor(viewer, input.mentorId, tx)
      if (bookableIn.length === 0) throw notFound()
      const profile = row.profile
      const [match] = await tx
        .select()
        .from(mentorMatches)
        .where(
          and(
            eq(mentorMatches.menteeId, viewer.id),
            eq(mentorMatches.mentorId, profile.id),
            eq(mentorMatches.status, 'active'),
            inArray(
              mentorMatches.micrositeId,
              bookableIn.map((m) => m.id),
            ),
          ),
        )
      if (!match) throw conflict('You can book sessions with your matched mentor only')
      // Serialise bookings per mentor; the partial unique index is the backstop (§9.4).
      await lockKey(tx, `booking:${profile.id}`)

      const slots = await freeSlots(profile, startsAt, addMinutes(startsAt, SLOT_MINUTES), tx)
      if (!slots.some((s) => s.startsAt.getTime() === startsAt.getTime())) {
        const [taken] = await tx
          .select({ id: mentorBookings.id })
          .from(mentorBookings)
          .where(
            and(
              eq(mentorBookings.mentorId, profile.id),
              eq(mentorBookings.startsAt, startsAt),
              inArray(mentorBookings.status, ['requested', 'confirmed', 'completed', 'no_show']),
            ),
          )
        if (taken) throw conflict(SLOT_TAKEN)
        throw validationFailed({ startsAt: 'Not an available slot' })
      }

      const status = profile.autoConfirm ? 'confirmed' : 'requested'
      const t = now()
      const [booking] = await tx
        .insert(mentorBookings)
        .values({
          mentorId: profile.id,
          menteeId: viewer.id,
          micrositeId: match.micrositeId,
          startsAt,
          endsAt: addMinutes(startsAt, SLOT_MINUTES),
          status,
          topic: input.topic ? sanitizeText(input.topic) : null,
          confirmedAt: status === 'confirmed' ? t : null,
        })
        .returning()
      await notifyBooking(
        tx,
        status === 'confirmed' ? 'booking-confirmed' : 'booking-requested',
        booking!,
      )
      return { bookingId: booking!.id, status }
    })
  } catch (error) {
    if (isUniqueViolation(error)) throw conflict(SLOT_TAKEN)
    throw error
  }
}

/* ------------------------------------------------------------------ transitions */

async function move(
  tx: DbOrTx,
  booking: MentorBooking,
  from: string[],
  set: Partial<typeof mentorBookings.$inferInsert>,
) {
  const [row] = await tx
    .update(mentorBookings)
    .set(set)
    .where(and(eq(mentorBookings.id, booking.id), inArray(mentorBookings.status, from)))
    .returning()
  if (!row) throw conflict('This session can no longer change to that state')
  return row
}

export async function cancelBooking(viewer: Viewer, id: string, reason?: string) {
  return db.transaction(async (tx) => {
    const { booking } = await bookingForParty(viewer, id, tx, { lock: true })
    if (booking.status !== 'requested' && booking.status !== 'confirmed')
      throw conflict('This session can no longer be cancelled')
    if (now() > addMinutes(booking.startsAt, -CANCEL_CUTOFF_MINUTES))
      throw locked('Sessions can be cancelled up to 2 hours before the start')
    const clean = reason ? sanitizeText(reason) : null
    const row = await move(tx, booking, ['requested', 'confirmed'], {
      status: 'cancelled',
      cancelledAt: now(),
      cancelledById: viewer.id,
      cancelReason: clean,
    })
    await notifyBooking(tx, 'booking-cancelled', row, { cancelledBy: viewer.name, reason: clean })
    return { bookingId: row.id, status: 'cancelled' as const }
  })
}

export async function confirmBooking(viewer: Viewer, id: string) {
  return db.transaction(async (tx) => {
    const { booking } = await bookingForParty(viewer, id, tx, { lock: true, side: 'mentor' })
    if (booking.status !== 'requested') throw conflict('Only requested sessions can be confirmed')
    const row = await move(tx, booking, ['requested'], { status: 'confirmed', confirmedAt: now() })
    await notifyBooking(tx, 'booking-confirmed', row)
    return { bookingId: row.id, status: 'confirmed' as const }
  })
}

export async function markNoShow(viewer: Viewer, id: string) {
  return db.transaction(async (tx) => {
    const { booking } = await bookingForParty(viewer, id, tx, { lock: true, side: 'mentor' })
    if (booking.status !== 'confirmed') throw conflict('Only confirmed sessions can be marked')
    if (now() < booking.startsAt) throw locked('The session has not started yet')
    const row = await move(tx, booking, ['confirmed'], { status: 'no_show', completedAt: now() })
    return { bookingId: row.id, status: 'no_show' as const }
  })
}

/* ------------------------------------------------------------------ session lobby / token */

function lobbyState(b: MentorBooking, side: 'mentee' | 'mentor') {
  const t = now()
  const canJoinFrom = addMinutes(b.startsAt, -JOIN_EARLY_MINUTES)
  if (b.status === 'cancelled') return 'cancelled' as const
  if (b.status === 'completed' || b.status === 'no_show' || t >= b.endsAt) return 'closed' as const
  if (t < canJoinFrom) return 'early' as const
  if (b.status !== 'confirmed') return 'waiting' as const
  const otherJoined = side === 'mentee' ? b.mentorJoinedAt : b.menteeJoinedAt
  return otherJoined ? ('ready' as const) : ('waiting' as const)
}

export async function sessionState(
  viewer: Viewer,
  id: string,
): Promise<z.infer<typeof SessionState>> {
  const { booking, side } = await bookingForParty(viewer, id)
  const state = lobbyState(booking, side)
  const open = booking.status === 'confirmed' && state !== 'closed'
  return {
    status: booking.status as 'confirmed',
    ...(open ? { joinUrl: joinUrlFor(booking.id) } : {}),
    startsAt: booking.startsAt.toISOString(),
    canJoinFrom: addMinutes(booking.startsAt, -JOIN_EARLY_MINUTES).toISOString(),
    lobbyState: state,
  }
}

export function sessionNameFor(bookingId: string) {
  return `dct-${bookingId}`
}

/** Zoom Video SDK token, only inside the join window of a confirmed session. */
export async function sessionToken(viewer: Viewer, id: string) {
  const { booking, side } = await bookingForParty(viewer, id)
  const state = lobbyState(booking, side)
  if (booking.status !== 'confirmed' || (state !== 'ready' && state !== 'waiting'))
    throw locked('The session room is not open')
  const ttl = Math.max(
    60,
    Math.ceil((addMinutes(booking.endsAt, 15).getTime() - now().getTime()) / 1000),
  )
  return videoProvider().sessionToken({
    sessionName: sessionNameFor(booking.id),
    userName: viewer.name,
    role: side === 'mentor' ? 1 : 0,
    ttlSeconds: ttl,
  })
}

/* ------------------------------------------------------------------ feedback */

async function insertFeedback(
  tx: DbOrTx,
  values: typeof bookingFeedback.$inferInsert,
): Promise<string> {
  const [existing] = await tx
    .select({ id: bookingFeedback.id })
    .from(bookingFeedback)
    .where(
      and(eq(bookingFeedback.bookingId, values.bookingId), eq(bookingFeedback.side, values.side)),
    )
  if (existing) throw conflict('Feedback for this session was already given')
  const [row] = await tx
    .insert(bookingFeedback)
    .values(values)
    .onConflictDoNothing()
    .returning({ id: bookingFeedback.id })
  if (!row) throw conflict('Feedback for this session was already given')
  return row.id
}

const FEEDBACK_STATUSES = ['confirmed', 'completed', 'no_show']

export async function menteeFeedback(
  viewer: Viewer,
  id: string,
  input: z.infer<typeof MenteeFeedbackInput>,
) {
  return db.transaction(async (tx) => {
    const { booking } = await bookingForParty(viewer, id, tx, { lock: true, side: 'mentee' })
    if (!FEEDBACK_STATUSES.includes(booking.status) || now() < booking.startsAt)
      throw locked('Feedback opens once the session has started')
    const fid = await insertFeedback(tx, {
      bookingId: booking.id,
      authorId: viewer.id,
      side: 'mentee',
      rating: input.rating,
      attendance: input.attendance,
      comment: input.comment ? sanitizeText(input.comment) : null,
    })
    return { id: fid }
  })
}

/** Mentor feedback also closes a confirmed session: attended → completed, no_show → no_show. */
export async function mentorFeedback(
  viewer: Viewer,
  id: string,
  input: z.infer<typeof MentorFeedbackInput>,
) {
  return db.transaction(async (tx) => {
    const { booking } = await bookingForParty(viewer, id, tx, { lock: true, side: 'mentor' })
    if (!FEEDBACK_STATUSES.includes(booking.status) || now() < booking.startsAt)
      throw locked('Feedback opens once the session has started')
    const fid = await insertFeedback(tx, {
      bookingId: booking.id,
      authorId: viewer.id,
      side: 'mentor',
      rating: input.rating,
      attendance: input.attendance,
      comment: input.note ? sanitizeText(input.note) : null,
    })
    if (booking.status === 'confirmed')
      await move(tx, booking, ['confirmed'], {
        status: input.attendance === 'attended' ? 'completed' : 'no_show',
        completedAt: now(),
      })
    return { id: fid }
  })
}

/* ------------------------------------------------------------------ jobs */

/**
 * Every 15 min (§9.3): confirmed sessions that ended ≥ 2 h ago close. With Zoom on, both
 * parties must have joined (webhook) for `completed`, otherwise `no_show`; with Zoom off there is
 * no attendance signal, so they complete.
 */
export async function autoCompleteBookings() {
  const cutoff = addMinutes(now(), -AUTO_COMPLETE_AFTER_MINUTES)
  const due = await db
    .select()
    .from(mentorBookings)
    .where(and(eq(mentorBookings.status, 'confirmed'), lte(mentorBookings.endsAt, cutoff)))
  const zoom = videoProvider().enabled
  let moved = 0
  for (const b of due) {
    const both = Boolean(b.mentorJoinedAt && b.menteeJoinedAt)
    const status = !zoom || both ? 'completed' : 'no_show'
    const rows = await db
      .update(mentorBookings)
      .set({ status, completedAt: now() })
      .where(and(eq(mentorBookings.id, b.id), eq(mentorBookings.status, 'confirmed')))
      .returning({ id: mentorBookings.id })
    moved += rows.length
  }
  return moved
}

/** Session reminders 24 h and 1 h before each confirmed booking (§9.3); each sent once. */
export async function sendSessionReminders() {
  const t = now()
  let sent = 0
  const windows = [
    { col: 'reminder1hSentAt' as const, from: t, to: addMinutes(t, 60), label: '1 hour' },
    {
      col: 'reminder24hSentAt' as const,
      from: addMinutes(t, 60),
      to: addMinutes(t, 24 * 60),
      label: '24 hours',
    },
  ]
  for (const w of windows) {
    const column = mentorBookings[w.col]
    const due = await db
      .select({ id: mentorBookings.id })
      .from(mentorBookings)
      .where(
        and(
          eq(mentorBookings.status, 'confirmed'),
          isNull(column),
          gt(mentorBookings.startsAt, w.from),
          lte(mentorBookings.startsAt, w.to),
        ),
      )
    for (const { id } of due) {
      await db.transaction(async (tx) => {
        const set =
          w.col === 'reminder1hSentAt'
            ? { reminder1hSentAt: t, reminder24hSentAt: t }
            : { reminder24hSentAt: t }
        const [row] = await tx
          .update(mentorBookings)
          .set(set)
          .where(and(eq(mentorBookings.id, id), isNull(column)))
          .returning()
        if (!row) return
        await notifyBooking(tx, 'session-reminder', row, { inLabel: w.label })
        sent++
      })
    }
  }
  return sent
}

/* ------------------------------------------------------------------ Zoom webhook */

type ZoomEvent = {
  event?: string
  payload?: {
    plainToken?: string
    object?: { session_name?: string; participant?: { user_name?: string } }
  }
}

/**
 * `POST /api/webhooks/zoom`: HMAC-verified (401 otherwise). Answers Zoom's URL validation and
 * records attendance from `session.user_joined` (participant name = the name we signed with).
 */
export async function handleZoomWebhook(
  rawBody: string,
  body: ZoomEvent,
  signature: string | undefined,
  timestamp: string | undefined,
) {
  if (!videoProvider().verifyWebhook(rawBody, signature, timestamp))
    throw new HttpError(401, 'unauthenticated', 'Invalid webhook signature')
  if (body.event === 'endpoint.url_validation' && body.payload?.plainToken) {
    const plainToken = body.payload.plainToken
    const encryptedToken = createHmac('sha256', env.ZOOM_WEBHOOK_SECRET ?? '')
      .update(plainToken)
      .digest('hex')
    return { plainToken, encryptedToken }
  }
  if (body.event !== 'session.user_joined') return { ok: true as const }
  const name = body.payload?.object?.session_name ?? ''
  const match = /^dct-([0-9a-f-]{36})$/i.exec(name)
  const userName = body.payload?.object?.participant?.user_name
  if (!match || !userName) return { ok: true as const }
  const [b] = await db
    .select({
      booking: mentorBookings,
      menteeName: users.name,
    })
    .from(mentorBookings)
    .innerJoin(users, eq(users.id, mentorBookings.menteeId))
    .where(eq(mentorBookings.id, match[1]!))
  if (!b) return { ok: true as const }
  const mentor = await mentorRowById(b.booking.mentorId)
  const set =
    userName === b.menteeName
      ? { menteeJoinedAt: b.booking.menteeJoinedAt ?? now() }
      : userName === mentor?.name
        ? { mentorJoinedAt: b.booking.mentorJoinedAt ?? now() }
        : null
  if (set) await db.update(mentorBookings).set(set).where(eq(mentorBookings.id, b.booking.id))
  return { ok: true as const }
}
