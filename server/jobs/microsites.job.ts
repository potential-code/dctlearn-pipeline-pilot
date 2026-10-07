import { db } from '@server/db/connection'
import { memberships } from '@server/db/schema/microsites'
import { enrolInCourses } from '@server/services/catalog/enrolment.service'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { defineJob } from './runtime'

/** A course added to a microsite enrols its existing members (idempotent). */
defineJob(
  'microsites.enrol_members',
  async ({ micrositeId, courseIds }) => {
    const members = await db
      .select({ userId: memberships.userId })
      .from(memberships)
      .where(eq(memberships.micrositeId, micrositeId))
    for (const m of members) await enrolInCourses(db, m.userId, courseIds)
  },
  { maxAttempts: 3, schema: z.object({ micrositeId: z.uuid(), courseIds: z.array(z.uuid()) }) },
)
