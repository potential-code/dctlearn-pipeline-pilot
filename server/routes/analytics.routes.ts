import * as ctl from '@server/controllers/analytics.controller'
import { route } from '@server/lib/route'
import { requireRole } from '@server/middleware/auth.middleware'
import { userWriteLimiter } from '@server/middleware/rate-limit.middleware'
import {
  Dashboard,
  DashboardQuery,
  InsightsAnswer,
  InsightsAsk,
  MicrositeReport,
  ProgressCsvQuery,
  ReportQuery,
} from '@shared/schemas/analytics'
import { micrositeParam } from '@shared/schemas/common'
import { Router } from 'express'

export const analyticsRouter = Router()
const tags = ['Admin · Dashboard & reports']
const admin = requireRole('admin')

route(analyticsRouter, {
  method: 'get',
  path: '/admin/dashboard',
  summary: 'P45 Dashboard (KPIs, series, per microsite, per role, recent sign-ups)',
  tags,
  auth: 'role(admin)',
  middleware: admin,
  query: DashboardQuery,
  response: Dashboard,
  handler: ctl.getDashboard,
})
route(analyticsRouter, {
  method: 'get',
  path: '/admin/microsites/:p/report',
  summary: 'P55 Microsite report (dashboard scoped to one microsite + top courses)',
  tags,
  auth: 'role(admin)',
  middleware: admin,
  params: micrositeParam,
  query: ReportQuery,
  response: MicrositeReport,
  handler: ctl.getReport,
})
route(analyticsRouter, {
  method: 'post',
  path: '/admin/insights/ask',
  summary: 'P45 Ask AI about the aggregates (503 feature_off when AI is not configured)',
  tags,
  auth: 'role(admin) · aggregates only',
  middleware: [...admin, userWriteLimiter],
  body: InsightsAsk,
  response: InsightsAnswer,
  handler: ctl.askInsights,
})
route(analyticsRouter, {
  method: 'get',
  path: '/admin/exports/progress.csv',
  summary: 'P55 Progress CSV (user, course, progress %, completed at)',
  tags,
  auth: 'role(admin) · Audit: yes',
  middleware: [...admin, userWriteLimiter],
  query: ProgressCsvQuery,
  raw: true,
  produces: 'text/csv',
  handler: ctl.exportProgress,
})
