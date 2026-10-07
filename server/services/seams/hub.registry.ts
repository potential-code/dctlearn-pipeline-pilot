import type { Microsite } from '@server/db/schema/microsites'
import type { HubTab } from '@shared/enums'
import type { z } from 'zod'

/**
 * P52 hub tabs (`GET /api/microsites/{p}/hub/{tab}`): one shared route, one handler per tab
 * registered by the owning area with its own query and response schema.
 */
export type HubTabHandler = {
  query: z.ZodType
  response: z.ZodType
  handler: (input: { viewer: Viewer; microsite: Microsite; query: unknown }) => Promise<unknown>
}

const tabs = new Map<HubTab, HubTabHandler>()

export function registerHubTab(tab: HubTab, handler: HubTabHandler) {
  tabs.set(tab, handler)
}

export function hubTab(tab: HubTab) {
  return tabs.get(tab)
}
