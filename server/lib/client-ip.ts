import { env } from '@server/config/env'
import type { Request } from 'express'

/**
 * The client's IP for rate limiting, lockout and audit. X-Forwarded-For is read only when
 * TRUST_PROXY=true (our own proxy is the only way in), and then only its right-most entry.
 */
export function clientIp(req: Request, trustProxy = env.TRUST_PROXY): string {
  if (trustProxy) {
    const header = req.headers['x-forwarded-for']
    const hops = (Array.isArray(header) ? header.join(',') : (header ?? ''))
      .split(',')
      .map((hop) => hop.trim())
      .filter(Boolean)
    const nearest = hops.at(-1)
    if (nearest) return nearest
  }
  return req.socket?.remoteAddress ?? 'unknown'
}
