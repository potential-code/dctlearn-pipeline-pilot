import { db } from '@server/db/connection'
import type { Microsite } from '@server/db/schema/microsites'
import { featureOff, forbidden, notFound } from '@server/lib/errors'
import { findMicrositeBySlug } from '@server/services/microsites/lookup.service'
import { getMembership } from '@server/services/microsites/membership.service'
import type { RequestHandler, Response } from 'express'
import { requireAuth, viewerOf } from './auth.middleware'

/**
 * Microsite scope (contract §0.3). `{p}` is the URL slug, read from `req.params.p`.
 *
 * - `member(p)`: learner with a membership, microsite live. Sub admin of `p` and admins may view
 *   as learner (also while draft). Other roles: 403.
 * - `sub_admin(p)`: role sub_admin and `microsite.subAdminId == user.id`, or admin.
 */

async function loadMicrosite(res: Response, slug: string | undefined) {
  if (!slug) throw notFound()
  const microsite = await findMicrositeBySlug(slug)
  if (!microsite) throw notFound()
  res.locals.microsite = microsite
  return microsite
}

export function isSubAdminOf(viewer: Viewer, microsite: Microsite) {
  return (
    viewer.role === 'admin' || (viewer.role === 'sub_admin' && microsite.subAdminId === viewer.id)
  )
}

const memberCheck: RequestHandler = async (req, res, next) => {
  try {
    const viewer = viewerOf(res)
    const microsite = await loadMicrosite(res, req.params.p as string | undefined)
    if (isSubAdminOf(viewer, microsite)) {
      if (microsite.status === 'archived' && viewer.role !== 'admin') throw notFound()
      return next()
    }
    if (microsite.status !== 'live' || microsite.landingOnly) throw notFound()
    if (viewer.role !== 'learner') throw forbidden()
    const membership = await getMembership(db, viewer.id, microsite.id)
    if (!membership) throw forbidden()
    next()
  } catch (error) {
    next(error)
  }
}

export const requireMember: RequestHandler[] = [requireAuth, memberCheck]

const subAdminCheck: RequestHandler = async (req, res, next) => {
  try {
    const viewer = viewerOf(res)
    if (viewer.role !== 'admin' && viewer.role !== 'sub_admin') throw forbidden()
    const microsite = await loadMicrosite(res, req.params.p as string | undefined)
    if (!isSubAdminOf(viewer, microsite)) throw forbidden()
    next()
  } catch (error) {
    next(error)
  }
}

export const requireSubAdmin: RequestHandler[] = [requireAuth, subAdminCheck]

type Feature = 'mentoring' | 'competition' | 'ai'

/** After requireMember/requireSubAdmin: 404 `feature_off` when the microsite has it switched off. */
export function requireFeature(feature: Feature): RequestHandler {
  return (_req, res, next) => {
    const m = res.locals.microsite
    const on =
      feature === 'mentoring'
        ? m?.mentoringEnabled
        : feature === 'competition'
          ? m?.competitionEnabled
          : m?.aiEnabled
    if (!on) return next(featureOff(404))
    next()
  }
}

export function micrositeOf(res: Response): Microsite {
  const m = res.locals.microsite
  if (!m) throw notFound()
  return m
}
