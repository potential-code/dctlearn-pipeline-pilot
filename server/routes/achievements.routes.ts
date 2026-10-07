import { MB } from '@server/config/upload-policies'
import * as ctl from '@server/controllers/achievements.controller'
import { route } from '@server/lib/route'
import { requireRole } from '@server/middleware/auth.middleware'
import { requireMember } from '@server/middleware/microsite.middleware'
import { userWriteLimiter } from '@server/middleware/rate-limit.middleware'
import { uploadSingle } from '@server/middleware/upload.middleware'
import {
  AchievementsResponse,
  AwardCreated,
  AwardInput,
  BadgeDto,
  BadgeInput,
  BadgeList,
  BadgeParams,
  BadgeUpdate,
  ExternalCertCreated,
  ExternalCertDecision,
  ExternalCertParams,
  ExternalCertsPage,
  ExternalCertsQuery,
  PointsAdjust,
  PointsAdjusted,
  PointsPage,
  PointsQuery,
  RejectNote,
} from '@shared/schemas/achievements'
import { idParam, micrositeParam } from '@shared/schemas/common'
import { Router } from 'express'

/** P51 Achievements (learner) and P58 Achievements administration. */
export const achievementsRouter = Router()

/* ------------------------------------------------------------------ P51 learner */

const learnerOnly = requireRole('learner')

route(achievementsRouter, {
  method: 'get',
  path: '/microsites/:p/achievements',
  summary: 'P51 Achievements (points, ledger, badges, certificates, leaderboard)',
  tags: ['Learner · Achievements'],
  auth: 'member(p) · own ledger/certificates · leaderboard name + points only',
  middleware: requireMember,
  params: micrositeParam,
  response: AchievementsResponse,
  handler: ctl.achievements,
})
route(achievementsRouter, {
  method: 'post',
  path: '/microsites/:p/external-certificates',
  summary: 'P51 Upload an external certificate (multipart courseId + file)',
  tags: ['Learner · Achievements'],
  auth: 'member(p) learner · own · type/size checked by content · rate 30/min/user · Audit: yes',
  middleware: [...requireMember, ...learnerOnly, userWriteLimiter, uploadSingle('file', 10 * MB)],
  params: micrositeParam,
  response: ExternalCertCreated,
  status: 201,
  handler: ctl.uploadExternal,
})
route(achievementsRouter, {
  method: 'delete',
  path: '/microsites/:p/external-certificates/:id',
  summary: 'P51 Remove an external certificate (not once approved)',
  tags: ['Learner · Achievements'],
  auth: 'member(p) learner · own · Audit: yes',
  middleware: [...requireMember, ...learnerOnly],
  params: ExternalCertParams,
  handler: ctl.deleteExternal,
})

/* ------------------------------------------------------------------ P58 admin */

const tags = ['Admin · Achievements']
const admin = requireRole('admin')

route(achievementsRouter, {
  method: 'get',
  path: '/admin/badges',
  summary: 'P58 Badges',
  tags,
  auth: 'role(admin)',
  middleware: admin,
  response: BadgeList,
  handler: ctl.listBadges,
})
route(achievementsRouter, {
  method: 'post',
  path: '/admin/badges',
  summary: 'P58 Create badge',
  tags,
  auth: 'role(admin) · Audit: yes',
  middleware: admin,
  body: BadgeInput,
  response: BadgeDto,
  status: 201,
  handler: ctl.createBadge,
})
route(achievementsRouter, {
  method: 'put',
  path: '/admin/badges/:key',
  summary: 'P58 Update badge',
  tags,
  auth: 'role(admin) · Audit: yes',
  middleware: admin,
  params: BadgeParams,
  body: BadgeUpdate,
  response: BadgeDto,
  handler: ctl.updateBadge,
})
route(achievementsRouter, {
  method: 'delete',
  path: '/admin/badges/:key',
  summary: 'P58 Delete badge (soft)',
  tags,
  auth: 'role(admin) · Audit: yes',
  middleware: admin,
  params: BadgeParams,
  handler: ctl.deleteBadge,
})
route(achievementsRouter, {
  method: 'post',
  path: '/admin/badges/:key/award',
  summary: 'P58 Award a manual badge',
  tags,
  auth: 'role(admin) · manual badges only · Audit: yes',
  middleware: admin,
  params: BadgeParams,
  body: AwardInput,
  response: AwardCreated,
  status: 201,
  handler: ctl.awardBadge,
})
route(achievementsRouter, {
  method: 'get',
  path: '/admin/points',
  summary: 'P58 Points ledger',
  tags,
  auth: 'role(admin)',
  middleware: admin,
  query: PointsQuery,
  response: PointsPage,
  handler: ctl.points,
})
route(achievementsRouter, {
  method: 'post',
  path: '/admin/points/adjust',
  summary: 'P58 Manual points adjustment (±)',
  tags,
  auth: 'role(admin) · Audit: yes',
  middleware: admin,
  body: PointsAdjust,
  response: PointsAdjusted,
  status: 201,
  handler: ctl.adjust,
})
route(achievementsRouter, {
  method: 'get',
  path: '/admin/external-certificates',
  summary: 'P58 External certificate queue',
  tags,
  auth: 'role(admin)',
  middleware: admin,
  query: ExternalCertsQuery,
  response: ExternalCertsPage,
  handler: ctl.externalList,
})
route(achievementsRouter, {
  method: 'post',
  path: '/admin/external-certificates/:id/approve',
  summary: 'P58 Approve (completes the course)',
  tags,
  auth: 'role(admin) · Audit: yes',
  middleware: admin,
  params: idParam,
  response: ExternalCertDecision,
  handler: ctl.approve,
})
route(achievementsRouter, {
  method: 'post',
  path: '/admin/external-certificates/:id/reject',
  summary: 'P58 Reject with a note',
  tags,
  auth: 'role(admin) · Audit: yes',
  middleware: admin,
  params: idParam,
  body: RejectNote,
  response: ExternalCertDecision,
  handler: ctl.reject,
})
