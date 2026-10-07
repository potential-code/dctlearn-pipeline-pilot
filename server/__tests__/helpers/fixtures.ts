import { db } from '@server/db/connection'
import { sessions, users } from '@server/db/schema/identity'
import { type BaseSeed, seedBase } from '@server/db/seed/fixtures'
import { eq } from 'drizzle-orm'
import { resetDb } from './db'

/** Fresh database with the SEED base (people, courses, microsites, memberships). */
export async function freshBase(): Promise<BaseSeed> {
  await resetDb()
  return seedBase()
}

export async function userByEmail(email: string) {
  const [u] = await db.select().from(users).where(eq(users.email, email))
  return u!
}

export async function sessionsOf(userId: string) {
  return db.select().from(sessions).where(eq(sessions.userId, userId))
}
