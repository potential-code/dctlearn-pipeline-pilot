/**
 * Time-zone arithmetic for availability (contract §9.8), ported from the mentorship template.
 * A mentor writes availability as local wall-clock time ("Sun 10:00–13:00, Asia/Dubai"); the
 * database stores instants. The zone offset is read from `Intl` per instant, so DST shifts work.
 */

export type WallClock = { year: number; month: number; day: number; hour: number; minute: number }
export type Interval = { startsAt: Date; endsAt: Date }

const formatters = new Map<string, Intl.DateTimeFormat>()

function partsFormatter(timeZone: string) {
  let f = formatters.get(timeZone)
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    formatters.set(timeZone, f)
  }
  return f
}

export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone })
    return true
  } catch {
    return false
  }
}

export function toWallClock(instant: Date, timeZone: string): WallClock {
  const parts = partsFormatter(timeZone).formatToParts(instant)
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0)
  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
    minute: read('minute'),
  }
}

function zoneOffsetMs(instant: Date, timeZone: string) {
  const w = toWallClock(instant, timeZone)
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute)
  return asUtc - Math.floor(instant.getTime() / 60_000) * 60_000
}

/** Local wall-clock time in `timeZone` → the instant it names (two passes resolve DST). */
export function wallClockToInstant(wall: WallClock, timeZone: string): Date {
  const naive = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute)
  const first = zoneOffsetMs(new Date(naive), timeZone)
  const guess = naive - first
  const second = zoneOffsetMs(new Date(guess), timeZone)
  return new Date(second === first ? guess : naive - second)
}

/** Calendar days from `from` to `to` inclusive as they fall in `timeZone`. */
export function eachDayInZone(from: Date, to: Date, timeZone: string) {
  const days: { year: number; month: number; day: number; weekday: number }[] = []
  const start = toWallClock(from, timeZone)
  const end = toWallClock(to, timeZone)
  const endMarker = Date.UTC(end.year, end.month - 1, end.day)
  let cursor = Date.UTC(start.year, start.month - 1, start.day)
  while (cursor <= endMarker && days.length < 400) {
    const d = new Date(cursor + 12 * 3_600_000)
    days.push({
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate(),
      weekday: d.getUTCDay(),
    })
    cursor += 86_400_000
  }
  return days
}

export function overlaps(a: Interval, b: Interval) {
  return a.startsAt < b.endsAt && b.startsAt < a.endsAt
}

export function addMinutes(instant: Date, minutes: number) {
  return new Date(instant.getTime() + minutes * 60_000)
}

/** `HH:MM` → minutes from midnight (24:00 = 1440). */
export function minuteOfDay(value: string) {
  const [h, m] = value.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}
