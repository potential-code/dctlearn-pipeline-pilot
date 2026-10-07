import * as ctl from '@server/controllers/platform.controller'
import { route } from '@server/lib/route'
import { requireRole } from '@server/middleware/auth.middleware'
import { idParam } from '@shared/schemas/common'
import {
  ExportsPage,
  ExportsQuery,
  JobRun,
  JobsPage,
  JobsQuery,
  ScheduleList,
} from '@shared/schemas/platform'
import { Router } from 'express'

/** Admin jobs screen and stored exports (v0.4 additions to the contract, §9.3). */
export const platformRouter = Router()
const admin = requireRole('admin')

route(platformRouter, {
  method: 'get',
  path: '/admin/jobs',
  summary: 'Background job runs, including dead letters (payloads hidden)',
  tags: ['Admin · Jobs'],
  auth: 'role(admin)',
  middleware: admin,
  query: JobsQuery,
  response: JobsPage,
  handler: ctl.listJobs,
})
route(platformRouter, {
  method: 'get',
  path: '/admin/jobs/schedules',
  summary: 'Repeating schedules and their last run',
  tags: ['Admin · Jobs'],
  auth: 'role(admin)',
  middleware: admin,
  response: ScheduleList,
  handler: ctl.listSchedules,
})
route(platformRouter, {
  method: 'post',
  path: '/admin/jobs/:id/retry',
  summary: 'Retry a failed or dead job (→ queued, attempts reset)',
  tags: ['Admin · Jobs'],
  auth: 'role(admin) · Audit: yes',
  middleware: admin,
  params: idParam,
  response: JobRun,
  handler: ctl.retryJob,
})
route(platformRouter, {
  method: 'get',
  path: '/admin/exports',
  summary: 'Stored nightly progress exports (kept 30 days)',
  tags: ['Admin · Dashboard & reports'],
  auth: 'role(admin)',
  middleware: admin,
  query: ExportsQuery,
  response: ExportsPage,
  handler: ctl.listExports,
})
route(platformRouter, {
  method: 'get',
  path: '/admin/exports/:id',
  summary: 'Download a stored progress export (CSV)',
  tags: ['Admin · Dashboard & reports'],
  auth: 'role(admin) · Audit: yes',
  middleware: admin,
  params: idParam,
  raw: true,
  produces: 'text/csv',
  handler: ctl.downloadExport,
})
