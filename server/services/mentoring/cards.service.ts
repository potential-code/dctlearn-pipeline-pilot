import { type DbOrTx, db } from '@server/db/connection'
import { users } from '@server/db/schema/identity'
import {
  bookingFeedback,
  type MentorProfile,
  mentorBookings,
  mentorMicrosites,
  mentorProfiles,
} from '@server/db/schema/mentoring'
import { type Microsite, microsites } from '@server/db/schema/microsites'
import { urlForStored } from '@server/services/files.service'
import type { MentorCard } from '@shared/schemas/common'
import { and, avg, count, eq, inArray } from 'drizzle-orm'
import { nextFreeSlots } from './slots.service'

/** Profiles + account names + microsite links, and the §0.2 MentorCard built from them. */

export type MentorRow = {
  profile: MentorProfile
  name: string
  email: string
  image: string | null
}

export async function mentorRowsByIds(ids: string[], tx: DbOrTx = db): Promise<MentorRow[]> {
  if (ids.length === 0) return []
  const rows = await tx
    .select({ profile: mentorProfiles, name: users.name, email: users.email, image: users.image })
    .from(mentorProfiles)
    .innerJoin(users, eq(users.id, mentorProfiles.userId))
    .where(inArray(mentorProfiles.id, ids))
  const order = new Map(ids.map((id, i) => [id, i]))
  return rows.sort((a, b) => (order.get(a.profile.id) ?? 0) - (order.get(b.profile.id) ?? 0))
}

export async function mentorRowById(id: string, tx: DbOrTx = db) {
  const [row] = await mentorRowsByIds([id], tx)
  return row ?? null
}

export async function mentorProfileByUser(userId: string, tx: DbOrTx = db) {
  const [row] = await tx.select().from(mentorProfiles).where(eq(mentorProfiles.userId, userId))
  return row ?? null
}

/** Microsites each mentor is linked to. */
export async function micrositesOf(ids: string[], tx: DbOrTx = db) {
  const out = new Map<string, Microsite[]>()
  if (ids.length === 0) return out
  const rows = await tx
    .select({ mentorId: mentorMicrosites.mentorId, m: microsites })
    .from(mentorMicrosites)
    .innerJoin(microsites, eq(microsites.id, mentorMicrosites.micrositeId))
    .where(inArray(mentorMicrosites.mentorId, ids))
    .orderBy(microsites.sortOrder)
  for (const r of rows) out.set(r.mentorId, [...(out.get(r.mentorId) ?? []), r.m])
  return out
}

/** Completed sessions and mentee rating per mentor. */
export async function mentorStats(ids: string[], tx: DbOrTx = db) {
  const sessions = new Map<string, number>()
  const ratings = new Map<string, number>()
  if (ids.length === 0) return { sessions, ratings }
  const done = await tx
    .select({ id: mentorBookings.mentorId, n: count() })
    .from(mentorBookings)
    .where(and(inArray(mentorBookings.mentorId, ids), eq(mentorBookings.status, 'completed')))
    .groupBy(mentorBookings.mentorId)
  for (const r of done) sessions.set(r.id, Number(r.n))
  const rated = await tx
    .select({ id: mentorBookings.mentorId, r: avg(bookingFeedback.rating) })
    .from(bookingFeedback)
    .innerJoin(mentorBookings, eq(mentorBookings.id, bookingFeedback.bookingId))
    .where(and(inArray(mentorBookings.mentorId, ids), eq(bookingFeedback.side, 'mentee')))
    .groupBy(mentorBookings.mentorId)
  for (const r of rated) if (r.r !== null) ratings.set(r.id, Math.round(Number(r.r) * 10) / 10)
  return { sessions, ratings }
}

export type CardOptions = {
  viewerId: string | null
  /** Compute nextFreeSlot (only meaningful where mentoring is on). */
  withNextSlot?: boolean
  tx?: DbOrTx
}

/** §0.2 MentorCard for each row (same order). Never includes e-mail or phone. */
export async function toMentorCards(rows: MentorRow[], opts: CardOptions): Promise<MentorCard[]> {
  const tx = opts.tx ?? db
  const ids = rows.map((r) => r.profile.id)
  const links = await micrositesOf(ids, tx)
  const { sessions, ratings } = await mentorStats(ids, tx)
  const next = opts.withNextSlot
    ? await nextFreeSlots(
        rows.map((r) => r.profile),
        tx,
      )
    : new Map<string, string>()
  return Promise.all(
    rows.map(async (r) => {
      const rating = ratings.get(r.profile.id)
      const slot = next.get(r.profile.id)
      return {
        mentorId: r.profile.id,
        name: r.name,
        title: r.profile.title,
        photoUrl: await urlForStored(r.profile.photo || r.image, opts.viewerId),
        categories: r.profile.categories,
        microsites: (links.get(r.profile.id) ?? []).map((m) => m.slug),
        ...(rating !== undefined ? { rating } : {}),
        sessionsCount: sessions.get(r.profile.id) ?? 0,
        ...(slot ? { nextFreeSlot: slot } : {}),
        bookingEnabled: r.profile.bookingEnabled && r.profile.kind === 'mentor',
      }
    }),
  )
}

export async function toMentorCard(row: MentorRow, opts: CardOptions) {
  const [card] = await toMentorCards([row], opts)
  return card!
}
