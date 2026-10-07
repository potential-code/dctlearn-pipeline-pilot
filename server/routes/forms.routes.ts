import * as ctl from '@server/controllers/forms.controller'
import { route } from '@server/lib/route'
import { requireAuth, requireRole } from '@server/middleware/auth.middleware'
import { Created, idParam, pagination } from '@shared/schemas/common'
import {
  AdminForm,
  AdminFormsPage,
  AdminFormsQuery,
  EntriesPage,
  EntryInput,
  FormIdParam,
  FormInput,
  LearnerForm,
} from '@shared/schemas/forms'
import { Router } from 'express'

/** P56 surveys & applications (admin) and learner forms. */
export const formsRouter = Router()

const tags = ['Admin · Forms']
const admin = requireRole('admin')

route(formsRouter, {
  method: 'get',
  path: '/admin/forms',
  summary: 'P56 Forms',
  tags,
  auth: 'role(admin)',
  middleware: admin,
  query: AdminFormsQuery,
  response: AdminFormsPage,
  handler: ctl.list,
})
route(formsRouter, {
  method: 'post',
  path: '/admin/forms',
  summary: 'P56 Create form',
  tags,
  auth: 'role(admin)',
  middleware: admin,
  body: FormInput,
  response: AdminForm,
  status: 201,
  handler: ctl.create,
})
route(formsRouter, {
  method: 'put',
  path: '/admin/forms/:id',
  summary: 'P56 Update form',
  tags,
  auth: 'role(admin)',
  middleware: admin,
  params: idParam,
  body: FormInput,
  response: AdminForm,
  handler: ctl.update,
})
route(formsRouter, {
  method: 'delete',
  path: '/admin/forms/:id',
  summary: 'P56 Delete form (soft delete, entries kept)',
  tags,
  auth: 'role(admin)',
  middleware: admin,
  params: idParam,
  handler: ctl.remove,
})
route(formsRouter, {
  method: 'get',
  path: '/admin/forms/:id/entries',
  summary: 'P56 Entries',
  tags,
  auth: 'role(admin)',
  middleware: admin,
  params: idParam,
  query: pagination,
  response: EntriesPage,
  handler: ctl.entries,
})
route(formsRouter, {
  method: 'get',
  path: '/admin/forms/:id/entries.csv',
  summary: 'P56 Entries CSV',
  tags,
  auth: 'role(admin) · Audit: yes',
  middleware: admin,
  params: idParam,
  raw: true,
  produces: 'text/csv',
  handler: ctl.entriesCsv,
})

const learnerTags = ['Learner']

route(formsRouter, {
  method: 'get',
  path: '/forms/:formId',
  summary: 'Learner form (with myEntry)',
  tags: learnerTags,
  auth: "signed-in · published for one of the user's microsites · own entries only",
  middleware: [requireAuth],
  params: FormIdParam,
  response: LearnerForm,
  handler: ctl.learnerForm,
})
route(formsRouter, {
  method: 'post',
  path: '/forms/:formId/entries',
  summary: 'Submit an entry (409 when one entry is allowed and exists)',
  tags: learnerTags,
  auth: "signed-in · published for one of the user's microsites · Sanitise: text answers",
  middleware: [requireAuth],
  params: FormIdParam,
  body: EntryInput,
  response: Created,
  status: 201,
  handler: ctl.submit,
})
