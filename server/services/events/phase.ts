import type { EventRow } from '@server/db/schema/events'
import { now } from '@server/lib/clock'

/**
 * Event status (contract §9.1): `upcoming → live → past` is derived from the clock on every
 * read, so nothing can drift; `cancelled` is the only stored state. `live` opens
 * JOIN_WINDOW_MINUTES before the start and stays until LIVE_GRACE_MINUTES after the end.
 */
export const JOIN_WINDOW_MINUTES = 15
export const LIVE_GRACE_MINUTES = 15

const MINUTE = 60_000

export type EventStatus = 'upcoming' | 'live' | 'past' | 'cancelled'

export function phaseOf(e: Pick<EventRow, 'startsAt' | 'endsAt'>, at: Date = now()) {
  const opensAt = e.startsAt.getTime() - JOIN_WINDOW_MINUTES * MINUTE
  const closesAt = e.endsAt.getTime() + LIVE_GRACE_MINUTES * MINUTE
  const t = at.getTime()
  if (t < opensAt) return 'upcoming' as const
  if (t <= closesAt) return 'live' as const
  return 'past' as const
}

export function statusOf(
  e: Pick<EventRow, 'startsAt' | 'endsAt' | 'cancelledAt'>,
  at: Date = now(),
): EventStatus {
  return e.cancelledAt ? 'cancelled' : phaseOf(e, at)
}

/** Events ending before this instant are past (end + grace < now). */
export function pastCutoff(at: Date = now()) {
  return new Date(at.getTime() - LIVE_GRACE_MINUTES * MINUTE)
}

/** Events starting after this instant are still upcoming (start − join window > now). */
export function upcomingCutoff(at: Date = now()) {
  return new Date(at.getTime() + JOIN_WINDOW_MINUTES * MINUTE)
}
