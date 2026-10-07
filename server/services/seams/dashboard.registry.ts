import type { Microsite } from '@server/db/schema/microsites'

/**
 * P14 dashboard sections are filled by the areas that own them. Each registers a provider for
 * one key; the dashboard service calls it with the viewer and microsite and puts the result
 * under that key. Missing providers leave the contract defaults (empty lists / omitted).
 */
export type DashboardKey = 'mentoring' | 'competition' | 'resources' | 'events' | 'surveys'

export type DashboardProvider = (input: {
  viewer: Viewer
  microsite: Microsite
}) => Promise<unknown>

const providers = new Map<DashboardKey, DashboardProvider>()

export function registerDashboardSection(key: DashboardKey, provider: DashboardProvider) {
  providers.set(key, provider)
}

export function dashboardProvider(key: DashboardKey) {
  return providers.get(key)
}

/** P35 sub-admin KPIs owned by other areas (e.g. `pendingResources`). Default 0. */
type KpiProvider = (microsite: Microsite) => Promise<number>
const kpis = new Map<string, KpiProvider>()

export function registerMicrositeKpi(key: 'pendingResources', provider: KpiProvider) {
  kpis.set(key, provider)
}

export async function micrositeKpi(key: 'pendingResources', microsite: Microsite) {
  const provider = kpis.get(key)
  return provider ? provider(microsite) : 0
}
