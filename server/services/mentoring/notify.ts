import { env } from '@server/config/env'
import type { DbOrTx } from '@server/db/connection'
import { users } from '@server/db/schema/identity'
import { type MentorBooking, mentorProfiles } from '@server/db/schema/mentoring'
import { queueEmail } from '@server/jobs/email.job'
import { eq } from 'drizzle-orm'
import { joinUrlFor } from './access.service'

/** Contract §8 mentoring e-mails, queued inside the caller's transaction. */

type Person = { email: string; name: string; locale: 'en' | 'ar' }

async function person(tx: DbOrTx, userId: string): Promise<Person | null> {
  const [u] = await tx
    .select({ email: users.email, name: users.name, locale: users.locale, status: users.status })
    .from(users)
    .where(eq(users.id, userId))
  if (!u || u.status === 'disabled') return null
  return { email: u.email, name: u.name, locale: u.locale === 'ar' ? 'ar' : 'en' }
}

async function mentorPerson(tx: DbOrTx, mentorId: string) {
  const [p] = await tx
    .select({ userId: mentorProfiles.userId })
    .from(mentorProfiles)
    .where(eq(mentorProfiles.id, mentorId))
  return p ? person(tx, p.userId) : null
}

function when(d: Date) {
  return `${d.toISOString().slice(0, 16).replace('T', ' ')} UTC`
}

export type BookingTemplate =
  | 'booking-requested'
  | 'booking-confirmed'
  | 'booking-cancelled'
  | 'session-reminder'

/** Booking e-mails go to both sides (§8). */
export async function notifyBooking(
  tx: DbOrTx,
  template: BookingTemplate,
  booking: MentorBooking,
  extra: Record<string, unknown> = {},
) {
  const mentee = await person(tx, booking.menteeId)
  const mentor = await mentorPerson(tx, booking.mentorId)
  if (!mentee || !mentor) return
  const base = { startsAt: when(booking.startsAt), url: joinUrlFor(booking.id), ...extra }
  await queueEmail(
    mentee.email,
    template,
    { ...base, name: mentee.name, withName: mentor.name },
    {
      locale: mentee.locale,
      tx,
    },
  )
  await queueEmail(
    mentor.email,
    template,
    { ...base, name: mentor.name, withName: mentee.name },
    {
      locale: mentor.locale,
      tx,
    },
  )
}

export async function notifyGrowLog(
  tx: DbOrTx,
  menteeId: string,
  mentorId: string,
  sessionNo: number,
) {
  const mentee = await person(tx, menteeId)
  const mentor = await mentorPerson(tx, mentorId)
  if (!mentee || !mentor) return
  await queueEmail(
    mentee.email,
    'grow-log',
    { name: mentee.name, mentorName: mentor.name, sessionNo, url: `${env.APP_URL}/me/grow-logs` },
    { locale: mentee.locale, tx },
  )
}

export async function notifyApplicationReceived(
  tx: DbOrTx,
  mentorId: string,
  menteeName: string,
  micrositeName: string,
) {
  const mentor = await mentorPerson(tx, mentorId)
  if (!mentor) return
  await queueEmail(
    mentor.email,
    'mentee-application-received',
    { name: mentor.name, menteeName, micrositeName, url: `${env.APP_URL}/mentor/dashboard` },
    { locale: mentor.locale, tx },
  )
}

export async function notifyApplicationDecision(
  tx: DbOrTx,
  menteeId: string,
  mentorId: string,
  decision: 'accepted' | 'declined',
  micrositeSlug: string,
  reason?: string | null,
) {
  const mentee = await person(tx, menteeId)
  const mentor = await mentorPerson(tx, mentorId)
  if (!mentee || !mentor) return
  await queueEmail(
    mentee.email,
    `mentee-application-${decision}`,
    {
      name: mentee.name,
      mentorName: mentor.name,
      reason: reason ?? null,
      url: `${env.APP_URL}/${micrositeSlug}/mentoring`,
    },
    { locale: mentee.locale, tx },
  )
}
