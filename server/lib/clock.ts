/**
 * The one source of "now" for business rules (deadlines, join windows, event phases, expiry).
 * Tests and the seed pin it to SEED's fixed today (2026-10-06 09:00 UTC); Better Auth keeps
 * real time for sessions.
 */
let fixed: Date | null = null

export function now(): Date {
  return fixed ? new Date(fixed) : new Date()
}

export function setNow(value: Date | string | null): void {
  fixed = value === null ? null : new Date(value)
}

export const SEED_TODAY = '2026-10-06T09:00:00.000Z'
