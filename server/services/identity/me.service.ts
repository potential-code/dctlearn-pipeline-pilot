import { auth } from '@server/auth/auth'
import { type DbOrTx, db } from '@server/db/connection'
import { enrolments, micrositeCourses } from '@server/db/schema/catalog'
import { userProfiles, users } from '@server/db/schema/identity'
import { memberships, microsites } from '@server/db/schema/microsites'
import { notFound, validationFailed } from '@server/lib/errors'
import { fileUrl, storeUpload } from '@server/services/files.service'
import { findMicrositeBySlug, toMicrositeRef } from '@server/services/microsites/lookup.service'
import type { ProfileUpdate } from '@shared/schemas/identity'
import { and, avg, eq, inArray } from 'drizzle-orm'
import type { z } from 'zod'
import { defaultRoute } from './landing.service'
import { toUserDto } from './user-dto'

export async function getUserRow(userId: string, tx: DbOrTx = db) {
  const [row] = await tx.select().from(users).where(eq(users.id, userId))
  if (!row) throw notFound()
  return row
}

/** Live microsites the user belongs to, plus those they administer. */
async function myMicrosites(userId: string) {
  const member = await db
    .select({ m: microsites, lastVisitedAt: memberships.lastVisitedAt })
    .from(memberships)
    .innerJoin(microsites, eq(memberships.micrositeId, microsites.id))
    .where(and(eq(memberships.userId, userId), eq(microsites.status, 'live')))
    .orderBy(microsites.sortOrder, microsites.slug)
  const administered = await db
    .select()
    .from(microsites)
    .where(and(eq(microsites.subAdminId, userId), inArray(microsites.status, ['draft', 'live'])))
    .orderBy(microsites.sortOrder, microsites.slug)
  return { member, administered }
}

/** P06 `GET /api/me?from={p}` */
export async function getMe(viewer: Viewer, from?: string) {
  const user = await getUserRow(viewer.id)
  const { member, administered } = await myMicrosites(viewer.id)
  const fromMicrosite = from ? await findMicrositeBySlug(from) : null
  const usableFrom =
    fromMicrosite && fromMicrosite.status === 'live' && !fromMicrosite.landingOnly
      ? fromMicrosite
      : null

  const memberSlugs = user.role === 'learner' ? member.map((r) => r.m.slug) : []
  const subAdminSlugs = administered.map((m) => m.slug)
  const landing = defaultRoute({ role: user.role, memberSlugs, subAdminSlugs, from: usableFrom })

  const list = [
    ...(user.role === 'learner'
      ? await Promise.all(
          member.map(async (r) => ({
            ...(await toMicrositeRef(r.m, viewer.id)),
            role: 'learner' as const,
          })),
        )
      : []),
    ...(user.role === 'sub_admin'
      ? await Promise.all(
          administered.map(async (m) => ({
            ...(await toMicrositeRef(m, viewer.id)),
            role: 'sub_admin' as const,
          })),
        )
      : []),
  ]

  return {
    user: await toUserDto(user, viewer.id),
    microsites: list,
    mustSetPassword: user.mustSetPassword,
    defaultRoute: landing.route,
    ...(landing.denied && usableFrom
      ? {
          accessDenied: {
            microsite: await toMicrositeRef(usableFrom, viewer.id),
            canJoin: usableFrom.signInMode !== 'landing_only',
          },
        }
      : {}),
  }
}

/** P13 hub picker: own memberships only. */
export async function getMyMicrosites(viewer: Viewer) {
  const { member } = await myMicrosites(viewer.id)
  const items = []
  for (const { m, lastVisitedAt } of member) {
    const courseIds = (
      await db
        .select({ id: micrositeCourses.courseId })
        .from(micrositeCourses)
        .where(eq(micrositeCourses.micrositeId, m.id))
    ).map((r) => r.id)
    let progressPct = 0
    if (courseIds.length) {
      const [row] = await db
        .select({ value: avg(enrolments.progressPct) })
        .from(enrolments)
        .where(and(eq(enrolments.userId, viewer.id), inArray(enrolments.courseId, courseIds)))
      progressPct = Math.round(Number(row?.value ?? 0))
    }
    items.push({
      ...(await toMicrositeRef(m, viewer.id)),
      subtitle: m.subtitle,
      features: m.tabs.filter((t) => t.enabled).map((t) => t.key),
      progressPct,
      ...(lastVisitedAt ? { lastVisitedAt: lastVisitedAt.toISOString() } : {}),
    })
  }
  return { items }
}

export async function markTourSeen(viewer: Viewer) {
  await db.update(users).set({ tourSeen: true }).where(eq(users.id, viewer.id))
}

/* ------------------------------------------------------------------ P15 profile */

async function getProfileRow(userId: string) {
  const [row] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId))
  return row ?? null
}

export async function getProfile(viewer: Viewer) {
  const user = await getUserRow(viewer.id)
  const p = await getProfileRow(viewer.id)
  const { member } = await myMicrosites(viewer.id)
  return {
    user: await toUserDto(user, viewer.id),
    profile: {
      firstName: p?.firstName ?? '',
      lastName: p?.lastName ?? '',
      country: p?.country ?? '',
      position: p?.position ?? '',
      department: p?.department ?? '',
      employmentType: p?.employmentType ?? '',
      seniorityLevel: p?.seniorityLevel ?? '',
      preferredLanguage: user.locale === 'ar' ? ('ar' as const) : ('en' as const),
      linkedinUrl: p?.linkedinUrl ?? '',
      mobile: p?.mobile ?? '',
    },
    readOnly: {
      ...(p?.employeeId ? { employeeId: p.employeeId } : {}),
      ...(p?.sector ? { sector: p.sector } : {}),
      ...(p?.hireDate ? { hireDate: p.hireDate } : {}),
    },
    microsites: await Promise.all(member.map((r) => toMicrositeRef(r.m, viewer.id))),
  }
}

/** Only the editable fields; employee id, sector, hire date, role, status are never written here. */
export async function updateProfile(viewer: Viewer, input: z.infer<typeof ProfileUpdate>) {
  const { preferredLanguage, ...fields } = input
  await db.transaction(async (tx) => {
    const insert = tx.insert(userProfiles).values({ userId: viewer.id, ...fields })
    // An empty update (only preferredLanguage, or nothing) must not issue `SET` with no columns.
    if (Object.keys(fields).length)
      await insert.onConflictDoUpdate({ target: userProfiles.userId, set: fields })
    else await insert.onConflictDoNothing()
    const [p] = await tx.select().from(userProfiles).where(eq(userProfiles.userId, viewer.id))
    const name = `${p?.firstName ?? ''} ${p?.lastName ?? ''}`.trim()
    const patch: Partial<typeof users.$inferInsert> = {}
    if (name && (input.firstName !== undefined || input.lastName !== undefined))
      patch.name = name.slice(0, 80)
    if (preferredLanguage) patch.locale = preferredLanguage
    if (Object.keys(patch).length) await tx.update(users).set(patch).where(eq(users.id, viewer.id))
  })
  return getProfile(viewer)
}

export async function setLocale(viewer: Viewer, locale: 'en' | 'ar') {
  await db.update(users).set({ locale }).where(eq(users.id, viewer.id))
}

export async function setPhoto(
  viewer: Viewer,
  file: { buffer: Buffer; mimetype: string; originalname: string },
) {
  const stored = await storeUpload({
    bytes: new Uint8Array(file.buffer),
    declaredMime: file.mimetype,
    originalName: file.originalname,
    category: 'image',
    ownerId: viewer.id,
  })
  await db.update(users).set({ image: stored.id }).where(eq(users.id, viewer.id))
  return { imageUrl: fileUrl(stored, viewer.id) }
}

/** Needs the current password; ends every other session (contract §9.6). */
export async function changePassword(
  headers: Headers,
  currentPassword: string,
  newPassword: string,
) {
  try {
    const result = await auth.api.changePassword({
      headers,
      body: { currentPassword, newPassword, revokeOtherSessions: true },
      returnHeaders: true,
    })
    // A new session replaces the current one: its cookie goes back to the caller.
    return result.headers.getSetCookie()
  } catch (error) {
    const code = (error as { body?: { code?: string } })?.body?.code
    if (code === 'INVALID_PASSWORD')
      throw validationFailed({ currentPassword: 'Current password is incorrect' })
    if (code?.startsWith('PASSWORD_'))
      throw validationFailed({ newPassword: 'Choose a different password (10–128 characters)' })
    throw error
  }
}

export async function revokeAllSessions(headers: Headers) {
  await auth.api.revokeSessions({ headers })
}
