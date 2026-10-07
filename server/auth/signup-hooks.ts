import { db } from '@server/db/connection'
import {
  emailMatchesDomainRule,
  findMicrositeBySlug,
} from '@server/services/microsites/lookup.service'
import { joinMicrosite } from '@server/services/microsites/membership.service'
import { APIError } from 'better-auth/api'
import { INTERNAL_HEADER, INTERNAL_VALUE } from './internal'

/**
 * Self sign-up (P07) is only possible into an `open`, live microsite whose e-mail rule matches;
 * membership is granted here, server-side, never from the body. P08 (employees) calls in
 * through `internalHeaders()` after checking its own domain rule.
 */

type Body = Record<string, unknown>

const refused = () =>
  new APIError('FORBIDDEN', {
    code: 'FORBIDDEN',
    message: 'Registration is not open for this microsite',
  })

export async function assertSignUpAllowed(body: Body, internal: boolean) {
  const slug = typeof body?.microsite === 'string' ? body.microsite : ''
  if (!slug) throw refused()
  const microsite = await findMicrositeBySlug(slug)
  if (!microsite) throw refused()
  if (internal) return
  const email = String(body.email ?? '')
  if (
    microsite.status !== 'live' ||
    microsite.signInMode !== 'open' ||
    microsite.landingOnly ||
    !emailMatchesDomainRule(email, microsite.emailDomainRule)
  ) {
    throw refused()
  }
}

type HookCtx = { path?: string; body?: unknown; headers?: Headers } | null

export async function onSignUpBefore(user: Record<string, unknown>, _ctx: HookCtx) {
  // Role and status are never chosen by the caller (Better Auth `input: false` as well).
  return { data: { ...user, role: 'learner', status: 'active' } as never }
}

export async function onUserCreated(user: { id: string }, ctx: HookCtx) {
  if (ctx?.path !== '/sign-up/email') return
  const body = (ctx.body ?? {}) as Body
  const slug = typeof body.microsite === 'string' ? body.microsite : ''
  const microsite = slug ? await findMicrositeBySlug(slug) : null
  if (!microsite) return
  const internal = ctx.headers?.get(INTERNAL_HEADER) === INTERNAL_VALUE
  await db.transaction((tx) =>
    joinMicrosite(tx, user.id, microsite.id, internal ? 'rule' : 'signup'),
  )
}
