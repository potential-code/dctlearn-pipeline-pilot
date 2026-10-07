import * as ctl from '@server/controllers/admin-users.controller'
import { route } from '@server/lib/route'
import { requireRole } from '@server/middleware/auth.middleware'
import { userWriteLimiter } from '@server/middleware/rate-limit.middleware'
import { uploadSingle } from '@server/middleware/upload.middleware'
import {
  AdminUserDetail,
  AdminUsersPage,
  AdminUserUpdate,
  AuditPage,
  AuditQuery,
  ImportConfirm,
  ImportPreview,
  ImportResult,
  UsersQuery,
} from '@shared/schemas/admin-users'
import { idParam } from '@shared/schemas/common'
import { Router } from 'express'

export const adminUsersRouter = Router()
const tags = ['Admin · Users']
const admin = requireRole('admin')

route(adminUsersRouter, {
  method: 'get',
  path: '/admin/users',
  summary: 'P47 Users',
  tags,
  auth: 'role(admin)',
  middleware: admin,
  query: UsersQuery,
  response: AdminUsersPage,
  handler: ctl.list,
})
route(adminUsersRouter, {
  method: 'get',
  path: '/admin/users/import/sample.csv',
  summary: 'P47 Import sample CSV',
  tags,
  auth: 'role(admin)',
  middleware: admin,
  raw: true,
  produces: 'text/csv',
  handler: ctl.sample,
})
route(adminUsersRouter, {
  method: 'post',
  path: '/admin/users/import',
  summary: 'P47 Import CSV → preview + token',
  tags,
  auth: 'role(admin) · CSV ≤ 2 MB / 5,000 rows · rate 30/min/user',
  middleware: [...admin, userWriteLimiter, uploadSingle('file', 2 * 1024 * 1024)],
  response: ImportPreview,
  handler: ctl.importPreview,
})
route(adminUsersRouter, {
  method: 'post',
  path: '/admin/users/import/confirm',
  summary: 'P47 Confirm import',
  tags,
  auth: 'role(admin) · Audit: yes',
  middleware: [...admin, userWriteLimiter],
  body: ImportConfirm,
  response: ImportResult,
  status: 201,
  handler: ctl.importConfirm,
})
route(adminUsersRouter, {
  method: 'get',
  path: '/admin/users/:id',
  summary: 'P47 User detail (full profile)',
  tags,
  auth: 'role(admin)',
  middleware: admin,
  params: idParam,
  response: AdminUserDetail,
  handler: ctl.detail,
})
route(adminUsersRouter, {
  method: 'put',
  path: '/admin/users/:id',
  summary: 'P47 Update role, status, memberships, profile (ifMatch = updatedAt)',
  tags,
  auth: 'role(admin) · Audit: yes · cannot remove own admin role · disabling ends sessions',
  middleware: admin,
  params: idParam,
  body: AdminUserUpdate,
  response: AdminUserDetail,
  handler: ctl.update,
})
route(adminUsersRouter, {
  method: 'post',
  path: '/admin/users/:id/reset-password',
  summary: 'P47 Send set-password e-mail',
  tags,
  auth: 'role(admin) · Audit: yes',
  middleware: [...admin, userWriteLimiter],
  params: idParam,
  handler: ctl.resetPassword,
})
route(adminUsersRouter, {
  method: 'get',
  path: '/admin/audit',
  summary: 'Audit log (read-only)',
  tags: ['Admin · Audit'],
  auth: 'role(admin) · entries cannot be edited or deleted',
  middleware: admin,
  query: AuditQuery,
  response: AuditPage,
  handler: ctl.audit,
})
