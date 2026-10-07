import { db } from '@server/db/connection'
import { seedCourses } from './slices/catalog.seed'
import { seedIdentity } from './slices/identity.seed'
import { seedMicrosites } from './slices/microsites.seed'

/**
 * Composable SEED slices for tests: identity + catalogue + microsites (+ memberships and
 * enrolments). Areas add their own slices on top (learning content, mentoring, …).
 */
export async function seedBase() {
  return db.transaction(async (tx) => {
    const users = await seedIdentity(tx)
    const courses = await seedCourses(tx)
    const microsites = await seedMicrosites(tx, users, courses)
    return { users, courses, microsites }
  })
}

export type BaseSeed = Awaited<ReturnType<typeof seedBase>>
