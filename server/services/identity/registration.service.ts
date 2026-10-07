import { auth } from '@server/auth/auth'
import { internalHeaders } from '@server/auth/internal'
import { employeeDomains } from '@server/config/env'
import { db } from '@server/db/connection'
import { invitations, userProfiles, users, verifications } from '@server/db/schema/identity'
import { now } from '@server/lib/clock'
import { validationFailed } from '@server/lib/errors'
import {
  emailMatchesDomainRule,
  findMicrositeBySlug,
} from '@server/services/microsites/lookup.service'
import { hashToken } from '@server/utils/tokens'
import type { EmployeeRegistration } from '@shared/schemas/identity'
import { eq } from 'drizzle-orm'
import type { z } from 'zod'

export const EMPLOYEES_SLUG = 'employees'

/**
 * P08: self-registration for DCT employees. Domain checked server-side; role forced to learner,
 * membership forced to `employees`. Answers the same for a new and an existing e-mail.
 */
export async function registerEmployee(input: z.infer<typeof EmployeeRegistration>) {
  const microsite = await findMicrositeBySlug(EMPLOYEES_SLUG)
  const allowed =
    employeeDomains.some((d) => input.email.endsWith(`@${d}`)) ||
    Boolean(
      microsite?.emailDomainRule && emailMatchesDomainRule(input.email, microsite.emailDomainRule),
    )
  if (!allowed || !microsite) throw validationFailed({ email: 'Use your DCT e-mail address' })

  const result = await auth.api.signUpEmail({
    headers: internalHeaders(),
    body: {
      name: input.fullName,
      email: input.email,
      password: input.password,
      microsite: EMPLOYEES_SLUG,
    } as never,
  })
  const userId = (result as { user: { id: string } }).user.id
  const [created] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId))
  if (created) {
    await db
      .insert(userProfiles)
      .values({ userId, level: input.level, timeAtDct: input.timeAtDct })
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: { level: input.level, timeAtDct: input.timeAtDct },
      })
  }
  return { userId, verificationSent: true as const }
}

/** P09/P10: what a password link is for, without revealing anything beyond its own e-mail. */
export async function inspectPasswordToken(token: string) {
  const [inv] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.tokenHash, hashToken(token)))
  if (inv) {
    const valid = inv.status === 'sent' && inv.expiresAt > now()
    return { valid, purpose: 'invite' as const, ...(valid ? { email: inv.email } : {}) }
  }
  const [reset] = await db
    .select()
    .from(verifications)
    .where(eq(verifications.identifier, `reset-password:${token}`))
  if (reset && reset.expiresAt > new Date()) {
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, reset.value))
    return { valid: true, purpose: 'reset' as const, ...(user ? { email: user.email } : {}) }
  }
  return { valid: false, purpose: 'reset' as const }
}
