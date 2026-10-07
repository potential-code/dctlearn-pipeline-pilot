import * as ctl from '@server/controllers/mentor.controller'
import { noBody, route } from '@server/lib/route'
import { requireRole } from '@server/middleware/auth.middleware'
import { idParam } from '@shared/schemas/common'
import {
  AcceptResponse,
  Availability,
  AvailabilityInput,
  BookingStatusResponse,
  CreatedId,
  DeclineInput,
  GrowLogInput,
  GrowLogsPage,
  GrowLogsQuery,
  MentorBookingsList,
  MentorBookingsQuery,
  MentorDashboard,
  MentorFeedbackInput,
  MentorProfile,
  MentorProfileInput,
  Ok,
} from '@shared/schemas/mentoring'
import { Router } from 'express'

/** P30 mentor dashboard, GROW logs, profile, applications · P31 availability and bookings. */
export const mentorRouter = Router()
const tags = ['Mentor']
const mentorOnly = requireRole('mentor')

route(mentorRouter, {
  method: 'get',
  path: '/mentor/dashboard',
  summary: 'P30 Mentor dashboard',
  tags,
  auth: 'role(mentor) · own mentees, bookings, applications · mentee name and microsite only',
  middleware: mentorOnly,
  response: MentorDashboard,
  handler: ctl.dashboard,
})

route(mentorRouter, {
  method: 'get',
  path: '/mentor/grow-logs',
  summary: 'P30 GROW logs I wrote',
  tags,
  auth: 'role(mentor) · own',
  middleware: mentorOnly,
  query: GrowLogsQuery,
  response: GrowLogsPage,
  handler: ctl.growLogs,
})

route(mentorRouter, {
  method: 'post',
  path: '/mentor/grow-logs',
  summary: 'P30 Write a GROW log (immutable, one per booking)',
  tags,
  auth: 'role(mentor) · own booking · Sanitise: text · 409 when it exists',
  middleware: mentorOnly,
  body: GrowLogInput,
  response: CreatedId,
  status: 201,
  handler: ctl.createGrowLog,
})

route(mentorRouter, {
  method: 'get',
  path: '/mentor/profile',
  summary: 'P30 My mentor profile',
  tags,
  auth: 'role(mentor) · own',
  middleware: mentorOnly,
  response: MentorProfile,
  handler: ctl.profile,
})

route(mentorRouter, {
  method: 'put',
  path: '/mentor/profile',
  summary: 'P30 Update my mentor profile',
  tags,
  auth: 'role(mentor) · own · Sanitise: text',
  middleware: mentorOnly,
  body: MentorProfileInput,
  response: MentorProfile,
  handler: ctl.saveProfile,
})

route(mentorRouter, {
  method: 'post',
  path: '/mentor/applications/:id/accept',
  summary: 'P30 Accept a mentee application (creates the match)',
  tags,
  auth: 'role(mentor) · own application · pending only (409)',
  middleware: mentorOnly,
  params: idParam,
  body: noBody,
  response: AcceptResponse,
  handler: ctl.accept,
})

route(mentorRouter, {
  method: 'post',
  path: '/mentor/applications/:id/decline',
  summary: 'P30 Decline a mentee application',
  tags,
  auth: 'role(mentor) · own application · pending only (409)',
  middleware: mentorOnly,
  params: idParam,
  body: DeclineInput,
  response: Ok,
  handler: ctl.decline,
})

route(mentorRouter, {
  method: 'post',
  path: '/bookings/:id/mentor-feedback',
  summary: 'P30 Mentor feedback (once) — closes a confirmed session as completed / no_show',
  tags,
  auth: 'role(mentor) · own booking · Sanitise: note',
  middleware: mentorOnly,
  params: idParam,
  body: MentorFeedbackInput,
  response: CreatedId,
  status: 201,
  handler: ctl.feedback,
})

route(mentorRouter, {
  method: 'get',
  path: '/mentor/availability',
  summary: 'P31 My weekly availability and time off',
  tags,
  auth: 'role(mentor) · own',
  middleware: mentorOnly,
  response: Availability,
  handler: ctl.availability,
})

route(mentorRouter, {
  method: 'put',
  path: '/mentor/availability',
  summary: 'P31 Replace availability rules (mentor time zone) and time off',
  tags,
  auth: 'role(mentor) · own',
  middleware: mentorOnly,
  body: AvailabilityInput,
  response: Availability,
  handler: ctl.saveAvailability,
})

route(mentorRouter, {
  method: 'get',
  path: '/mentor/bookings',
  summary: 'P31 My bookings',
  tags,
  auth: 'role(mentor) · own',
  middleware: mentorOnly,
  query: MentorBookingsQuery,
  response: MentorBookingsList,
  handler: ctl.bookingsList,
})

route(mentorRouter, {
  method: 'post',
  path: '/bookings/:id/confirm',
  summary: 'P31 Confirm a requested session',
  tags,
  auth: 'role(mentor) · own booking · requested only (409)',
  middleware: mentorOnly,
  params: idParam,
  body: noBody,
  response: BookingStatusResponse,
  handler: ctl.confirm,
})

route(mentorRouter, {
  method: 'post',
  path: '/bookings/:id/no-show',
  summary: 'P31 Mark a confirmed session as no-show (after start)',
  tags,
  auth: 'role(mentor) · own booking · confirmed and started only (409)',
  middleware: mentorOnly,
  params: idParam,
  body: noBody,
  response: BookingStatusResponse,
  handler: ctl.noShow,
})
