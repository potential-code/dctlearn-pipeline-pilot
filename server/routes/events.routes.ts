import * as ctl from '@server/controllers/events.controller'
import { route } from '@server/lib/route'
import { requireRole } from '@server/middleware/auth.middleware'
import { idParam, pagination } from '@shared/schemas/common'
import {
  AdminEvent,
  AdminEventsPage,
  AdminEventsQuery,
  CancelEventInput,
  EventInput,
  ParticipantsPage,
  RecordingInput,
} from '@shared/schemas/events'
import { Router } from 'express'

/** P57 events & workshops (admin). Learner views are the P52 workshops tab and P14 events. */
export const eventsRouter = Router()

const tags = ['Admin · Events']
const admin = requireRole('admin')

route(eventsRouter, {
  method: 'get',
  path: '/admin/events',
  summary: 'P57 Events',
  tags,
  auth: 'role(admin)',
  middleware: admin,
  query: AdminEventsQuery,
  response: AdminEventsPage,
  handler: ctl.list,
})
route(eventsRouter, {
  method: 'post',
  path: '/admin/events',
  summary: 'P57 Create event (audiences = microsites)',
  tags,
  auth: 'role(admin) · https only for links · Audit: yes',
  middleware: admin,
  body: EventInput,
  response: AdminEvent,
  status: 201,
  handler: ctl.create,
})
route(eventsRouter, {
  method: 'put',
  path: '/admin/events/:id',
  summary: 'P57 Update event (cancelled → 409; optional ifMatch)',
  tags,
  auth: 'role(admin) · https only for links',
  middleware: admin,
  params: idParam,
  body: EventInput,
  response: AdminEvent,
  handler: ctl.update,
})
route(eventsRouter, {
  method: 'delete',
  path: '/admin/events/:id',
  summary: 'P57 Delete event (soft delete)',
  tags,
  auth: 'role(admin)',
  middleware: admin,
  params: idParam,
  handler: ctl.remove,
})
route(eventsRouter, {
  method: 'post',
  path: '/admin/events/:id/cancel',
  summary: 'P57 Cancel (§9.1 upcoming → cancelled)',
  tags,
  auth: 'role(admin) · Audit: yes',
  middleware: admin,
  params: idParam,
  body: CancelEventInput,
  response: AdminEvent,
  handler: ctl.cancel,
})
route(eventsRouter, {
  method: 'put',
  path: '/admin/events/:id/recording',
  summary: 'P57 Attach recording (publish → learners see it)',
  tags,
  auth: 'role(admin) · https only',
  middleware: admin,
  params: idParam,
  body: RecordingInput,
  response: AdminEvent,
  handler: ctl.recording,
})
route(eventsRouter, {
  method: 'get',
  path: '/admin/events/:id/participants',
  summary: 'P57 Participants (members of the audience microsites)',
  tags,
  auth: 'role(admin)',
  middleware: admin,
  params: idParam,
  query: pagination,
  response: ParticipantsPage,
  handler: ctl.participants,
})
