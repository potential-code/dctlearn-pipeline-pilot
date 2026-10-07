import { env } from '@server/config/env'
import { forbidden } from '@server/lib/errors'
import cors from 'cors'
import type { RequestHandler } from 'express'
import helmet from 'helmet'

/** Secure headers. The API only serves JSON and files, so the CSP is locked down. */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'same-site' },
})

/** CORS allow-list (exact origins), credentials on. */
export const corsPolicy = cors({
  origin: (origin, callback) =>
    callback(null, !origin || env.CORS_ORIGINS.includes(origin) ? origin || false : false),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept-Language'],
  maxAge: 600,
})

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS'])
/** Server-to-server callers authenticate otherwise (HMAC), so they are exempt. */
const EXEMPT = [/^\/api\/webhooks\//]

/**
 * CSRF: every mutating /api request must come from an allowed browser origin. Cookie auth +
 * SameSite=Lax + this check together replace the Hono `csrf()` the skeleton used.
 */
export const originCheck: RequestHandler = (req, _res, next) => {
  if (SAFE.has(req.method) || EXEMPT.some((re) => re.test(req.path))) return next()
  const origin =
    req.headers.origin ?? (req.headers.referer ? new URL(req.headers.referer).origin : undefined)
  if (!origin || !env.CORS_ORIGINS.includes(origin))
    return next(forbidden('Cross-site request blocked'))
  next()
}
