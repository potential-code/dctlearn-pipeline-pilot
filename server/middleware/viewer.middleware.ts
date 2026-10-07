import { auth, isPrivileged, PRIVILEGED_HOURS, REMEMBER_DAYS } from '@server/auth/auth'
import { db } from '@server/db/connection'
import { sessions } from '@server/db/schema/identity'
import { clientIp } from '@server/lib/client-ip'
import type { Role } from '@shared/roles'
import { fromNodeHeaders } from 'better-auth/node'
import { eq } from 'drizzle-orm'
import type { RequestHandler } from 'express'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Resolves the session once per request. Better Auth reads session + user from the database
 * (cookie cache off), so role, status and memberships changes apply on the next request.
 * Also enforces the session policy of contract §9.6 that Better Auth cannot express alone:
 * admin/sub-admin sessions end 12 h after sign-in; disabled accounts lose every session.
 */
export const attachViewer: RequestHandler = async (req, res, next) => {
  res.locals.viewer = null
  try {
    const result = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
      returnHeaders: true,
    })
    const cookies = result.headers?.getSetCookie?.() ?? []
    if (cookies.length) res.append('Set-Cookie', cookies)
    const data = result.response
    if (!data) return next()
    const { user, session } = data as unknown as {
      user: {
        id: string
        name: string
        email: string
        role: string
        status: string
        emailVerified: boolean
        locale: string
        image?: string | null
      }
      session: {
        id: string
        createdAt: Date
        updatedAt: Date
        expiresAt: Date
        rememberMe?: boolean
      }
    }

    if (user.status === 'disabled') {
      await db.delete(sessions).where(eq(sessions.userId, user.id))
      res.locals.viewerDisabled = true
      return next()
    }
    const created = new Date(session.createdAt).getTime()
    if (isPrivileged(user.role) && Date.now() - created > PRIVILEGED_HOURS * 3600 * 1000) {
      await db.delete(sessions).where(eq(sessions.id, session.id))
      return next()
    }
    if (session.rememberMe && !isPrivileged(user.role)) {
      const expires = new Date(session.expiresAt).getTime()
      if (expires - Date.now() < (REMEMBER_DAYS - 1) * DAY_MS) {
        await db
          .update(sessions)
          .set({ expiresAt: new Date(Date.now() + REMEMBER_DAYS * DAY_MS) })
          .where(eq(sessions.id, session.id))
      }
    }

    res.locals.viewer = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      status: user.status as Viewer['status'],
      emailVerified: user.emailVerified,
      locale: user.locale === 'ar' ? 'ar' : 'en',
      image: user.image ?? null,
      sessionId: session.id,
      ip: clientIp(req),
    }
    next()
  } catch (error) {
    next(error)
  }
}
