import { env } from '@server/config/env'
import { db } from '@server/db/connection'
import { users } from '@server/db/schema/identity'
import { accessRequests, type Microsite, registerInterest } from '@server/db/schema/microsites'
import { queueEmail } from '@server/jobs/email.job'
import { conflict, forbidden, notFound } from '@server/lib/errors'
import { sanitizeText } from '@server/lib/sanitize'
import type { RegisterInterest } from '@shared/schemas/microsites'
import { and, eq, inArray } from 'drizzle-orm'
import type { z } from 'zod'
import { emailMatchesDomainRule, toMicrositeRef } from './lookup.service'
import { getMembership, joinMicrosite } from './membership.service'

/** Who gets microsite notifications: configured recipients, else the sub admin, else every admin. */
export async function micrositeRecipients(m: Microsite): Promise<string[]> {
  if (m.notificationRecipients.length) return m.notificationRecipients
  if (m.subAdminId) {
    const [sub] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, m.subAdminId))
    if (sub) return [sub.email]
  }
  const admins = await db
    .select({ email: users.email })
    .from(users)
    .where(and(eq(users.role, 'admin'), eq(users.status, 'active')))
  return admins.map((a) => a.email)
}

/** P07: 404 for landing-only or non-live microsites. */
export async function loginConfig(m: Microsite) {
  if (m.status !== 'live' || m.landingOnly || m.signInMode === 'landing_only') throw notFound()
  return {
    microsite: await toMicrositeRef(m),
    signInMode: m.signInMode as 'open' | 'invite_only' | 'landing_only',
    allowSignUp: m.signInMode === 'open',
    ...(m.emailDomainRule ? { emailDomainRule: m.emailDomainRule } : {}),
  }
}

/** P12 register interest (landing pages). Public, rate-limited; notifies the microsite. */
export async function submitRegisterInterest(
  m: Microsite,
  input: z.infer<typeof RegisterInterest>,
) {
  if (m.status !== 'live') throw notFound()
  const message = input.message ? sanitizeText(input.message) : null
  await db.transaction(async (tx) => {
    await tx.insert(registerInterest).values({
      micrositeId: m.id,
      name: sanitizeText(input.name),
      email: input.email,
      phone: input.phone ?? null,
      message,
    })
    for (const to of await micrositeRecipients(m)) {
      await queueEmail(
        to,
        'register-interest',
        {
          micrositeName: m.name.en,
          name: input.name,
          email: input.email,
          phone: input.phone,
          message,
        },
        { tx },
      )
    }
  })
}

/**
 * P07 access request from a signed-in non-member. One open request per user and microsite
 * (409). On an `open` microsite whose e-mail rule matches, the user simply joins.
 */
export async function requestAccess(m: Microsite, viewer: Viewer) {
  if (m.status !== 'live' || m.landingOnly) throw notFound()
  if (viewer.role !== 'learner') throw forbidden()
  if (await getMembership(db, viewer.id, m.id)) throw conflict('You are already a member')
  return db.transaction(async (tx) => {
    if (m.signInMode === 'open' && emailMatchesDomainRule(viewer.email, m.emailDomainRule)) {
      await joinMicrosite(tx, viewer.id, m.id, 'rule')
      const [row] = await tx
        .insert(accessRequests)
        .values({ userId: viewer.id, micrositeId: m.id, status: 'approved' })
        .returning()
      return { id: row!.id, status: 'approved' as const }
    }
    const [open] = await tx
      .select({ id: accessRequests.id })
      .from(accessRequests)
      .where(
        and(
          eq(accessRequests.userId, viewer.id),
          eq(accessRequests.micrositeId, m.id),
          inArray(accessRequests.status, ['open']),
        ),
      )
    if (open) throw conflict('You already asked for access')
    const [row] = await tx
      .insert(accessRequests)
      .values({ userId: viewer.id, micrositeId: m.id })
      .returning()
    for (const to of await micrositeRecipients(m)) {
      await queueEmail(
        to,
        'access-request',
        {
          micrositeName: m.name.en,
          userName: viewer.name,
          url: `${env.APP_URL}/${m.slug}/admin/members`,
        },
        { tx },
      )
    }
    return { id: row!.id, status: 'open' as const }
  })
}
