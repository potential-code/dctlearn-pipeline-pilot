import * as ctl from '@server/controllers/microsite.controller'
import { route } from '@server/lib/route'
import { requireRole } from '@server/middleware/auth.middleware'
import { requireMember, requireSubAdmin } from '@server/middleware/microsite.middleware'
import { userWriteLimiter } from '@server/middleware/rate-limit.middleware'
import { uploadSingle } from '@server/middleware/upload.middleware'
import { Created, idParam, micrositeParam, slug, uuid } from '@shared/schemas/common'
import {
  AdminMicrositeDetail,
  AdminMicrositeList,
  ApproveResponse,
  CsvConfirm,
  CsvPreview,
  DashboardResponse,
  HubParams,
  InvitationsPage,
  InvitationsQuery,
  InviteMembers,
  InviteResult,
  LandingInput,
  LandingTemplates,
  MembersPage,
  MembersQuery,
  MicrositeInput,
  MicrositeRequestInput,
  MicrositeRequestList,
  MicrositeUpdate,
  OkResponse,
  PublishResponse,
  RejectInput,
  StatusChange,
  SubAdminDashboard,
} from '@shared/schemas/microsites'
import { Router } from 'express'
import { z } from 'zod'

export const micrositesRouter = Router()

/* ------------------------------------------------------------------ learner */

route(micrositesRouter, {
  method: 'get',
  path: '/microsites/:p/dashboard',
  summary: 'P14 Dashboard',
  tags: ['Learner'],
  auth: 'member(p) · own data only',
  middleware: requireMember,
  params: micrositeParam,
  response: DashboardResponse,
  handler: ctl.dashboard,
})

route(micrositesRouter, {
  method: 'get',
  path: '/microsites/:p/hub/:tab',
  summary:
    'P52 Hub tab (courses | workshops | mentors | ai_coaches | ai_tools | resources) — shape per tab',
  tags: ['Learner'],
  auth: 'member(p) · tab must be enabled (404) · resources approved only · mentors linked to p only',
  middleware: requireMember,
  params: HubParams,
  raw: false,
  handler: ctl.hub,
})

/* ------------------------------------------------------------------ sub admin (P35, P40) */

const subTags = ['Sub admin']
const memberParams = z.object({ p: slug, userId: uuid })
const invitationParams = z.object({ p: slug, id: uuid })

route(micrositesRouter, {
  method: 'get',
  path: '/microsites/:p/admin/dashboard',
  summary: 'P35 Sub-admin dashboard (landing draft + KPIs)',
  tags: subTags,
  auth: 'sub_admin(p) or admin',
  middleware: requireSubAdmin,
  params: micrositeParam,
  response: SubAdminDashboard,
  handler: ctl.subDashboard,
})
route(micrositesRouter, {
  method: 'put',
  path: '/microsites/:p/admin/landing',
  summary: 'P35 Save landing draft (ifMatch = updatedAt)',
  tags: subTags,
  auth: 'sub_admin(p) or admin · Sanitise: customHtml, embed.html, popup text · Audit: yes',
  middleware: requireSubAdmin,
  params: micrositeParam,
  body: LandingInput,
  response: SubAdminDashboard,
  handler: ctl.saveLanding,
})
route(micrositesRouter, {
  method: 'post',
  path: '/microsites/:p/admin/landing/publish',
  summary: 'P35 Publish landing',
  tags: subTags,
  auth: 'sub_admin(p) or admin · Audit: yes',
  middleware: requireSubAdmin,
  params: micrositeParam,
  response: PublishResponse,
  handler: ctl.publish,
})
route(micrositesRouter, {
  method: 'get',
  path: '/microsites/:p/admin/members',
  summary: 'P40 Members',
  tags: subTags,
  auth: 'sub_admin(p) or admin · name, e-mail, status, progress only',
  middleware: requireSubAdmin,
  params: micrositeParam,
  query: MembersQuery,
  response: MembersPage,
  handler: ctl.members,
})
route(micrositesRouter, {
  method: 'post',
  path: '/microsites/:p/admin/invitations',
  summary: 'P40 Invite (learner or judge)',
  tags: subTags,
  auth: 'sub_admin(p) or admin · rate 30/min/user · Audit: yes',
  middleware: [...requireSubAdmin, userWriteLimiter],
  params: micrositeParam,
  body: InviteMembers,
  response: InviteResult,
  status: 201,
  handler: ctl.invite,
})
route(micrositesRouter, {
  method: 'post',
  path: '/microsites/:p/admin/invitations/csv',
  summary: 'P40 CSV upload → preview + token (columns email, name)',
  tags: subTags,
  auth: 'sub_admin(p) or admin · CSV ≤ 2 MB / 5,000 rows · one import at a time',
  middleware: [...requireSubAdmin, userWriteLimiter, uploadSingle('file', 2 * 1024 * 1024)],
  params: micrositeParam,
  response: CsvPreview,
  handler: ctl.csvPreview,
})
route(micrositesRouter, {
  method: 'post',
  path: '/microsites/:p/admin/invitations/csv/confirm',
  summary: 'P40 Confirm CSV invitations',
  tags: subTags,
  auth: 'sub_admin(p) or admin · Audit: yes',
  middleware: [...requireSubAdmin, userWriteLimiter],
  params: micrositeParam,
  body: CsvConfirm,
  response: InviteResult,
  status: 201,
  handler: ctl.csvConfirm,
})
route(micrositesRouter, {
  method: 'get',
  path: '/microsites/:p/admin/invitations',
  summary: 'P40 Invitations',
  tags: subTags,
  auth: 'sub_admin(p) or admin',
  middleware: requireSubAdmin,
  params: micrositeParam,
  query: InvitationsQuery,
  response: InvitationsPage,
  handler: ctl.invitations,
})
route(micrositesRouter, {
  method: 'post',
  path: '/microsites/:p/admin/invitations/:id/resend',
  summary: 'P40 Resend (new token)',
  tags: subTags,
  auth: 'sub_admin(p) or admin · Audit: yes',
  middleware: [...requireSubAdmin, userWriteLimiter],
  params: invitationParams,
  response: OkResponse,
  handler: ctl.resend,
})
route(micrositesRouter, {
  method: 'post',
  path: '/microsites/:p/admin/invitations/:id/revoke',
  summary: 'P40 Revoke',
  tags: subTags,
  auth: 'sub_admin(p) or admin · Audit: yes',
  middleware: requireSubAdmin,
  params: invitationParams,
  response: OkResponse,
  handler: ctl.revoke,
})
route(micrositesRouter, {
  method: 'delete',
  path: '/microsites/:p/admin/members/:userId',
  summary: 'P40 Remove membership (progress kept)',
  tags: subTags,
  auth: 'sub_admin(p) or admin · Audit: yes',
  middleware: requireSubAdmin,
  params: memberParams,
  handler: ctl.removeMember,
})
route(micrositesRouter, {
  method: 'post',
  path: '/microsite-requests',
  summary: '§7 Request a new microsite',
  tags: subTags,
  auth: 'role(sub_admin) or role(admin) · Audit: yes',
  middleware: requireRole('sub_admin', 'admin'),
  body: MicrositeRequestInput,
  response: Created,
  status: 201,
  handler: ctl.requestMicrosite,
})

/* ------------------------------------------------------------------ admin (P50, P36, P37) */

const adminTags = ['Admin · Microsites']
const admin = requireRole('admin')

route(micrositesRouter, {
  method: 'get',
  path: '/admin/microsites',
  summary: 'P50 Microsites',
  tags: adminTags,
  auth: 'role(admin)',
  middleware: admin,
  response: AdminMicrositeList,
  handler: ctl.list,
})
route(micrositesRouter, {
  method: 'post',
  path: '/admin/microsites',
  summary: 'P36 Create microsite (draft)',
  tags: adminTags,
  auth: 'role(admin) · Audit: yes',
  middleware: admin,
  body: MicrositeInput,
  response: Created,
  status: 201,
  handler: ctl.create,
})
route(micrositesRouter, {
  method: 'get',
  path: '/admin/microsites/:p',
  summary: 'P50 Microsite edit sheet',
  tags: adminTags,
  auth: 'role(admin)',
  middleware: admin,
  params: micrositeParam,
  response: AdminMicrositeDetail,
  handler: ctl.detail,
})
route(micrositesRouter, {
  method: 'put',
  path: '/admin/microsites/:p',
  summary: 'P50 Update microsite (ifMatch = updatedAt)',
  tags: adminTags,
  auth: 'role(admin) · Audit: yes',
  middleware: admin,
  params: micrositeParam,
  body: MicrositeUpdate,
  response: AdminMicrositeDetail,
  handler: ctl.update,
})
route(micrositesRouter, {
  method: 'post',
  path: '/admin/microsites/:p/status',
  summary: 'P50 Status change (§9.1)',
  tags: adminTags,
  auth: 'role(admin) · Audit: yes',
  middleware: admin,
  params: micrositeParam,
  body: StatusChange,
  response: z.strictObject({ status: z.string() }),
  handler: ctl.status,
})
route(micrositesRouter, {
  method: 'get',
  path: '/admin/landing-templates',
  summary: 'P37 Landing templates',
  tags: adminTags,
  auth: 'role(admin)',
  middleware: admin,
  response: LandingTemplates,
  handler: ctl.templates,
})
route(micrositesRouter, {
  method: 'get',
  path: '/admin/microsite-requests',
  summary: 'P50 Microsite requests',
  tags: adminTags,
  auth: 'role(admin)',
  middleware: admin,
  response: MicrositeRequestList,
  handler: ctl.requests,
})
route(micrositesRouter, {
  method: 'post',
  path: '/admin/microsite-requests/:id/approve',
  summary: 'P50 Approve → draft microsite',
  tags: adminTags,
  auth: 'role(admin) · Audit: yes',
  middleware: admin,
  params: idParam,
  response: ApproveResponse,
  status: 201,
  handler: ctl.approve,
})
route(micrositesRouter, {
  method: 'post',
  path: '/admin/microsite-requests/:id/reject',
  summary: 'P50 Reject',
  tags: adminTags,
  auth: 'role(admin) · Audit: yes',
  middleware: admin,
  params: idParam,
  body: RejectInput,
  response: OkResponse,
  handler: ctl.reject,
})
