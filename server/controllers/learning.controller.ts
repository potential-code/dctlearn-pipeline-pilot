import type { RouteContext } from '@server/lib/route'
import { micrositeOf } from '@server/middleware/microsite.middleware'
import { actionPlanPdf, saveActionPlan } from '@server/services/learning/action-plan.service'
import { getAssessment, submitAttempt } from '@server/services/learning/assessment.service'
import {
  getScormBlock,
  putScormBlock,
  saveSurveyBlock,
} from '@server/services/learning/block-answers.service'
import { verifyCertificate } from '@server/services/learning/certificate.service'
import { courseView, unitView } from '@server/services/learning/player.service'
import { completeUnit, saveBlockProgress } from '@server/services/learning/progress.service'

type Ctx<P = unknown, Q = unknown, B = unknown> = RouteContext<P, Q, B>
// biome-ignore lint/suspicious/noExplicitAny: bodies are validated by the route's schema
type Any = any
type BlockP = { unitId: string; blockId: string }

/** P16 player, assessments and the public certificate check. Thin: services hold the rules. */

export const course = ({ viewer, res, params }: Ctx<{ p: string; slug: string }>) =>
  courseView(viewer, micrositeOf(res), params.slug)
export const unit = ({ viewer, params }: Ctx<{ unitId: string }>) => unitView(viewer, params.unitId)
export const blockProgress = async ({ viewer, params, body }: Ctx<BlockP, unknown, Any>) => {
  await saveBlockProgress(viewer, params.unitId, params.blockId, body)
}
export const actionPlan = ({ viewer, params, body }: Ctx<BlockP, unknown, Any>) =>
  saveActionPlan(viewer, params.unitId, params.blockId, body.answers)
export const actionPlanPdfFile = async ({ viewer, params, res }: Ctx<BlockP>) => {
  const bytes = await actionPlanPdf(viewer, params.unitId, params.blockId)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'inline; filename="action-plan.pdf"')
  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.end(Buffer.from(bytes))
}
export const survey = ({ viewer, params, body }: Ctx<BlockP, unknown, Any>) =>
  saveSurveyBlock(viewer, params.unitId, params.blockId, body.answers)
export const scormGet = ({ viewer, params }: Ctx<BlockP>) =>
  getScormBlock(viewer, params.unitId, params.blockId)
export const scormPut = async ({ viewer, params, body }: Ctx<BlockP, unknown, Any>) => {
  await putScormBlock(viewer, params.unitId, params.blockId, body.cmi)
}
export const complete = ({ viewer, params }: Ctx<{ unitId: string }>) =>
  completeUnit(viewer, params.unitId)
export const assessment = ({ viewer, params }: Ctx<{ id: string }>) =>
  getAssessment(viewer, params.id)
export const attempt = ({ viewer, params, body }: Ctx<{ id: string }, unknown, Any>) =>
  submitAttempt(viewer, params.id, body)
export const certificate = ({ params }: Ctx<{ serial: string }>) => verifyCertificate(params.serial)
