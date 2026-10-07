import { env } from '@server/config/env'
import { type DbOrTx, db } from '@server/db/connection'
import { mentorBookings, mentorMicrosites } from '@server/db/schema/mentoring'
import { type Microsite, memberships, microsites } from '@server/db/schema/microsites'
import { forbidden, notFound } from '@server/lib/errors'
import { and, eq } from 'drizzle-orm'
import { type MentorRow, mentorProfileByUser, mentorRowById } from './cards.service'

/**
 * Who may see which mentor and booking (contract §0.3). Anything not visible answers 404.
 * - learner: mentors linked to a live microsite they belong to, where mentoring is on (or the
 *   mentor is a trainer — browse only);
 * - admin: every mentor; mentor: their own profile only.
 */

export function joinUrlFor(bookingId: string) {
  return `${env.APP_URL}/sessions/${bookingId}`
}

/** Live microsites linked to the mentor that the learner is a member of. */
export async function sharedMicrosites(
  learnerId: string,
  mentorId: string,
  tx: DbOrTx = db,
): Promise<Microsite[]> {
  const rows = await tx
    .select({ m: microsites })
    .from(mentorMicrosites)
    .innerJoin(microsites, eq(microsites.id, mentorMicrosites.micrositeId))
    .innerJoin(
      memberships,
      and(eq(memberships.micrositeId, microsites.id), eq(memberships.userId, learnerId)),
    )
    .where(eq(mentorMicrosites.mentorId, mentorId))
  return rows.map((r) => r.m).filter((m) => m.status === 'live' && !m.landingOnly)
}

export type VisibleMentor = { row: MentorRow; bookableIn: Microsite[] }

/** Mentor visible to the viewer, plus the microsites where the viewer may book them. */
export async function visibleMentor(
  viewer: Viewer,
  mentorId: string,
  tx: DbOrTx = db,
): Promise<VisibleMentor> {
  const row = await mentorRowById(mentorId, tx)
  if (!row) throw notFound()
  const p = row.profile
  if (viewer.role === 'admin') return { row, bookableIn: [] }
  if (viewer.role === 'mentor') {
    if (p.userId !== viewer.id) throw notFound()
    return { row, bookableIn: [] }
  }
  if (viewer.role !== 'learner') throw forbidden()
  if (p.status !== 'active') throw notFound()
  const shared = await sharedMicrosites(viewer.id, p.id, tx)
  const visible = shared.filter((m) => m.mentoringEnabled || p.kind === 'trainer')
  if (visible.length === 0) throw notFound()
  const bookableIn =
    p.kind === 'mentor' && p.bookingEnabled ? shared.filter((m) => m.mentoringEnabled) : []
  return { row, bookableIn }
}

/** The signed-in mentor's own profile (404 when the account has none yet). */
export async function ownProfile(viewer: Viewer, tx: DbOrTx = db) {
  const profile = await mentorProfileByUser(viewer.id, tx)
  if (!profile) throw notFound()
  return profile
}

export type BookingSide = 'mentee' | 'mentor'

/** A booking where the viewer is the mentee or the mentor (404 otherwise). */
export async function bookingForParty(
  viewer: Viewer,
  bookingId: string,
  tx: DbOrTx = db,
  opts: { lock?: boolean; side?: BookingSide } = {},
) {
  const q = tx.select().from(mentorBookings).where(eq(mentorBookings.id, bookingId))
  const [booking] = opts.lock ? await q.for('update') : await q
  if (!booking) throw notFound()
  let side: BookingSide | null = null
  if (viewer.role === 'learner' && booking.menteeId === viewer.id) side = 'mentee'
  if (viewer.role === 'mentor') {
    const profile = await mentorProfileByUser(viewer.id, tx)
    if (profile && booking.mentorId === profile.id) side = 'mentor'
  }
  if (!side || (opts.side && opts.side !== side)) throw notFound()
  return { booking, side }
}
