import { db } from '@server/db/connection'
import { users } from '@server/db/schema/identity'
import { type Microsite, memberships } from '@server/db/schema/microsites'
import { now } from '@server/lib/clock'
import { notFound } from '@server/lib/errors'
import { micrositeCardRows, toCourseCard } from '@server/services/catalog/course-card.service'
import { learningKpis } from '@server/services/catalog/points.service'
import { pendingDashboardForms } from '@server/services/forms/form-access.service'
import { dashboardProvider } from '@server/services/seams/dashboard.registry'
import { hubTab } from '@server/services/seams/hub.registry'
import type { HubTab } from '@shared/enums'
import type { DashboardResponse } from '@shared/schemas/microsites'
import { and, eq } from 'drizzle-orm'
import type { z } from 'zod'

type Dashboard = z.infer<typeof DashboardResponse>

import { toMicrositeRef } from './lookup.service'

/** P14: own data only, composed from the catalogue plus sections other areas register. */
export async function getDashboard(viewer: Viewer, m: Microsite): Promise<Dashboard> {
  const rows = await micrositeCardRows(m.id, viewer.id)
  const cards = await Promise.all(rows.map((r) => toCourseCard(r, viewer.id)))
  const courseIds = rows.map((r) => r.course.id)

  const continueLearning = cards
    .filter((c) => c.state === 'in_progress' || c.state === 'not_started')
    .sort((a, b) =>
      a.state === b.state ? b.progressPct - a.progressPct : a.state === 'in_progress' ? -1 : 1,
    )
    .slice(0, 4)
  const mandatory = cards.filter(
    (c) => c.isMandatory && c.state !== 'completed' && c.state !== 'coming_soon',
  )

  const section = async <T>(
    key: Parameters<typeof dashboardProvider>[0],
    fallback: T,
  ): Promise<T> => {
    const provider = dashboardProvider(key)
    return provider ? ((await provider({ viewer, microsite: m })) as T) : fallback
  }

  const surveysDefault = (await pendingDashboardForms(m.id, viewer.id)).map((f) => ({
    formId: f.id,
    title: f.title,
    ...(f.dueAt ? { dueAt: f.dueAt.toISOString() } : {}),
  }))

  const mentoring = m.mentoringEnabled
    ? await section<Dashboard['mentoring']>('mentoring', {
        enabled: true,
        registrationComplete: false,
      })
    : undefined
  const competition = m.competitionEnabled
    ? await section<Dashboard['competition']>('competition', {
        enabled: true,
        status: 'not_started',
      })
    : undefined

  // Mark the visit (P13 lastVisitedAt).
  await db
    .update(memberships)
    .set({ lastVisitedAt: now() })
    .where(and(eq(memberships.userId, viewer.id), eq(memberships.micrositeId, m.id)))
  const [user] = await db
    .select({ tourSeen: users.tourSeen })
    .from(users)
    .where(eq(users.id, viewer.id))

  return {
    microsite: {
      ...(await toMicrositeRef(m, viewer.id)),
      tabs: m.tabs.filter((t) => t.enabled).map((t) => ({ key: t.key, label: t.label })),
    },
    kpis: await learningKpis(viewer.id, courseIds),
    continueLearning,
    mandatory,
    ...(mentoring ? { mentoring } : {}),
    ...(competition ? { competition } : {}),
    resources: await section<Dashboard['resources']>('resources', []),
    events: await section<Dashboard['events']>('events', []),
    surveys: await section<Dashboard['surveys']>('surveys', surveysDefault),
    tourSeen: user?.tourSeen ?? false,
  }
}

/** P52: the tab must be enabled for the microsite (404 otherwise) and owned by an area. */
export async function getHubTab(viewer: Viewer, m: Microsite, tab: HubTab, rawQuery: unknown) {
  if (!m.tabs.some((t) => t.key === tab && t.enabled)) throw notFound()
  const handler = hubTab(tab)
  if (!handler) throw notFound()
  const query = handler.query.parse(rawQuery)
  return {
    result: await handler.handler({ viewer, microsite: m, query }),
    response: handler.response,
  }
}
