import { createHmac, timingSafeEqual } from 'node:crypto'
import { fileSigningSecret } from '@server/config/env'
import { now } from '@server/lib/clock'

/**
 * Short-lived signed token for embeds that need the signed-in user (P24–P26). Carries the user
 * id and locale only (plus the embed key it was issued for and the expiry); HMAC-SHA256 with a
 * key derived from the server signing secret, so it can never be confused with a file URL
 * signature. Format: `v1.<base64url payload>.<base64url signature>`.
 */
export const EMBED_SESSION_TTL_SECONDS = 600

const key = createHmac('sha256', fileSigningSecret).update('ai-embed-session:v1').digest()

export type EmbedSessionPayload = { sub: string; locale: 'en' | 'ar'; aud: string; exp: number }

const sign = (data: string) => createHmac('sha256', key).update(data).digest('base64url')

export function signEmbedSession(input: { userId: string; locale: 'en' | 'ar'; embedKey: string }) {
  const exp = Math.floor(now().getTime() / 1000) + EMBED_SESSION_TTL_SECONDS
  const payload: EmbedSessionPayload = {
    sub: input.userId,
    locale: input.locale,
    aud: input.embedKey,
    exp,
  }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return { token: `v1.${body}.${sign(`v1.${body}`)}`, expiresAt: new Date(exp * 1000) }
}

/** Returns the payload when the signature, embed key and expiry all check out; null otherwise. */
export function verifyEmbedSession(token: string, embedKey: string): EmbedSessionPayload | null {
  const [v, body, sig] = token.split('.')
  if (v !== 'v1' || !body || !sig) return null
  const expected = Buffer.from(sign(`v1.${body}`))
  const given = Buffer.from(sig)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as EmbedSessionPayload
    if (payload.aud !== embedKey) return null
    if (payload.exp * 1000 < now().getTime()) return null
    return payload
  } catch {
    return null
  }
}
