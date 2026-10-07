import * as ctl from '@server/controllers/mentoring.controller'
import { forbidden } from '@server/lib/errors'
import { noBody, route } from '@server/lib/route'
import { requireRole } from '@server/middleware/auth.middleware'
import { requireFeature, requireMember } from '@server/middleware/microsite.middleware'
import type { Role } from '@shared/roles'
import { pagination } from '@shared/schemas/common'
import {
  BookingCreated,
  BookingInput,
  BookingParams,
  BookingStatusResponse,
  CancelInput,
  ChooseInput,
  ChooseResponse,
  CreatedId,
  GrowLogsPage,
  MatchResponse,
  MenteeFeedbackInput,
  MentorDetail,
  MentorParams,
  MentorsTabQuery,
  MentorsTabResponse,
  MicrositeMentoringParams,
  MyBookingsPage,
  MyBookingsQuery,
  RegistrationDone,
  RegistrationInput,
  RegistrationState,
  SessionState,
  SessionToken,
  SlotsQuery,
  SlotsResponse,
} from '@shared/schemas/mentoring'
import { type RequestHandler, Router } from 'express'

/** P17–P22 learner mentoring + booking actions shared by mentee and mentor. */
export const mentoringRouter = Router()
const tags = ['Mentoring']

/** After requireMember: the matrix allows learners (and admin to browse); sub admins are 403. */
const only =
  (...roles: Role[]): RequestHandler =>
  (_req, res, next) =>
    next(res.locals.viewer && roles.includes(res.locals.viewer.role) ? undefined : forbidden())

const memberMentoring = (...roles: Role[]) => [
  ...requireMember,
  requireFeature('mentoring'),
  only(...roles),
]

route(mentoringRouter, {
  method: 'get',
  path: '/microsites/:p/mentors',
  summary: 'P17 Mentors of the microsite (P52 mentors tab shape)',
  tags,
  auth: 'member(p) with mentoring on · learner or admin · mentors linked to p only',
  middleware: memberMentoring('learner', 'admin'),
  params: MicrositeMentoringParams,
  query: MentorsTabQuery,
  response: MentorsTabResponse,
  handler: ctl.mentors,
})

route(mentoringRouter, {
  method: 'get',
  path: '/microsites/:p/mentoring/registration',
  summary: 'P19 Mentee registration form id and own answers',
  tags,
  auth: 'member(p) with mentoring on · learner or admin · own entry',
  middleware: memberMentoring('learner', 'admin'),
  params: MicrositeMentoringParams,
  response: RegistrationState,
  handler: ctl.registration,
})

route(mentoringRouter, {
  method: 'post',
  path: '/microsites/:p/mentoring/registration',
  summary: 'P19 Submit mentee registration (one entry; 409 when already registered)',
  tags,
  auth: 'member(p) with mentoring on · learner · own · Sanitise: text answers',
  middleware: memberMentoring('learner'),
  params: MicrositeMentoringParams,
  body: RegistrationInput,
  response: RegistrationDone,
  handler: ctl.register,
})

route(mentoringRouter, {
  method: 'post',
  path: '/microsites/:p/mentoring/match',
  summary: 'P20 Mentor suggestions (rule-based or AI; `source`)',
  tags,
  auth: 'member(p) with mentoring on · learner · registration complete (409)',
  middleware: memberMentoring('learner'),
  params: MicrositeMentoringParams,
  body: noBody,
  response: MatchResponse,
  handler: ctl.match,
})

route(mentoringRouter, {
  method: 'post',
  path: '/microsites/:p/mentoring/match/choose',
  summary: 'P20 Choose a mentor — sends a mentee application the mentor accepts or declines',
  tags,
  auth: 'member(p) with mentoring on · learner · one pending application / active match (409)',
  middleware: memberMentoring('learner'),
  params: MicrositeMentoringParams,
  body: ChooseInput,
  response: ChooseResponse,
  handler: ctl.choose,
})

route(mentoringRouter, {
  method: 'get',
  path: '/mentors/:mentorId',
  summary: 'P18 Mentor profile (no e-mail / phone)',
  tags,
  auth: 'learner: mentor linked to one of own microsites with mentoring on (trainers: browse) · mentor: own · admin',
  middleware: requireRole('learner', 'mentor', 'admin'),
  params: MentorParams,
  response: MentorDetail,
  handler: ctl.mentorDetail,
})

route(mentoringRouter, {
  method: 'get',
  path: '/mentors/:mentorId/slots',
  summary: 'P21 Free 60-minute slots (UTC), default the next 14 days, at most 31',
  tags,
  auth: 'as P18 · learners get slots only where mentoring is on',
  middleware: requireRole('learner', 'mentor', 'admin'),
  params: MentorParams,
  query: SlotsQuery,
  response: SlotsResponse,
  handler: ctl.slots,
})

route(mentoringRouter, {
  method: 'post',
  path: '/bookings',
  summary: 'P21 Book a slot with the matched mentor (409 "slot just taken")',
  tags,
  auth: 'role(learner) · matched mentor in a microsite with mentoring on · own',
  middleware: requireRole('learner'),
  body: BookingInput,
  response: BookingCreated,
  status: 201,
  handler: ctl.book,
})

route(mentoringRouter, {
  method: 'get',
  path: '/me/bookings',
  summary: 'P22 My mentoring sessions',
  tags,
  auth: 'role(learner) · own',
  middleware: requireRole('learner'),
  query: MyBookingsQuery,
  response: MyBookingsPage,
  handler: ctl.myBookings,
})

route(mentoringRouter, {
  method: 'get',
  path: '/me/grow-logs',
  summary: 'P22 GROW logs written for me (read-only)',
  tags,
  auth: 'role(learner) · own (mentee)',
  middleware: requireRole('learner'),
  query: pagination,
  response: GrowLogsPage,
  handler: ctl.myGrowLogs,
})

route(mentoringRouter, {
  method: 'post',
  path: '/bookings/:id/cancel',
  summary: 'P22 / P31 Cancel a session (mentee or mentor, ≥ 2 h before start)',
  tags,
  auth: 'learner (own) or mentor (own) · 409 outside the window',
  middleware: requireRole('learner', 'mentor'),
  params: BookingParams,
  body: CancelInput,
  response: BookingStatusResponse,
  handler: ctl.cancel,
})

route(mentoringRouter, {
  method: 'get',
  path: '/bookings/:id/session',
  summary: 'P22 Session lobby state',
  tags,
  auth: 'learner (own) or mentor (own)',
  middleware: requireRole('learner', 'mentor'),
  params: BookingParams,
  response: SessionState,
  handler: ctl.session,
})

route(mentoringRouter, {
  method: 'post',
  path: '/bookings/:id/session/token',
  summary: 'P22 Zoom Video SDK token (503 feature_off when Zoom is not configured)',
  tags,
  auth: 'learner (own) or mentor (own) · inside the join window only (409)',
  middleware: requireRole('learner', 'mentor'),
  params: BookingParams,
  body: noBody,
  response: SessionToken,
  handler: ctl.sessionToken,
})

route(mentoringRouter, {
  method: 'post',
  path: '/bookings/:id/feedback',
  summary: 'P22 Mentee feedback (once)',
  tags,
  auth: 'role(learner) · own · Sanitise: comment',
  middleware: requireRole('learner'),
  params: BookingParams,
  body: MenteeFeedbackInput,
  response: CreatedId,
  status: 201,
  handler: ctl.feedback,
})
