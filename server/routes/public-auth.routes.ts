import * as ctl from '@server/controllers/public-auth.controller'
import { route } from '@server/lib/route'
import { authLimiter } from '@server/middleware/rate-limit.middleware'
import {
  EmployeeRegistration,
  EmployeeRegistrationResponse,
  InvitationAccept,
  InvitationAcceptResponse,
  InvitationView,
  PasswordTokenResponse,
  TokenParam,
} from '@shared/schemas/identity'
import { Router } from 'express'

export const publicAuthRouter = Router()
const tags = ['Auth']

route(publicAuthRouter, {
  method: 'post',
  path: '/public/register/employee',
  summary: 'P08 Employee registration (DCT e-mail domain only; membership employees)',
  tags,
  auth: 'public · rate: auth · domain checked server-side · role forced to learner',
  middleware: [authLimiter],
  body: EmployeeRegistration,
  response: EmployeeRegistrationResponse,
  status: 201,
  handler: ctl.register,
})

route(publicAuthRouter, {
  method: 'get',
  path: '/public/password-token/:token',
  summary: 'P09/P10 Inspect a reset or invitation link',
  tags,
  auth: 'public (token)',
  middleware: [authLimiter],
  params: TokenParam,
  response: PasswordTokenResponse,
  handler: ctl.passwordToken,
})

route(publicAuthRouter, {
  method: 'get',
  path: '/public/invitations/:token',
  summary: 'P11 View invitation',
  tags,
  auth: 'public (token) · 410 when unknown',
  middleware: [authLimiter],
  params: TokenParam,
  response: InvitationView,
  handler: ctl.getInvitation,
})

route(publicAuthRouter, {
  method: 'post',
  path: '/public/invitations/:token/accept',
  summary: 'P11 Accept invitation → account + session',
  tags,
  auth: 'public (token) · single-use, 14-day TTL, bound to the invited e-mail · role and microsite from the invitation · Audit: yes',
  middleware: [authLimiter],
  params: TokenParam,
  body: InvitationAccept,
  response: InvitationAcceptResponse,
  status: 201,
  handler: ctl.accept,
})
