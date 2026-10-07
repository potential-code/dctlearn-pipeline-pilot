import { auth } from '@server/auth/auth'
import { CLIENT_IP_HEADER, INTERNAL_HEADER, REMEMBER_HEADER } from '@server/auth/internal'
import { env } from '@server/config/env'
import { clientIp } from '@server/lib/client-ip'
import { documentRoute } from '@server/lib/route'
import { authLimiter } from '@server/middleware/rate-limit.middleware'
import { fromNodeHeaders } from 'better-auth/node'
import express, { type Request, type Response, Router } from 'express'

/**
 * Better Auth owns /api/auth/*. This bridge: strips headers a browser must not send, sets the
 * trusted client IP, applies the credential limiter, keeps the contract's
 * `/forget-password` alias, and adds the contract error shape `{ error: { code, message } }`
 * next to Better Auth's own `{ code, message }` (so its client keeps working).
 */

const CREDENTIAL_PATHS = [
  '/sign-in/email',
  '/sign-up/email',
  '/request-password-reset',
  '/forget-password',
  '/reset-password',
  '/send-verification-email',
]

const CODE_MAP: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'invalid_credentials',
  EMAIL_NOT_VERIFIED: 'email_not_verified',
  ACCOUNT_DISABLED: 'account_disabled',
  RATE_LIMITED: 'rate_limited',
  TOO_MANY_REQUESTS: 'rate_limited',
  FORBIDDEN: 'forbidden',
  UNAUTHORIZED: 'unauthenticated',
  PASSWORD_TOO_SHORT: 'validation_failed',
  PASSWORD_TOO_LONG: 'validation_failed',
  PASSWORD_COMPROMISED: 'validation_failed',
  INVALID_EMAIL: 'validation_failed',
  INVALID_PASSWORD: 'validation_failed',
  INVALID_TOKEN: 'token_invalid',
}

function contractCode(code: string | undefined, status: number) {
  if (code && CODE_MAP[code]) return CODE_MAP[code]
  if (status === 401) return 'unauthenticated'
  if (status === 403) return 'forbidden'
  if (status === 429) return 'rate_limited'
  if (status === 422 || status === 400) return 'validation_failed'
  return (code ?? 'error').toLowerCase()
}

async function bridge(req: Request, res: Response) {
  const path = req.originalUrl.replace(
    /^\/api\/auth\/forget-password/,
    '/api/auth/request-password-reset',
  )
  const url = new URL(path, env.BETTER_AUTH_URL)
  const headers = fromNodeHeaders(req.headers)
  headers.delete(INTERNAL_HEADER)
  headers.delete(REMEMBER_HEADER)
  headers.set(CLIENT_IP_HEADER, clientIp(req))
  const hasBody =
    !['GET', 'HEAD'].includes(req.method) && Buffer.isBuffer(req.body) && req.body.length > 0
  if (hasBody && url.pathname.endsWith('/sign-in/email')) {
    try {
      const raw = JSON.parse((req.body as Buffer).toString('utf-8')) as { rememberMe?: unknown }
      if (raw?.rememberMe === true) headers.set(REMEMBER_HEADER, '1')
    } catch {
      // Better Auth answers the malformed body itself.
    }
  }
  const response = await auth.handler(
    new Request(url, {
      method: req.method,
      headers,
      body: hasBody ? new Uint8Array(req.body as Buffer) : undefined,
    }),
  )

  res.status(response.status)
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'set-cookie' && key.toLowerCase() !== 'content-length')
      res.setHeader(key, value)
  })
  const cookies = response.headers.getSetCookie()
  if (cookies.length) res.setHeader('Set-Cookie', cookies)

  const text = await response.text()
  if (response.status >= 400 && (response.headers.get('content-type') ?? '').includes('json')) {
    try {
      const body = JSON.parse(text) as { code?: string; message?: string }
      const code = contractCode(body.code, response.status)
      if (response.status === 429 && !res.getHeader('retry-after'))
        res.setHeader('Retry-After', '60')
      const fields =
        code === 'validation_failed'
          ? { [body.code?.includes('EMAIL') ? 'email' : 'password']: body.message ?? '' }
          : undefined
      res.json({
        ...body,
        error: { code, message: body.message ?? code, ...(fields ? { fields } : {}) },
      })
      return
    } catch {
      // fall through: send as is
    }
  }
  res.send(text)
}

export const authRouter = Router()

authRouter.use(
  CREDENTIAL_PATHS.map((p) => `/auth${p}`),
  authLimiter,
)
/**
 * Only the Better Auth endpoints the contract uses are reachable. Everything else (update-user,
 * change-password with `revokeOtherSessions:false`, account linking, …) answers 404, so profile,
 * photo and password changes always go through our own validated routes.
 */
const ALLOWED: { method: string; path: RegExp }[] = [
  { method: 'POST', path: /^\/sign-in\/email$/ },
  { method: 'POST', path: /^\/sign-up\/email$/ },
  { method: 'POST', path: /^\/sign-out$/ },
  { method: 'GET', path: /^\/get-session$/ },
  { method: 'POST', path: /^\/request-password-reset$/ },
  { method: 'POST', path: /^\/forget-password$/ },
  { method: 'POST', path: /^\/reset-password$/ },
  { method: 'GET', path: /^\/reset-password\/[^/]+$/ },
  { method: 'GET', path: /^\/verify-email$/ },
  { method: 'POST', path: /^\/send-verification-email$/ },
]

authRouter.all(
  '/auth/*splat',
  (req, res, next) => {
    const sub = req.path.replace(/^\/auth/, '')
    if (!ALLOWED.some((a) => a.method === req.method && a.path.test(sub))) {
      res.status(404).json({ error: { code: 'not_found', message: 'Not found' } })
      return
    }
    next()
  },
  express.raw({ type: () => true, limit: '100kb' }),
  (req, res, next) => {
    bridge(req, res).catch(next)
  },
)

const AUTH = 'public · rate: auth 10/min/IP · lockout after 5 failed attempts (15 min)'
documentRoute(
  'post',
  '/api/auth/sign-in/email',
  'P06 Sign in { email, password, rememberMe? }',
  ['Auth'],
  AUTH,
)
documentRoute(
  'post',
  '/api/auth/sign-up/email',
  'P07 Sign up { name, email, password, microsite } (open microsites only)',
  ['Auth'],
  AUTH,
)
documentRoute('post', '/api/auth/sign-out', 'Sign out', ['Auth'], 'signed-in')
documentRoute(
  'post',
  '/api/auth/request-password-reset',
  'P09 Request reset { email, redirectTo } — always 200 (alias /forget-password)',
  ['Auth'],
  AUTH,
)
documentRoute(
  'post',
  '/api/auth/reset-password',
  'P09/P10 Reset { token, newPassword }',
  ['Auth'],
  'public (token)',
)
documentRoute(
  'get',
  '/api/auth/verify-email',
  'E-mail verification link',
  ['Auth'],
  'public (token)',
)
documentRoute(
  'post',
  '/api/auth/send-verification-email',
  'Resend verification { email } — always 200',
  ['Auth'],
  AUTH,
)
