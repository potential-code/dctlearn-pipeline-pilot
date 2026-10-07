import { db } from '@server/db/connection'
import { users } from '@server/db/schema/identity'
import {
  bookingFeedback,
  growLogs,
  menteeApplications,
  mentorAvailabilityRules,
  mentorBookings,
  mentorMatches,
  mentorProfiles,
  mentorTimeOff,
} from '@server/db/schema/mentoring'
import { microsites } from '@server/db/schema/microsites'
import { now } from '@server/lib/clock'
import { conflict, locked, notFound, validationFailed } from '@server/lib/errors'
import { sanitizeText } from '@server/lib/sanitize'
import { assertUsableImage, urlForStored } from '@server/services/files.service'
import { toMicrositeRef } from '@server/services/microsites/lookup.service'
import type {
  Availability,
  AvailabilityInput,
  GrowLogInput,
  GrowLogsQuery,
  MentorBookingsList,
  MentorBookingsQuery,
  MentorDashboard,
  MentorProfile,
  MentorProfileInput,
} from '@shared/schemas/mentoring'
import { and, asc, desc, eq, gte, inArray, lte } from 'drizzle-orm'
import type { z } from 'zod'
import { joinUrlFor, ownProfile } from './access.service'
import { mentorRowById, micrositesOf, toMentorCard } from './cards.service'
import { growLogPage } from './learner.service'
import { lockKey } from './locks'
import { notifyApplicationDecision, notifyGrowLog } from './notify'
import { minuteOfDay } from './time'

/**
 * Mentor side (P30, P31): own mentees, bookings, applications and GROW logs only. Mentee data
 * is limited to user id, name and microsite — never e-mail, phone or employee id.
 */

/* ------------------------------------------------------------------ P30 dashboard */

export async function mentorDashboard(viewer: Viewer): Promise<z.infer<typeof MentorDashboard>> {
  const profile = await ownProfile(viewer)
  const row = (await mentorRowById(profile.id))!
  const card = await toMentorCard(row, { viewerId: viewer.id, withNextSlot: true })
  const links = (await micrositesOf([profile.id])).get(profile.id) ?? []
  const t = now()

  const bookings = await db
    .select({ b: mentorBookings, menteeName: users.name })
    .from(mentorBookings)
    .innerJoin(users, eq(users.id, mentorBookings.menteeId))
    .where(eq(mentorBookings.mentorId, profile.id))
    .orderBy(asc(mentorBookings.startsAt))
  const ids = bookings.map((x) => x.b.id)
  const logs = ids.length
    ? await db
        .select({ id: growLogs.id, bookingId: growLogs.bookingId })
        .from(growLogs)
        .where(inArray(growLogs.bookingId, ids))
    : []
  const logByBooking = new Map(logs.map((l) => [l.bookingId, l.id]))
  const feedback = ids.length
    ? await db
        .select({ bookingId: bookingFeedback.bookingId, rating: bookingFeedback.rating })
        .from(bookingFeedback)
        .where(and(inArray(bookingFeedback.bookingId, ids), eq(bookingFeedback.side, 'mentee')))
    : []
  const ratingByBooking = new Map(feedback.map((f) => [f.bookingId, f.rating]))

  const isUpcoming = (b: typeof mentorBookings.$inferSelect) =>
    (b.status === 'requested' || b.status === 'confirmed') && b.endsAt > t
  const upcoming = bookings.filter((x) => isUpcoming(x.b))
  const past = bookings.filter((x) => !isUpcoming(x.b)).reverse()
  const completed = bookings.filter((x) => x.b.status === 'completed')
  const pendingLog = completed.filter((x) => !logByBooking.has(x.b.id))

  const matches = await db
    .select({ match: mentorMatches, name: users.name, m: microsites })
    .from(mentorMatches)
    .innerJoin(users, eq(users.id, mentorMatches.menteeId))
    .innerJoin(microsites, eq(microsites.id, mentorMatches.micrositeId))
    .where(and(eq(mentorMatches.mentorId, profile.id), eq(mentorMatches.status, 'active')))
    .orderBy(desc(mentorMatches.matchedAt))

  const applications = await db
    .select({ a: menteeApplications, name: users.name })
    .from(menteeApplications)
    .innerJoin(users, eq(users.id, menteeApplications.menteeId))
    .where(
      and(eq(menteeApplications.mentorId, profile.id), eq(menteeApplications.status, 'pending')),
    )
    .orderBy(asc(menteeApplications.createdAt))

  return {
    me: {
      ...card,
      microsites: await Promise.all(links.map((m) => toMicrositeRef(m, viewer.id))),
    },
    kpis: {
      mentees: matches.length,
      upcoming: upcoming.length,
      completedSessions: completed.length,
      pendingLogs: pendingLog.length,
    },
    mentees: await Promise.all(
      matches.map(async ({ match, name, m }) => {
        const done = completed.filter((x) => x.b.menteeId === match.menteeId)
        const last = done.at(-1)
        return {
          userId: match.menteeId,
          name,
          microsite: await toMicrositeRef(m, viewer.id),
          matchedAt: match.matchedAt.toISOString(),
          sessionsDone: done.length,
          ...(last ? { lastSessionAt: last.b.startsAt.toISOString() } : {}),
          logsPending: pendingLog.filter((x) => x.b.menteeId === match.menteeId).length,
        }
      }),
    ),
    upcoming: upcoming.map(({ b, menteeName }) => ({
      bookingId: b.id,
      mentee: { userId: b.menteeId, name: menteeName },
      startsAt: b.startsAt.toISOString(),
      endsAt: b.endsAt.toISOString(),
      ...(b.status === 'confirmed' ? { joinUrl: joinUrlFor(b.id) } : {}),
    })),
    past: past.slice(0, 50).map(({ b, menteeName }) => {
      const rating = ratingByBooking.get(b.id)
      const logId = logByBooking.get(b.id)
      return {
        bookingId: b.id,
        mentee: { userId: b.menteeId, name: menteeName },
        startsAt: b.startsAt.toISOString(),
        status: b.status as 'completed',
        ...(rating !== undefined ? { feedback: { rating } } : {}),
        ...(logId ? { growLogId: logId } : {}),
      }
    }),
    applications: applications.map(({ a, name }) => ({
      id: a.id,
      mentee: { userId: a.menteeId, name },
      submittedAt: a.createdAt.toISOString(),
      answers: a.answers,
    })),
  }
}

/* ------------------------------------------------------------------ GROW logs */

export async function listGrowLogs(viewer: Viewer, query: z.infer<typeof GrowLogsQuery>) {
  const profile = await ownProfile(viewer)
  return growLogPage(
    and(
      eq(growLogs.mentorId, profile.id),
      query.menteeId ? eq(growLogs.menteeId, query.menteeId) : undefined,
    ),
    query,
  )
}

/** Immutable; one per booking (409); own booking only (404); the session must have happened. */
export async function createGrowLog(viewer: Viewer, input: z.infer<typeof GrowLogInput>) {
  const profile = await ownProfile(viewer)
  return db.transaction(async (tx) => {
    const [booking] = await tx
      .select()
      .from(mentorBookings)
      .where(and(eq(mentorBookings.id, input.bookingId), eq(mentorBookings.mentorId, profile.id)))
      .for('update')
    if (!booking) throw notFound()
    const happened =
      booking.status === 'completed' ||
      (booking.status === 'confirmed' && booking.startsAt <= now())
    if (!happened) throw locked('A GROW log can be written once the session took place')
    const [existing] = await tx
      .select({ id: growLogs.id })
      .from(growLogs)
      .where(eq(growLogs.bookingId, booking.id))
    if (existing) throw conflict('This session already has a GROW log')
    const [row] = await tx
      .insert(growLogs)
      .values({
        bookingId: booking.id,
        mentorId: profile.id,
        menteeId: booking.menteeId,
        sessionNo: input.sessionNo,
        sessionDate: input.sessionDate,
        goal: sanitizeText(input.goal),
        reality: sanitizeText(input.reality),
        options: sanitizeText(input.options),
        wayForward: sanitizeText(input.wayForward),
      })
      .onConflictDoNothing()
      .returning({ id: growLogs.id })
    if (!row) throw conflict('This session already has a GROW log')
    await notifyGrowLog(tx, booking.menteeId, profile.id, input.sessionNo)
    return { id: row.id }
  })
}

/* ------------------------------------------------------------------ profile */

export async function getMentorProfile(viewer: Viewer): Promise<z.infer<typeof MentorProfile>> {
  const profile = await ownProfile(viewer)
  return {
    title: profile.title,
    bio: profile.bio,
    categories: profile.categories,
    linkedinUrl: profile.linkedinUrl,
    photo: await urlForStored(profile.photo || viewer.image, viewer.id),
  }
}

export async function updateMentorProfile(
  viewer: Viewer,
  input: z.infer<typeof MentorProfileInput>,
) {
  const profile = await ownProfile(viewer)
  if (input.photo && /^[0-9a-f-]{36}$/i.test(input.photo))
    await assertUsableImage(input.photo, viewer.id)
  await db
    .update(mentorProfiles)
    .set({
      title: sanitizeText(input.title),
      bio: { en: sanitizeText(input.bio.en), ar: sanitizeText(input.bio.ar) },
      categories: [...new Set(input.categories)],
      linkedinUrl: input.linkedinUrl,
      ...(input.photo !== undefined ? { photo: input.photo } : {}),
    })
    .where(eq(mentorProfiles.id, profile.id))
  return getMentorProfile(viewer)
}

/* ------------------------------------------------------------------ applications */

async function pendingApplication(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  mentorId: string,
  id: string,
) {
  const [app] = await tx
    .select({ a: menteeApplications, slug: microsites.slug })
    .from(menteeApplications)
    .innerJoin(microsites, eq(microsites.id, menteeApplications.micrositeId))
    .where(and(eq(menteeApplications.id, id), eq(menteeApplications.mentorId, mentorId)))
    .for('update', { of: menteeApplications })
  if (!app) throw notFound()
  if (app.a.status !== 'pending') throw conflict('This application was already decided')
  return app
}

export async function acceptApplication(viewer: Viewer, id: string) {
  const profile = await ownProfile(viewer)
  return db.transaction(async (tx) => {
    const { a, slug } = await pendingApplication(tx, profile.id, id)
    await lockKey(tx, `match:${a.menteeId}:${a.micrositeId}`)
    const [active] = await tx
      .select({ id: mentorMatches.id })
      .from(mentorMatches)
      .where(
        and(
          eq(mentorMatches.menteeId, a.menteeId),
          eq(mentorMatches.micrositeId, a.micrositeId),
          eq(mentorMatches.status, 'active'),
        ),
      )
    if (active) throw conflict('This mentee already has a mentor in the programme')
    const [match] = await tx
      .insert(mentorMatches)
      .values({
        menteeId: a.menteeId,
        mentorId: profile.id,
        micrositeId: a.micrositeId,
        applicationId: a.id,
        source: a.source,
        matchScore: a.matchScore,
        matchedAt: now(),
      })
      .onConflictDoNothing()
      .returning({ id: mentorMatches.id })
    if (!match) throw conflict('This mentee already has a mentor in the programme')
    await tx
      .update(menteeApplications)
      .set({ status: 'accepted', decidedAt: now() })
      .where(eq(menteeApplications.id, a.id))
    await notifyApplicationDecision(tx, a.menteeId, profile.id, 'accepted', slug)
    return { matchId: match.id }
  })
}

export async function declineApplication(viewer: Viewer, id: string, reason?: string) {
  const profile = await ownProfile(viewer)
  return db.transaction(async (tx) => {
    const { a, slug } = await pendingApplication(tx, profile.id, id)
    const clean = reason ? sanitizeText(reason) : null
    await tx
      .update(menteeApplications)
      .set({ status: 'declined', decidedAt: now(), reason: clean })
      .where(eq(menteeApplications.id, a.id))
    await notifyApplicationDecision(tx, a.menteeId, profile.id, 'declined', slug, clean)
    return { ok: true as const }
  })
}

/* ------------------------------------------------------------------ P31 availability */

export async function getAvailability(viewer: Viewer): Promise<z.infer<typeof Availability>> {
  const profile = await ownProfile(viewer)
  const rules = await db
    .select()
    .from(mentorAvailabilityRules)
    .where(eq(mentorAvailabilityRules.mentorId, profile.id))
    .orderBy(asc(mentorAvailabilityRules.weekday), asc(mentorAvailabilityRules.startTime))
  const off = await db
    .select()
    .from(mentorTimeOff)
    .where(eq(mentorTimeOff.mentorId, profile.id))
    .orderBy(asc(mentorTimeOff.startsAt))
  return {
    rules: rules.map((r) => ({
      id: r.id,
      weekday: r.weekday,
      startTime: r.startTime,
      endTime: r.endTime,
      timezone: profile.timezone,
    })),
    timeOff: off.map((o) => ({ from: o.startsAt.toISOString(), to: o.endsAt.toISOString() })),
    slotMinutes: 60,
  }
}

/** Replaces the weekly rules and time off. Overlapping rules on one weekday → 422. */
export async function saveAvailability(viewer: Viewer, input: z.infer<typeof AvailabilityInput>) {
  const profile = await ownProfile(viewer)
  const fields: Record<string, string> = {}
  input.rules.forEach((r, i) => {
    const clash = input.rules.findIndex(
      (o, j) =>
        j < i &&
        o.weekday === r.weekday &&
        minuteOfDay(o.startTime) < minuteOfDay(r.endTime) &&
        minuteOfDay(r.startTime) < minuteOfDay(o.endTime),
    )
    if (clash >= 0) fields[`rules.${i}`] = 'Overlaps another rule on the same day'
  })
  if (Object.keys(fields).length) throw validationFailed(fields)
  await db.transaction(async (tx) => {
    await tx
      .update(mentorProfiles)
      .set({ timezone: input.timezone })
      .where(eq(mentorProfiles.id, profile.id))
    await tx.delete(mentorAvailabilityRules).where(eq(mentorAvailabilityRules.mentorId, profile.id))
    if (input.rules.length)
      await tx
        .insert(mentorAvailabilityRules)
        .values(input.rules.map((r) => ({ ...r, mentorId: profile.id })))
    await tx.delete(mentorTimeOff).where(eq(mentorTimeOff.mentorId, profile.id))
    if (input.timeOff.length)
      await tx.insert(mentorTimeOff).values(
        input.timeOff.map((o) => ({
          mentorId: profile.id,
          startsAt: new Date(o.from),
          endsAt: new Date(o.to),
        })),
      )
  })
  return getAvailability(viewer)
}

export async function mentorBookingsList(
  viewer: Viewer,
  query: z.infer<typeof MentorBookingsQuery>,
): Promise<z.infer<typeof MentorBookingsList>> {
  const profile = await ownProfile(viewer)
  const rows = await db
    .select({ b: mentorBookings, name: users.name })
    .from(mentorBookings)
    .innerJoin(users, eq(users.id, mentorBookings.menteeId))
    .where(
      and(
        eq(mentorBookings.mentorId, profile.id),
        query.from ? gte(mentorBookings.startsAt, new Date(query.from)) : undefined,
        query.to ? lte(mentorBookings.startsAt, new Date(query.to)) : undefined,
      ),
    )
    .orderBy(asc(mentorBookings.startsAt))
  return rows.map(({ b, name }) => ({
    bookingId: b.id,
    mentee: { userId: b.menteeId, name },
    startsAt: b.startsAt.toISOString(),
    status: b.status as 'confirmed',
  }))
}
