import { accountDisabled, emailNotVerified, forbidden, unauthenticated } from '@server/lib/errors'
import type { Role } from '@shared/roles'
import type { RequestHandler, Response } from 'express'

/** `signed-in` (contract §0.3): any active, verified account. */
export const requireAuth: RequestHandler = (_req, res, next) => {
  if (res.locals.viewerDisabled) return next(accountDisabled())
  const viewer = res.locals.viewer
  if (!viewer) return next(unauthenticated())
  if (!viewer.emailVerified) return next(emailNotVerified())
  if (viewer.status !== 'active') return next(accountDisabled())
  next()
}

/** `role(x)`: signed-in and one of the roles. Use instead of requireAuth, not after it. */
export function requireRole(...roles: Role[]): RequestHandler[] {
  return [
    requireAuth,
    (_req, res, next) => {
      const role = res.locals.viewer?.role
      if (!role || !roles.includes(role)) return next(forbidden())
      next()
    },
  ]
}

/** The viewer of a route behind requireAuth (throws if misused). */
export function viewerOf(res: Response): Viewer {
  const viewer = res.locals.viewer
  if (!viewer) throw unauthenticated()
  return viewer
}
