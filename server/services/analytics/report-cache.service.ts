import { db } from '@server/db/connection'
import { microsites } from '@server/db/schema/microsites'
import { reportCache } from '@server/db/schema/platform'
import { now } from '@server/lib/clock'
import { RANGE_TOKENS, type RangeToken } from '@shared/schemas/analytics'
import { eq } from 'drizzle-orm'
import {
  type Aggregates,
  computeAggregates,
  type TopCourseRow,
  topCourses,
} from './metrics.service'
import { resolveRange } from './range'

/**
 * Report cache (contract §9.3, every 15 min). The schedule recomputes every range for the
 * platform and for each microsite; reads use a row younger than `MAX_AGE_MS`, otherwise they
 * compute live (cold cache) without writing, so only the schedule fills the table.
 */
export const MAX_AGE_MS = 20 * 60_000

export type CachedAggregates = Aggregates & { topCourses?: TopCourseRow[] }

export const cacheKey = (range: RangeToken, slug: string | null) => `agg:${range}:${slug ?? 'all'}`

async function compute(range: RangeToken, micrositeId: string | null): Promise<CachedAggregates> {
  const r = resolveRange(range, now())
  const agg = await computeAggregates(r, micrositeId ?? undefined)
  return micrositeId ? { ...agg, topCourses: await topCourses(micrositeId) } : agg
}

export async function getAggregates(
  range: RangeToken,
  microsite: { id: string; slug: string } | null,
): Promise<CachedAggregates> {
  const key = cacheKey(range, microsite?.slug ?? null)
  const [row] = await db.select().from(reportCache).where(eq(reportCache.key, key))
  if (row && now().getTime() - row.computedAt.getTime() < MAX_AGE_MS)
    return row.payload as CachedAggregates
  return compute(range, microsite?.id ?? null)
}

/** The 15-minute schedule. Returns how many entries were written. */
export async function refreshReportCache() {
  const sites = await db.select({ id: microsites.id, slug: microsites.slug }).from(microsites)
  const scopes: ({ id: string; slug: string } | null)[] = [null, ...sites]
  let written = 0
  for (const range of RANGE_TOKENS) {
    for (const scope of scopes) {
      const payload = await compute(range, scope?.id ?? null)
      const computedAt = now()
      await db
        .insert(reportCache)
        .values({ key: cacheKey(range, scope?.slug ?? null), payload, computedAt })
        .onConflictDoUpdate({ target: reportCache.key, set: { payload, computedAt } })
      written++
    }
  }
  return { written }
}
