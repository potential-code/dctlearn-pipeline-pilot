import * as ctl from '@server/controllers/scorm.controller'
import { route } from '@server/lib/route'
import { requireAuth } from '@server/middleware/auth.middleware'
import { Router } from 'express'

/** Unpacked SCORM files behind the session and course access (member of a microsite with it). */
export const scormRouter = Router()

route(scormRouter, {
  method: 'get',
  path: '/scorm/:pkg/*path',
  summary: 'SCORM package file',
  tags: ['Learner · Player'],
  auth: 'signed-in · member(p) of a live microsite whose course uses the package (admin ✓) · 404 otherwise',
  middleware: [requireAuth],
  raw: true,
  produces: 'text/html',
  handler: ctl.file,
})
