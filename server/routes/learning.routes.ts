import * as ctl from '@server/controllers/learning.controller'
import { route } from '@server/lib/route'
import { requireAuth } from '@server/middleware/auth.middleware'
import { requireMember } from '@server/middleware/microsite.middleware'
import {
  ActionPlanInput,
  ActionPlanSaved,
  AssessmentParams,
  AssessmentView,
  AttemptInput,
  AttemptResult,
  BlockParams,
  BlockProgressInput,
  CertificateCheck,
  CourseSlugParams,
  CourseView,
  ScormGet,
  ScormPut,
  SerialParams,
  SurveyInput,
  SurveySaved,
  UnitCompleteResponse,
  UnitParams,
  UnitView,
} from '@shared/schemas/learning'
import { Router } from 'express'

/**
 * P16 Course & unit player, assessments, public certificate check.
 * Routes keyed by unit/block/assessment id carry no `{p}`: the service resolves the course and
 * applies member(p) through the microsites that list it (404 when none, 403 for other roles).
 */
export const learningRouter = Router()

const tags = ['Learner · Player']
const playerAuth =
  'member(p) · course in p’s list · own progress/answers · locked units → 409 locked'

route(learningRouter, {
  method: 'get',
  path: '/microsites/:p/courses/:slug',
  summary: 'P16 Course page (structure, progress, final assessment, certificate)',
  tags,
  auth: 'member(p) · course must be in p’s course list · own progress',
  middleware: requireMember,
  params: CourseSlugParams,
  response: CourseView,
  handler: ctl.course,
})
route(learningRouter, {
  method: 'get',
  path: '/units/:unitId',
  summary: 'P16 Unit with block payloads',
  tags,
  auth: playerAuth,
  middleware: [requireAuth],
  params: UnitParams,
  response: UnitView,
  handler: ctl.unit,
})
route(learningRouter, {
  method: 'post',
  path: '/units/:unitId/blocks/:blockId/progress',
  summary: 'P16 Block progress (completed, video position)',
  tags,
  auth: playerAuth,
  middleware: [requireAuth],
  params: BlockParams,
  body: BlockProgressInput,
  handler: ctl.blockProgress,
})
route(learningRouter, {
  method: 'put',
  path: '/units/:unitId/blocks/:blockId/action-plan',
  summary: 'P16 Action-plan autosave (409 locked after competition submit)',
  tags,
  auth: playerAuth,
  middleware: [requireAuth],
  params: BlockParams,
  body: ActionPlanInput,
  response: ActionPlanSaved,
  handler: ctl.actionPlan,
})
route(learningRouter, {
  method: 'get',
  path: '/units/:unitId/blocks/:blockId/action-plan.pdf',
  summary: 'P16 Action-plan PDF (generated on demand, cached until answers change)',
  tags,
  auth: `${playerAuth} · own answers only`,
  middleware: [requireAuth],
  params: BlockParams,
  raw: true,
  produces: 'application/pdf',
  handler: ctl.actionPlanPdfFile,
})
route(learningRouter, {
  method: 'put',
  path: '/units/:unitId/blocks/:blockId/survey',
  summary: 'P16 Survey block answers',
  tags,
  auth: playerAuth,
  middleware: [requireAuth],
  params: BlockParams,
  body: SurveyInput,
  response: SurveySaved,
  handler: ctl.survey,
})
route(learningRouter, {
  method: 'get',
  path: '/units/:unitId/blocks/:blockId/scorm',
  summary: 'P16 SCORM launch + saved state',
  tags,
  auth: playerAuth,
  middleware: [requireAuth],
  params: BlockParams,
  response: ScormGet,
  handler: ctl.scormGet,
})
route(learningRouter, {
  method: 'put',
  path: '/units/:unitId/blocks/:blockId/scorm',
  summary: 'P16 SCORM state (block completes on completed | passed)',
  tags,
  auth: playerAuth,
  middleware: [requireAuth],
  params: BlockParams,
  body: ScormPut,
  handler: ctl.scormPut,
})
route(learningRouter, {
  method: 'post',
  path: '/units/:unitId/complete',
  summary: 'P16 Complete unit (idempotent; points and certificate once)',
  tags,
  auth: playerAuth,
  middleware: [requireAuth],
  params: UnitParams,
  response: UnitCompleteResponse,
  handler: ctl.complete,
})
route(learningRouter, {
  method: 'get',
  path: '/assessments/:id',
  summary: 'Assessment (no answer keys)',
  tags,
  auth: 'member(p) · own attempts · answer keys never returned',
  middleware: [requireAuth],
  params: AssessmentParams,
  response: AssessmentView,
  handler: ctl.assessment,
})
route(learningRouter, {
  method: 'post',
  path: '/assessments/:id/attempts',
  summary: 'Submit an attempt (scored on the server)',
  tags,
  auth: 'member(p) · own attempts · 409 locked when attempts are used up',
  middleware: [requireAuth],
  params: AssessmentParams,
  body: AttemptInput,
  response: AttemptResult,
  handler: ctl.attempt,
})
route(learningRouter, {
  method: 'get',
  path: '/public/certificates/:serial',
  summary: 'Certificate verification',
  tags: ['Public'],
  auth: 'public · returns name, course, date only',
  params: SerialParams,
  response: CertificateCheck,
  handler: ctl.certificate,
})
