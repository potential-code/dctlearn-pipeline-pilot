import { notFound } from '@server/lib/errors'
import type { RouteContext } from '@server/lib/route'
import * as me from '@server/services/identity/me.service'
import { fromNodeHeaders } from 'better-auth/node'

type Ctx<P = unknown, Q = unknown, B = unknown> = RouteContext<P, Q, B>

export const getMe = ({ viewer, query }: Ctx<unknown, { from?: string }>) =>
  me.getMe(viewer, query.from)
export const getMyMicrosites = ({ viewer }: Ctx) => me.getMyMicrosites(viewer)
export const tourSeen = async ({ viewer }: Ctx) => {
  await me.markTourSeen(viewer)
}
export const getProfile = ({ viewer }: Ctx) => me.getProfile(viewer)
export const updateProfile = ({
  viewer,
  body,
}: Ctx<unknown, unknown, Parameters<typeof me.updateProfile>[1]>) => me.updateProfile(viewer, body)
export const setLocale = async ({
  viewer,
  body,
}: Ctx<unknown, unknown, { locale: 'en' | 'ar' }>) => {
  await me.setLocale(viewer, body.locale)
}
export const setPhoto = async ({ viewer, req }: Ctx) => {
  if (!req.file) throw notFound('No file')
  return me.setPhoto(viewer, req.file)
}
export const changePassword = async ({
  req,
  res,
  body,
}: Ctx<unknown, unknown, { currentPassword: string; newPassword: string }>) => {
  const cookies = await me.changePassword(
    fromNodeHeaders(req.headers),
    body.currentPassword,
    body.newPassword,
  )
  if (cookies.length) res.append('Set-Cookie', cookies)
}
export const revokeAllSessions = async ({ req }: Ctx) => {
  await me.revokeAllSessions(fromNodeHeaders(req.headers))
}
