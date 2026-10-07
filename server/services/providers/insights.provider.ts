import { features } from '@server/config/env'
import { featureOff } from '@server/lib/errors'

/** P45 "ask AI" over aggregates. Stub: 503 `feature_off` until an AI provider is configured. */
export interface InsightsProvider {
  readonly enabled: boolean
  ask(
    question: string,
    aggregates: Record<string, unknown>,
  ): Promise<{ answer: string; dataUsed: string[] }>
}

export const stubInsightsProvider: InsightsProvider = {
  get enabled() {
    return features.ai
  },
  async ask() {
    throw featureOff(503, 'AI insights are not configured')
  },
}

let provider: InsightsProvider = stubInsightsProvider
export function insightsProvider() {
  return provider
}
export function setInsightsProvider(next: InsightsProvider) {
  provider = next
}
