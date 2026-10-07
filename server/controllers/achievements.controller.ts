import { validationFailed } from '@server/lib/errors'
import type { RouteContext } from '@server/lib/route'
import { micrositeOf } from '@server/middleware/microsite.middleware'
import { getAchievements } from '@server/services/achievements/achievements.service'
import { adjustPoints, listPoints } from '@server/services/achievements/admin-points.service'
import * as badges from '@server/services/achievements/badges.service'
import * as ext from '@server/services/achievements/external-certs.service'
import { ExternalCertUploadFields } from '@shared/schemas/achievements'

type Ctx<P = unknown, Q = unknown, B = unknown> = RouteContext<P, Q, B>
// biome-ignore lint/suspicious/noExplicitAny: bodies are validated by the route's schema
type Any = any

/* learner (P51) */
export const achievements = ({ viewer, res }: Ctx) => getAchievements(viewer, micrositeOf(res))
export const uploadExternal = ({ viewer, res, req }: Ctx) => {
  const fields = ExternalCertUploadFields.safeParse(req.body ?? {})
  if (!fields.success) throw validationFailed({ courseId: 'Choose a course' })
  if (!req.file) throw validationFailed({ file: 'Choose a file' })
  return ext.uploadExternalCertificate(viewer, micrositeOf(res), fields.data.courseId, req.file)
}
export const deleteExternal = async ({ viewer, res, params }: Ctx<{ id: string }>) => {
  await ext.deleteExternalCertificate(viewer, micrositeOf(res), params.id)
}

/* admin (P58) */
export const listBadges = () => badges.listBadges()
export const createBadge = ({ viewer, body }: Ctx<unknown, unknown, Any>) =>
  badges.createBadge(body, viewer)
export const updateBadge = ({ viewer, params, body }: Ctx<{ key: string }, unknown, Any>) =>
  badges.updateBadge(params.key, body, viewer)
export const deleteBadge = async ({ viewer, params }: Ctx<{ key: string }>) => {
  await badges.deleteBadge(params.key, viewer)
}
export const awardBadge = ({ viewer, params, body }: Ctx<{ key: string }, unknown, Any>) =>
  badges.awardBadge(params.key, body.userId, viewer)
export const points = ({ viewer, query }: Ctx<unknown, Any>) => listPoints(viewer, query)
export const adjust = ({ viewer, body }: Ctx<unknown, unknown, Any>) => adjustPoints(viewer, body)
export const externalList = ({ viewer, query }: Ctx<unknown, Any>) =>
  ext.listExternalCertificates(viewer, query)
export const approve = ({ viewer, params }: Ctx<{ id: string }>) =>
  ext.approveExternalCertificate(params.id, viewer)
export const reject = ({ viewer, params, body }: Ctx<{ id: string }, unknown, Any>) =>
  ext.rejectExternalCertificate(params.id, body.note, viewer)
