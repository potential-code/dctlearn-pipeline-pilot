import type { RangeToken } from '@shared/schemas/analytics'

/**
 * Range tokens and time buckets (adapted from the analytics template). A range is the half-open
 * interval `[from, to)` ending at "now", so today's rows count and consecutive ranges never
 * overlap. Buckets are generated first and filled afterwards, so a series is in time order by
 * construction and empty periods are zeros, not gaps. Everything is UTC.
 */
export type BucketUnit = 'day' | 'week' | 'month'
export type DateRange = { from: Date; to: Date; prevFrom: Date; unit: BucketUnit }

const DAY_MS = 86_400_000

export function resolveRange(token: RangeToken, at: Date): DateRange {
  const to = new Date(at)
  if (token === '12m') {
    const from = new Date(
      Date.UTC(
        to.getUTCFullYear() - 1,
        to.getUTCMonth(),
        to.getUTCDate(),
        to.getUTCHours(),
        to.getUTCMinutes(),
      ),
    )
    const prevFrom = new Date(
      Date.UTC(
        to.getUTCFullYear() - 2,
        to.getUTCMonth(),
        to.getUTCDate(),
        to.getUTCHours(),
        to.getUTCMinutes(),
      ),
    )
    return { from, to, prevFrom, unit: 'month' }
  }
  const days = token === '7d' ? 7 : token === '30d' ? 30 : 90
  const from = new Date(to.getTime() - days * DAY_MS)
  const prevFrom = new Date(from.getTime() - days * DAY_MS)
  return { from, to, prevFrom, unit: token === '90d' ? 'week' : 'day' }
}

function floorToUnit(date: Date, unit: BucketUnit): Date {
  if (unit === 'month') return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  if (unit === 'day') return day
  // ISO weeks start on Monday, matching Postgres date_trunc('week').
  const shift = (day.getUTCDay() + 6) % 7
  return new Date(day.getTime() - shift * DAY_MS)
}

function addUnit(date: Date, unit: BucketUnit): Date {
  if (unit === 'month') return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1))
  return new Date(date.getTime() + (unit === 'week' ? 7 : 1) * DAY_MS)
}

const keyOf = (d: Date) => d.toISOString().slice(0, 10)

/** Zero-filled, chronologically ordered series of the instants that fall inside the range. */
export function bucketSeries(instants: readonly Date[], range: DateRange) {
  const buckets: { bucket: string; value: number }[] = []
  const index = new Map<string, { bucket: string; value: number }>()
  let cursor = floorToUnit(range.from, range.unit)
  for (let guard = 0; cursor < range.to && guard < 1000; guard++) {
    const b = { bucket: keyOf(cursor), value: 0 }
    buckets.push(b)
    index.set(b.bucket, b)
    cursor = addUnit(cursor, range.unit)
  }
  for (const at of instants) {
    if (at < range.from || at >= range.to) continue
    const b = index.get(keyOf(floorToUnit(at, range.unit)))
    if (b) b.value += 1
  }
  return buckets
}

/** Growth of `current` over `previous` in %, one decimal; from zero, any growth is 100 %. */
export function growthPct(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

/** Calendar date (`YYYY-MM-DD`) in the Gulf (UTC+4, no DST) for an instant. */
export function gulfDate(at: Date) {
  return new Date(at.getTime() + 4 * 3_600_000).toISOString().slice(0, 10)
}

/** Hour of day in the Gulf for an instant. */
export function gulfHour(at: Date) {
  return new Date(at.getTime() + 4 * 3_600_000).getUTCHours()
}
