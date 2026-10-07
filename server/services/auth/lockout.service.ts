// Forked from potential-template packages/core/src/auth/lockout.ts (Better Auth edition).
import { env } from '@server/config/env'
import { db } from '@server/db/connection'
import { loginAttempts } from '@server/db/schema/identity'
import { and, count, desc, eq, gte } from 'drizzle-orm'

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export type AttemptContext = { ipAddress?: string | null; userAgent?: string | null }

export async function recordLoginAttempt(
  email: string,
  successful: boolean,
  context: AttemptContext = {},
) {
  await db.insert(loginAttempts).values({
    email: normalizeEmail(email),
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent?.slice(0, 500) ?? null,
    successful,
  })
}

/** Failures inside the window, ignoring anything before the most recent success. */
export async function countRecentFailures(email: string): Promise<number> {
  const key = normalizeEmail(email)
  const windowStart = new Date(Date.now() - env.AUTH_LOCKOUT_WINDOW_MINUTES * 60_000)
  const [lastSuccess] = await db
    .select({ at: loginAttempts.attemptedAt })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.email, key),
        eq(loginAttempts.successful, true),
        gte(loginAttempts.attemptedAt, windowStart),
      ),
    )
    .orderBy(desc(loginAttempts.attemptedAt))
    .limit(1)
  const since = lastSuccess && lastSuccess.at > windowStart ? lastSuccess.at : windowStart
  const [row] = await db
    .select({ value: count() })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.email, key),
        eq(loginAttempts.successful, false),
        gte(loginAttempts.attemptedAt, since),
      ),
    )
  return row?.value ?? 0
}

export async function isLockedOut(email: string): Promise<boolean> {
  return (await countRecentFailures(email)) >= env.AUTH_LOCKOUT_MAX_ATTEMPTS
}
