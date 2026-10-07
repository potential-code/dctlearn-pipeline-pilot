import * as ctl from '@server/controllers/competition.controller'
import { forbidden } from '@server/lib/errors'
import { route } from '@server/lib/route'
import { requireFeature, requireMember } from '@server/middleware/microsite.middleware'
import { micrositeParam } from '@shared/schemas/common'
import { CompetitionDashboard, CompetitionView, SubmitResponse } from '@shared/schemas/competition'
import { type RequestHandler, Router } from 'express'

export const competitionRouter = Router()

/**
 * Permission matrix §0.3 "Competition: submit, own status": learner (p + own) and admin; a sub
 * admin viewing the microsite as a learner has no competition entry (403).
 */
const learnerOrAdmin: RequestHandler = (_req, res, next) => {
  const role = res.locals.viewer?.role
  if (role !== 'learner' && role !== 'admin') return next(forbidden())
  next()
}
const learner = [...requireMember, learnerOrAdmin, requireFeature('competition')]
const auth = 'member(p) with competition on · own submission only'

route(competitionRouter, {
  method: 'get',
  path: '/microsites/:p/competition',
  summary: 'P28 Competition: round, own submission, eligibility',
  tags: ['Learner · Competition'],
  auth,
  middleware: learner,
  params: micrositeParam,
  response: CompetitionView,
  handler: ctl.view,
})
route(competitionRouter, {
  method: 'post',
  path: '/microsites/:p/competition/submit',
  summary: 'P28 Submit the pitch (one-way, locks the action plan)',
  tags: ['Learner · Competition'],
  auth: `${auth} · eligibility checked · 409 after submit`,
  middleware: learner,
  params: micrositeParam,
  response: SubmitResponse,
  handler: ctl.submit,
})
route(competitionRouter, {
  method: 'get',
  path: '/microsites/:p/competition/dashboard',
  summary: 'P29 Competition dashboard (score and rank once the round is closed)',
  tags: ['Learner · Competition'],
  auth,
  middleware: learner,
  params: micrositeParam,
  response: CompetitionDashboard,
  handler: ctl.dashboard,
})
