import * as ctl from '@server/controllers/admin-mentors.controller'
import { route } from '@server/lib/route'
import { requireRole } from '@server/middleware/auth.middleware'
import { userWriteLimiter } from '@server/middleware/rate-limit.middleware'
import {
  AdminMentorMentees,
  AdminMentorParams,
  AdminMentorRow,
  AdminMentorsPage,
  AdminMentorsQuery,
  AdminMentorUpdate,
  MentorInviteInput,
  MentorInviteResult,
} from '@shared/schemas/mentoring'
import { Router } from 'express'

/** P48 mentor pool. */
export const adminMentorsRouter = Router()
const tags = ['Admin']
const adminOnly = requireRole('admin')

route(adminMentorsRouter, {
  method: 'get',
  path: '/admin/mentors',
  summary: 'P48 Mentor pool',
  tags,
  auth: 'role(admin)',
  middleware: adminOnly,
  query: AdminMentorsQuery,
  response: AdminMentorsPage,
  handler: ctl.list,
})

route(adminMentorsRouter, {
  method: 'post',
  path: '/admin/mentors/invite',
  summary: 'P48 Invite mentors (profile + microsite links created on accept)',
  tags,
  auth: 'role(admin) · Audit: yes · 30/min',
  middleware: [...adminOnly, userWriteLimiter],
  body: MentorInviteInput,
  response: MentorInviteResult,
  status: 201,
  handler: ctl.invite,
})

route(adminMentorsRouter, {
  method: 'put',
  path: '/admin/mentors/:id',
  summary: 'P48 Edit a mentor (microsites, categories, courses, booking, kind, status)',
  tags,
  auth: 'role(admin) · Audit: yes',
  middleware: adminOnly,
  params: AdminMentorParams,
  body: AdminMentorUpdate,
  response: AdminMentorRow,
  handler: ctl.update,
})

route(adminMentorsRouter, {
  method: 'get',
  path: '/admin/mentors/:id/mentees',
  summary: 'P48 Mentees of a mentor (counts only, no GROW text)',
  tags,
  auth: 'role(admin)',
  middleware: adminOnly,
  params: AdminMentorParams,
  response: AdminMentorMentees,
  handler: ctl.mentees,
})
