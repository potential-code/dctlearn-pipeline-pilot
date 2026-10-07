import { db } from '@server/db/connection'
import { users } from '@server/db/schema/identity'
import { type Microsite, memberships, microsites } from '@server/db/schema/microsites'
import { notFound } from '@server/lib/errors'
import { toUserDto } from '@server/services/identity/user-dto'
import { findMicrositeBySlug, toMicrositeRef } from '@server/services/microsites/lookup.service'
import { insightsProvider } from '@server/services/providers/insights.provider'
import type { RangeToken } from '@shared/schemas/analytics'
import { desc, eq, inArray, isNull } from 'drizzle-orm'
import { type CachedAggregates, getAggregates } from './report-cache.service'

/** P45 dashboard, P55 microsite report and AI insights (admin only). */

const RECENT = 10

async function recentSignups(viewerId: string, micrositeId?: string) {
  const rows = micrositeId
    ? await db
        .select({ u: users, joinedAt: memberships.createdAt })
        .from(memberships)
        .innerJoin(users, eq(users.id, memberships.userId))
        .where(eq(memberships.micrositeId, micrositeId))
        .orderBy(desc(memberships.createdAt), users.name)
        .limit(RECENT)
    : (
        await db
          .select()
          .from(users)
          .where(isNull(users.anonymisedAt))
          .orderBy(desc(users.createdAt), users.name)
          .limit(RECENT)
      ).map((u) => ({ u, joinedAt: u.createdAt }))
  return Promise.all(
    rows.map(async ({ u, joinedAt }) => ({
      ...(await toUserDto(u, viewerId)),
      joinedAt: joinedAt.toISOString(),
      ...(u.lastLoginAt ? { lastSignInAt: u.lastLoginAt.toISOString() } : {}),
    })),
  )
}

/** Cached counts → the contract shape (microsite refs, signed URLs and people rendered live). */
async function render(agg: CachedAggregates, viewerId: string, micrositeId?: string) {
  const slugs = agg.byMicrosite.map((r) => r.slug)
  const sites = slugs.length
    ? await db.select().from(microsites).where(inArray(microsites.slug, slugs))
    : []
  const bySlug = new Map(sites.map((m) => [m.slug, m]))
  const byMicrosite = []
  for (const row of agg.byMicrosite) {
    const m = bySlug.get(row.slug)
    if (!m) continue
    byMicrosite.push({
      microsite: await toMicrositeRef(m, viewerId),
      members: row.members,
      active: row.active,
      completions: row.completions,
    })
  }
  return {
    kpis: agg.kpis,
    series: agg.series,
    byMicrosite,
    byRole: agg.byRole,
    recentSignups: await recentSignups(viewerId, micrositeId),
  }
}

async function micrositeOr404(slug: string): Promise<Microsite> {
  const m = await findMicrositeBySlug(slug)
  if (!m) throw notFound()
  return m
}

export async function getDashboard(q: { range: RangeToken; microsite?: string }, viewer: Viewer) {
  const m = q.microsite ? await micrositeOr404(q.microsite) : null
  const agg = await getAggregates(q.range, m)
  return render(agg, viewer.id, m?.id)
}

export async function getMicrositeReport(slug: string, q: { range: RangeToken }, viewer: Viewer) {
  const m = await micrositeOr404(slug)
  const agg = await getAggregates(q.range, m)
  return { ...(await render(agg, viewer.id, m.id)), topCourses: agg.topCourses ?? [] }
}

/**
 * P45 "ask AI": the provider receives counts only (KPIs, series, per-microsite and per-role
 * totals) — never names, e-mails or free text from users (contract §0.3).
 */
export async function askInsights(question: string) {
  const provider = insightsProvider()
  const agg = await getAggregates('30d', null)
  const aggregates = {
    range: '30d',
    kpis: agg.kpis,
    signupsByBucket: agg.series.signups,
    completionsByBucket: agg.series.completions,
    byMicrosite: agg.byMicrosite,
    byRole: agg.byRole,
  }
  const result = await provider.ask(question, aggregates)
  return { answer: result.answer, dataUsed: result.dataUsed }
}
