import * as me from '@server/controllers/me.controller'
import { validationFailed } from '@server/lib/errors'
import { route } from '@server/lib/route'
import { requireAuth } from '@server/middleware/auth.middleware'
import { userWriteLimiter } from '@server/middleware/rate-limit.middleware'
import { uploadSingle } from '@server/middleware/upload.middleware'
import {
  LocaleUpdate,
  MeQuery,
  MeResponse,
  MyMicrositesResponse,
  PasswordChange,
  PhotoResponse,
  ProfileResponse,
  ProfileUpdate,
} from '@shared/schemas/identity'
import { Router } from 'express'

export const meRouter = Router()
const tags = ['Me']

route(meRouter, {
  method: 'get',
  path: '/me',
  summary: 'P06 Signed-in user, microsites and landing route (`from` = microsite login used)',
  tags,
  auth: 'signed-in · own',
  middleware: [requireAuth],
  query: MeQuery,
  response: MeResponse,
  handler: me.getMe,
})

route(meRouter, {
  method: 'get',
  path: '/me/microsites',
  summary: 'P13 Hub picker',
  tags,
  auth: 'signed-in · own memberships only',
  middleware: [requireAuth],
  response: MyMicrositesResponse,
  handler: me.getMyMicrosites,
})

route(meRouter, {
  method: 'post',
  path: '/me/tour-seen',
  summary: 'P14 Mark the dashboard tour as seen',
  tags,
  auth: 'signed-in · own',
  middleware: [requireAuth],
  handler: me.tourSeen,
})

route(meRouter, {
  method: 'get',
  path: '/me/profile',
  summary: 'P15 Profile',
  tags,
  auth: 'signed-in · own profile only',
  middleware: [requireAuth],
  response: ProfileResponse,
  handler: me.getProfile,
})

route(meRouter, {
  method: 'put',
  path: '/me/profile',
  summary:
    'P15 Update editable profile fields (employeeId, sector, hireDate, role, status ignored)',
  tags,
  auth: 'signed-in · own profile only',
  middleware: [requireAuth],
  body: ProfileUpdate,
  response: ProfileResponse,
  handler: me.updateProfile,
})

route(meRouter, {
  method: 'post',
  path: '/me/photo',
  summary: 'P15 Profile photo (multipart `file`, image ≤ 5 MB)',
  tags,
  auth: 'signed-in · own · type checked by content',
  middleware: [requireAuth, userWriteLimiter, uploadSingle('file', 5 * 1024 * 1024)],
  response: PhotoResponse,
  handler: async (ctx) => {
    if (!ctx.req.file) throw validationFailed({ file: 'Choose an image' })
    return me.setPhoto(ctx)
  },
})

route(meRouter, {
  method: 'post',
  path: '/me/password',
  summary: 'P15 Change password (needs current password; ends other sessions)',
  tags,
  auth: 'signed-in · own',
  middleware: [requireAuth],
  body: PasswordChange,
  handler: me.changePassword,
})

route(meRouter, {
  method: 'put',
  path: '/me/locale',
  summary: 'P15 Language',
  tags,
  auth: 'signed-in · own',
  middleware: [requireAuth],
  body: LocaleUpdate,
  handler: me.setLocale,
})

route(meRouter, {
  method: 'post',
  path: '/me/sessions/revoke-all',
  summary: '§9.6 Log out everywhere',
  tags,
  auth: 'signed-in · own',
  middleware: [requireAuth],
  handler: me.revokeAllSessions,
})
