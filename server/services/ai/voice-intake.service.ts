import { env, features } from '@server/config/env'
import { db } from '@server/db/connection'
import { voiceIntakes } from '@server/db/schema/ai'
import { now } from '@server/lib/clock'
import { featureOff } from '@server/lib/errors'
import { logger } from '@server/lib/logger'
import type { VoiceIntakeInput } from '@shared/schemas/ai'
import { lt } from 'drizzle-orm'

/**
 * P27 voice hiring: the server forwards the pre-screening form to the Potential.com intake API
 * and returns the voice session token; provider keys never leave the server. Blank
 * `POTENTIAL_INTAKE_*` → 503 `feature_off`. Applicant data is personal: never logged or
 * audited, kept for admin export, deleted after 12 months (§9.7).
 */
export type Applicant = Omit<VoiceIntakeInput, 'consent'> & { consentAt: string }
export type VoiceIntakeProvider = (
  applicant: Applicant,
) => Promise<{ sessionToken: string; providerSessionId?: string }>

const httpProvider: VoiceIntakeProvider = async (applicant) => {
  const res = await fetch(env.POTENTIAL_INTAKE_URL as string, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.POTENTIAL_INTAKE_KEY}`,
    },
    body: JSON.stringify(applicant),
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`intake provider answered ${res.status}`)
  const data = (await res.json()) as { sessionToken?: unknown; id?: unknown }
  if (typeof data.sessionToken !== 'string') throw new Error('intake provider sent no token')
  return {
    sessionToken: data.sessionToken,
    ...(typeof data.id === 'string' ? { providerSessionId: data.id } : {}),
  }
}

let provider: VoiceIntakeProvider | null = features.voiceHiring ? httpProvider : null

/** Tests (and future providers) swap the intake provider; null switches the feature off. */
export function setVoiceIntakeProvider(next: VoiceIntakeProvider | null) {
  provider = next
}

export async function submitVoiceIntake(input: VoiceIntakeInput) {
  if (!provider) throw featureOff(503, 'Voice hiring is not available right now')
  const { consent: _consent, ...rest } = input
  const applicant: Applicant = { ...rest, consentAt: now().toISOString() }
  let result: Awaited<ReturnType<VoiceIntakeProvider>>
  try {
    result = await provider(applicant)
  } catch (error) {
    // No applicant data in the log line: only the provider's failure reason.
    logger.warn({ err: error instanceof Error ? error.message : 'unknown' }, 'Voice intake failed')
    throw featureOff(503, 'Voice hiring is not available right now')
  }
  await db
    .insert(voiceIntakes)
    .values({ applicant, providerSessionId: result.providerSessionId ?? null })
  return { sessionToken: result.sessionToken }
}

/** §9.7 retention: applicant data older than 12 months is deleted. */
export async function purgeOldVoiceIntakes() {
  const cutoff = now()
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1)
  const removed = await db
    .delete(voiceIntakes)
    .where(lt(voiceIntakes.createdAt, cutoff))
    .returning({ id: voiceIntakes.id })
  return removed.length
}
