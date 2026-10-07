import * as ctl from '@server/controllers/data-rights.controller'
import { route } from '@server/lib/route'
import { requireAuth, requireRole } from '@server/middleware/auth.middleware'
import { userWriteLimiter } from '@server/middleware/rate-limit.middleware'
import { idParam } from '@shared/schemas/common'
import { AnonymiseResult, DataRequestAccepted } from '@shared/schemas/platform'
import { Router } from 'express'

/** §9.7 personal data rights. */
export const dataRightsRouter = Router()
const tags = ['Me · Data rights']

route(dataRightsRouter, {
  method: 'get',
  path: '/me/export',
  summary: 'Request a copy of my data (e-mailed link, JSON)',
  tags,
  auth: 'signed-in · own',
  middleware: [requireAuth, userWriteLimiter],
  response: DataRequestAccepted,
  status: 202,
  handler: ctl.requestExport,
})
route(dataRightsRouter, {
  method: 'get',
  path: '/me/exports/:id',
  summary: 'Download my data export (24 h, same user only)',
  tags,
  auth: 'signed-in · own',
  middleware: [requireAuth],
  params: idParam,
  raw: true,
  produces: 'application/json',
  handler: ctl.downloadExport,
})
route(dataRightsRouter, {
  method: 'post',
  path: '/me/delete-request',
  summary: 'Ask for my account to be deleted (an admin confirms)',
  tags,
  auth: 'signed-in · own · Audit: yes',
  middleware: [requireAuth, userWriteLimiter],
  response: DataRequestAccepted,
  status: 202,
  handler: ctl.requestDeletion,
})
route(dataRightsRouter, {
  method: 'post',
  path: '/admin/users/:id/anonymise',
  summary: 'P47 Anonymise a user who asked for deletion',
  tags: ['Admin · Users'],
  auth: 'role(admin) · Audit: yes · only with an open deletion request',
  middleware: requireRole('admin'),
  params: idParam,
  response: AnonymiseResult,
  handler: ctl.anonymise,
})
