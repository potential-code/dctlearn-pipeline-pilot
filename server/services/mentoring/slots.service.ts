import { type DbOrTx, db } from '@server/db/connection'
import {
  type MentorProfile,
  mentorAvailabilityRules,
  mentorBookings,
  mentorTimeOff,
} from '@server/db/schema/mentoring'
import { now } from '@server/lib/clock'
import { and, eq, gt, inArray, lt, ne } from 'drizzle-orm'
import {
  addMinutes,
  eachDayInZone,
  type Interval,
  minuteOfDay,
  overlaps,
  wallClockToInstant,
} from './time'

/**
 * 60-minute slots generated on read from the weekly rules (mentor's zone) minus time off and
 * bookings that are not cancelled. Nothing is materialised; the booking's unique index is the
 * lock (contract §9.4).
 */
export const SLOT_MINUTES = 60
export const DEFAULT_SLOT_DAYS = 14

export type Rule = { weekday: number; startTime: string; endTime: string }

/** Pure generation, exported for tests. */
export function generateSlots(input: {
  rules: Rule[]
  timezone: string
  from: Date
  to: Date
  blocked: Interval[]
  notBefore: Date
}): Interval[] {
  const out: Interval[] = []
  if (input.rules.length === 0) return out
  for (const day of eachDayInZone(input.from, input.to, input.timezone)) {
    for (const rule of input.rules) {
      if (rule.weekday !== day.weekday) continue
      const end = minuteOfDay(rule.endTime)
      for (let m = minuteOfDay(rule.startTime); m + SLOT_MINUTES <= end; m += SLOT_MINUTES) {
        const startsAt = wallClockToInstant(
          { ...day, hour: Math.floor(m / 60), minute: m % 60 },
          input.timezone,
        )
        const slot = { startsAt, endsAt: addMinutes(startsAt, SLOT_MINUTES) }
        if (slot.startsAt < input.from || slot.startsAt >= input.to) continue
        if (slot.startsAt <= input.notBefore) continue
        if (input.blocked.some((b) => overlaps(slot, b))) continue
        out.push(slot)
      }
    }
  }
  return out.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
}

export async function rulesOf(mentorId: string, tx: DbOrTx = db) {
  return tx
    .select()
    .from(mentorAvailabilityRules)
    .where(eq(mentorAvailabilityRules.mentorId, mentorId))
    .orderBy(mentorAvailabilityRules.weekday, mentorAvailabilityRules.startTime)
}

/** Bookable slots of one mentor in `[from, to)`. Empty when booking is off. */
export async function freeSlots(
  mentor: MentorProfile,
  from: Date,
  to: Date,
  tx: DbOrTx = db,
): Promise<Interval[]> {
  if (!mentor.bookingEnabled || mentor.kind !== 'mentor' || mentor.status !== 'active') return []
  const rules = await rulesOf(mentor.id, tx)
  if (rules.length === 0) return []
  const off = await tx
    .select({ startsAt: mentorTimeOff.startsAt, endsAt: mentorTimeOff.endsAt })
    .from(mentorTimeOff)
    .where(
      and(
        eq(mentorTimeOff.mentorId, mentor.id),
        lt(mentorTimeOff.startsAt, to),
        gt(mentorTimeOff.endsAt, from),
      ),
    )
  const booked = await tx
    .select({ startsAt: mentorBookings.startsAt, endsAt: mentorBookings.endsAt })
    .from(mentorBookings)
    .where(
      and(
        eq(mentorBookings.mentorId, mentor.id),
        ne(mentorBookings.status, 'cancelled'),
        lt(mentorBookings.startsAt, addMinutes(to, SLOT_MINUTES)),
        gt(mentorBookings.endsAt, addMinutes(from, -SLOT_MINUTES)),
      ),
    )
  return generateSlots({
    rules,
    timezone: mentor.timezone,
    from,
    to,
    blocked: [...off, ...booked],
    notBefore: now(),
  })
}

/** First free slot in the next 14 days, per mentor (MentorCard.nextFreeSlot). */
export async function nextFreeSlots(mentors: MentorProfile[], tx: DbOrTx = db) {
  const out = new Map<string, string>()
  const from = now()
  const to = addMinutes(from, DEFAULT_SLOT_DAYS * 1440)
  const bookable = mentors.filter((m) => m.bookingEnabled && m.kind === 'mentor')
  if (bookable.length === 0) return out
  for (const m of bookable) {
    const [first] = await freeSlots(m, from, to, tx)
    if (first) out.set(m.id, first.startsAt.toISOString())
  }
  return out
}

/** Mentors with at least one weekly rule (matcher's availability signal). */
export async function mentorsWithRules(ids: string[], tx: DbOrTx = db) {
  if (ids.length === 0) return new Set<string>()
  const rows = await tx
    .selectDistinct({ id: mentorAvailabilityRules.mentorId })
    .from(mentorAvailabilityRules)
    .where(inArray(mentorAvailabilityRules.mentorId, ids))
  return new Set(rows.map((r) => r.id))
}
