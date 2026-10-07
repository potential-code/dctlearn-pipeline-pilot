import { createHmac } from 'node:crypto'
import { env } from '@server/config/env'

/**
 * Server-side calls into Better Auth (P08 registration) carry this header so the sign-up hook
 * can tell them from public requests. The public /api/auth handler strips it from every
 * incoming request, so a browser can never send it.
 */
export const INTERNAL_HEADER = 'x-dct-internal'
export const INTERNAL_VALUE = createHmac('sha256', env.BETTER_AUTH_SECRET)
  .update('dct-internal')
  .digest('hex')

export function internalHeaders(extra: Record<string, string> = {}) {
  return new Headers({ [INTERNAL_HEADER]: INTERNAL_VALUE, ...extra })
}

export const CLIENT_IP_HEADER = 'x-client-ip'

/**
 * Better Auth defaults `rememberMe` to true; the contract makes it opt-in. The /api/auth bridge
 * sets this header only when the raw sign-in body had `rememberMe: true`.
 */
export const REMEMBER_HEADER = 'x-dct-remember-me'
