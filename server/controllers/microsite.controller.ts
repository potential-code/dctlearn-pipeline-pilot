import { responseValidationEnabled } from '@server/config/env'
import { notFound, validationFailed } from '@server/lib/errors'
import type { RouteContext } from '@server/lib/route'
import { micrositeOf } from '@server/middleware/microsite.middleware'
import { resendInvitation, revokeInvitation } from '@server/services/identity/invitation.service'
import * as admin from '@server/services/microsites/admin-microsites.service'
import { getDashboard, getHubTab } from '@server/services/microsites/dashboard.service'
import { publishLanding, saveDraft } from '@server/services/microsites/landing.service'
import { findMicrositeBySlug } from '@server/services/microsites/lookup.service'
import * as sub from '@server/services/microsites/subadmin.service'
import type { HubTab } from '@shared/enums'

type Ctx<P = unknown, Q = unknown, B = unknown> = RouteContext<P, Q, B>
// biome-ignore lint/suspicious/noExplicitAny: bodies are validated by the route's schema
type Any = any

/* learner */
export const dashboard = ({ viewer, res }: Ctx) => getDashboard(viewer, micrositeOf(res))
export const hub = async ({ viewer, res, params, req }: Ctx<{ p: string; tab: HubTab }>) => {
  const { result, response } = await getHubTab(viewer, micrositeOf(res), params.tab, req.query)
  return responseValidationEnabled ? response.parse(result) : result
}

/* sub admin */
export const subDashboard = ({ viewer, res }: Ctx) =>
  sub.subAdminDashboard(micrositeOf(res), viewer)
export const saveLanding = async ({ viewer, res, body }: Ctx<unknown, unknown, Any>) => {
  await saveDraft(micrositeOf(res), body, viewer)
  return sub.subAdminDashboard(micrositeOf(res), viewer)
}
export const publish = ({ viewer, res }: Ctx) => publishLanding(micrositeOf(res), viewer)
export const members = ({ res, query }: Ctx<unknown, Any>) =>
  sub.listMembers(micrositeOf(res), query)
export const invite = ({ viewer, res, body }: Ctx<unknown, unknown, Any>) =>
  sub.inviteMembers(micrositeOf(res), viewer, body)
export const csvPreview = async ({ viewer, res, req }: Ctx) => {
  if (!req.file) throw validationFailed({ file: 'Choose a CSV file' })
  return sub.previewInvitationCsv(micrositeOf(res), viewer, req.file.buffer.toString('utf-8'))
}
export const csvConfirm = ({ viewer, res, body }: Ctx<unknown, unknown, { token: string }>) =>
  sub.confirmInvitationCsv(micrositeOf(res), viewer, body.token)
export const invitations = ({ res, query }: Ctx<unknown, Any>) =>
  sub.listInvitations(micrositeOf(res), query)
export const resend = async ({ viewer, res, params }: Ctx<{ id: string }>) => {
  await resendInvitation(
    params.id,
    { id: viewer.id, name: viewer.name, ip: viewer.ip },
    micrositeOf(res).id,
  )
  return { ok: true as const }
}
export const revoke = async ({ viewer, res, params }: Ctx<{ id: string }>) => {
  await revokeInvitation(params.id, { id: viewer.id, ip: viewer.ip }, micrositeOf(res).id)
  return { ok: true as const }
}
export const removeMember = async ({ viewer, res, params }: Ctx<{ userId: string }>) => {
  await sub.removeMember(micrositeOf(res), viewer, params.userId)
}
export const requestMicrosite = ({
  viewer,
  body,
}: Ctx<unknown, unknown, { name: string; purpose: string }>) =>
  admin.createMicrositeRequest(viewer, body)

/* admin */
async function bySlug(slug: string) {
  const m = await findMicrositeBySlug(slug)
  if (!m) throw notFound()
  return m
}
export const list = ({ viewer }: Ctx) => admin.listMicrosites(viewer)
export const detail = async ({ viewer, params }: Ctx<{ p: string }>) =>
  admin.getMicrositeDetail(await bySlug(params.p), viewer)
export const create = ({ viewer, body }: Ctx<unknown, unknown, Any>) =>
  admin.createMicrosite(body, viewer)
export const update = async ({ viewer, params, body }: Ctx<{ p: string }, unknown, Any>) =>
  admin.updateMicrosite(await bySlug(params.p), body, viewer)
export const status = async ({
  viewer,
  params,
  body,
}: Ctx<{ p: string }, unknown, { status: string }>) =>
  admin.changeStatus(await bySlug(params.p), body.status, viewer)
export const templates = () => admin.listLandingTemplates()
export const requests = ({ viewer }: Ctx) => admin.listMicrositeRequests(viewer)
export const approve = ({ viewer, params }: Ctx<{ id: string }>) =>
  admin.approveMicrositeRequest(params.id, viewer)
export const reject = async ({
  viewer,
  params,
  body,
}: Ctx<{ id: string }, unknown, { note: string }>) => {
  await admin.rejectMicrositeRequest(params.id, body.note, viewer)
  return { ok: true as const }
}
