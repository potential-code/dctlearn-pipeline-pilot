import { MB } from '@server/config/upload-policies'
import * as ctl from '@server/controllers/resources.controller'
import { route } from '@server/lib/route'
import { requireRole } from '@server/middleware/auth.middleware'
import { requireSubAdmin } from '@server/middleware/microsite.middleware'
import { userWriteLimiter } from '@server/middleware/rate-limit.middleware'
import { uploadSingle } from '@server/middleware/upload.middleware'
import { idParam, micrositeParam, slug, uuid } from '@shared/schemas/common'
import {
  AdminResourcesPage,
  AdminResourcesQuery,
  RejectResourceInput,
  ResourceInput,
  ReviewResponse,
  SubResource,
  SubResourcesPage,
  SubResourcesQuery,
} from '@shared/schemas/resources'
import { Router } from 'express'
import { z } from 'zod'

/** P53 sub-admin resources and P54 admin verification. Learners: P52 tab, P14 section. */
export const resourcesRouter = Router()

const subTags = ['Sub admin']
const resourceParams = z.object({ p: slug, id: uuid })
const pdfUpload = uploadSingle('file', 10 * MB)

route(resourcesRouter, {
  method: 'get',
  path: '/microsites/:p/admin/resources',
  summary: 'P53 Resources of the microsite',
  tags: subTags,
  auth: 'sub_admin(p) or admin',
  middleware: requireSubAdmin,
  params: micrositeParam,
  query: SubResourcesQuery,
  response: SubResourcesPage,
  handler: ctl.subList,
})
route(resourcesRouter, {
  method: 'post',
  path: '/microsites/:p/admin/resources',
  summary: 'P53 Add resource (https link, or multipart PDF in `file`) → pending',
  tags: subTags,
  auth: 'sub_admin(p) or admin · https only · uploads 30/min/user · Audit: yes',
  middleware: [...requireSubAdmin, userWriteLimiter, pdfUpload],
  params: micrositeParam,
  body: ResourceInput,
  response: SubResource,
  status: 201,
  handler: ctl.subCreate,
})
route(resourcesRouter, {
  method: 'put',
  path: '/microsites/:p/admin/resources/:id',
  summary: 'P53 Edit resource → resets to pending (§9.1)',
  tags: subTags,
  auth: 'sub_admin(p) or admin · https only · Audit: yes',
  middleware: [...requireSubAdmin, userWriteLimiter, pdfUpload],
  params: resourceParams,
  body: ResourceInput,
  response: SubResource,
  handler: ctl.subUpdate,
})
route(resourcesRouter, {
  method: 'delete',
  path: '/microsites/:p/admin/resources/:id',
  summary: 'P53 Delete resource (soft delete)',
  tags: subTags,
  auth: 'sub_admin(p) or admin · Audit: yes',
  middleware: requireSubAdmin,
  params: resourceParams,
  handler: ctl.subDelete,
})

const adminTags = ['Admin · Resources']
const admin = requireRole('admin')

route(resourcesRouter, {
  method: 'get',
  path: '/admin/resources',
  summary: 'P54 Resources to verify (default status=pending)',
  tags: adminTags,
  auth: 'role(admin)',
  middleware: admin,
  query: AdminResourcesQuery,
  response: AdminResourcesPage,
  handler: ctl.adminList,
})
route(resourcesRouter, {
  method: 'post',
  path: '/admin/resources/:id/approve',
  summary: 'P54 Approve (§9.1 pending → approved)',
  tags: adminTags,
  auth: 'role(admin) · Audit: yes',
  middleware: admin,
  params: idParam,
  response: ReviewResponse,
  handler: ctl.approve,
})
route(resourcesRouter, {
  method: 'post',
  path: '/admin/resources/:id/reject',
  summary: 'P54 Reject with a note (§9.1 pending → rejected)',
  tags: adminTags,
  auth: 'role(admin) · Audit: yes',
  middleware: admin,
  params: idParam,
  body: RejectResourceInput,
  response: ReviewResponse,
  handler: ctl.reject,
})
