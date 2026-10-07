import { aiEmbeds } from '@server/db/schema/ai'
import { events } from '@server/db/schema/events'
import { forms } from '@server/db/schema/forms'
import { hubAi } from '@server/services/ai/embeds.service'
import { dashboardEvents, listWorkshops } from '@server/services/events/events.service'
import { dashboardSurveys } from '@server/services/forms/forms.service'
import {
  dashboardResources,
  listHubResources,
  pendingResourceCount,
} from '@server/services/resources/resources.service'
import {
  registerDashboardSection,
  registerMicrositeKpi,
} from '@server/services/seams/dashboard.registry'
import { registerHubTab } from '@server/services/seams/hub.registry'
import {
  registerTranslatable,
  type TranslatableEntity,
} from '@server/services/seams/translatable.registry'
import { HubAiResponse } from '@shared/schemas/ai'
import { WorkshopsPage, WorkshopsQuery } from '@shared/schemas/events'
import { HubResourcesPage, HubResourcesQuery } from '@shared/schemas/resources'
import { z } from 'zod'
import '@server/jobs/content.job'

/**
 * Content area (events, resources, forms, AI embeds) plugs into the shared P52 hub tabs, P14
 * dashboard sections, P35 KPI and P60 translations. Imported once by registrations/index.ts.
 */

/* P52 hub tabs */
registerHubTab('workshops', {
  query: WorkshopsQuery,
  response: WorkshopsPage,
  handler: ({ viewer, microsite, query }) =>
    listWorkshops(viewer, microsite, query as z.infer<typeof WorkshopsQuery>),
})
registerHubTab('resources', {
  query: HubResourcesQuery,
  response: HubResourcesPage,
  handler: ({ viewer, microsite, query }) =>
    listHubResources(viewer, microsite, query as z.infer<typeof HubResourcesQuery>),
})
registerHubTab('ai_coaches', {
  query: z.object({}),
  response: HubAiResponse,
  handler: ({ viewer, microsite }) => hubAi(microsite, viewer, 'coaches'),
})
registerHubTab('ai_tools', {
  query: z.object({}),
  response: HubAiResponse,
  handler: ({ viewer, microsite }) => hubAi(microsite, viewer, 'tools'),
})

/* P14 dashboard sections */
registerDashboardSection('resources', ({ viewer, microsite }) =>
  dashboardResources(viewer, microsite),
)
registerDashboardSection('events', ({ viewer, microsite }) => dashboardEvents(viewer, microsite))
registerDashboardSection('surveys', ({ viewer, microsite }) =>
  dashboardSurveys(viewer, microsite.id),
)

/* P35 KPI */
registerMicrositeKpi('pendingResources', pendingResourceCount)

/*
 * P60 translations. The registry's entity union does not list these yet (requested shared
 * change); the names are the ones the i18n area should expose.
 */
registerTranslatable({
  entity: 'event' as TranslatableEntity,
  table: events,
  id: events.id,
  fields: { title: events.title, description: events.description },
  richFields: ['description'],
})
registerTranslatable({
  entity: 'form' as TranslatableEntity,
  table: forms,
  id: forms.id,
  fields: { title: forms.title },
})
registerTranslatable({
  entity: 'ai_embed' as TranslatableEntity,
  table: aiEmbeds,
  id: aiEmbeds.id,
  fields: { name: aiEmbeds.name, description: aiEmbeds.description },
})
