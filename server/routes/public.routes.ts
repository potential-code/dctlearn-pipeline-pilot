import * as ctl from '@server/controllers/public.controller'
import { route } from '@server/lib/route'
import { requireAuth } from '@server/middleware/auth.middleware'
import { publicFormLimiter } from '@server/middleware/rate-limit.middleware'
import { micrositeParam } from '@shared/schemas/common'
import {
  AccessRequestResponse,
  LoginConfig,
  OkResponse,
  PublicLanding,
  RegisterInterest,
} from '@shared/schemas/microsites'
import { FaqResponse, HomeResponse, PageParams, PageResponse } from '@shared/schemas/public'
import { Router } from 'express'

export const publicRouter = Router()
const tags = ['Public']

route(publicRouter, {
  method: 'get',
  path: '/public/home',
  summary: 'P01 Main home',
  tags,
  auth: 'public',
  response: HomeResponse,
  handler: ctl.home,
})
route(publicRouter, {
  method: 'get',
  path: '/public/pages/:page',
  summary: 'P02/P03 Employees, Students pages',
  tags,
  auth: 'public',
  params: PageParams,
  response: PageResponse,
  handler: ctl.page,
})
route(publicRouter, {
  method: 'get',
  path: '/public/faq',
  summary: 'P04 FAQ',
  tags,
  auth: 'public',
  response: FaqResponse,
  handler: ctl.faq,
})
route(publicRouter, {
  method: 'get',
  path: '/public/microsites/:p/landing',
  summary: 'P12 Microsite landing (published version)',
  tags,
  auth: 'public (live microsites only)',
  params: micrositeParam,
  response: PublicLanding,
  handler: ctl.landing,
})
route(publicRouter, {
  method: 'post',
  path: '/public/microsites/:p/register-interest',
  summary: 'P12 Register interest',
  tags,
  auth: 'public · rate 5/min/IP · Sanitise: message',
  middleware: [publicFormLimiter],
  params: micrositeParam,
  body: RegisterInterest,
  response: OkResponse,
  status: 201,
  handler: ctl.registerInterest,
})
route(publicRouter, {
  method: 'get',
  path: '/public/microsites/:p/login-config',
  summary: 'P07 Microsite login config (same accounts as P06)',
  tags,
  auth: 'public · 404 for landing_only or non-live',
  params: micrositeParam,
  response: LoginConfig,
  handler: ctl.login,
})
route(publicRouter, {
  method: 'post',
  path: '/microsites/:p/access-request',
  summary: 'P07 Signed-in non-member asks for access',
  tags,
  auth: 'signed-in learner · one open request per user and microsite (409)',
  middleware: [requireAuth],
  params: micrositeParam,
  response: AccessRequestResponse,
  status: 201,
  handler: ctl.accessRequest,
})
