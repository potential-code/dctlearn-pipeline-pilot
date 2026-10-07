import { buildApp } from '@server/app'
import '@server/registrations/mentoring'
import '@server/jobs/mentoring.job'
import { db } from '@server/db/connection'
import { mentorMatches } from '@server/db/schema/mentoring'
import { seedMentoring } from '@server/db/seed/slices/mentoring.seed'
import { adminMentorsRouter } from '@server/routes/admin-mentors.routes'
import { mentorRouter } from '@server/routes/mentor.routes'
import { mentoringRouter } from '@server/routes/mentoring.routes'
import { webhooksRouter } from '@server/routes/webhooks.routes'
import { joinMicrosite } from '@server/services/microsites/membership.service'
import { sql } from 'drizzle-orm'
import { freshBase } from '../helpers/fixtures'

export const app = buildApp([mentoringRouter, mentorRouter, adminMentorsRouter, webhooksRouter])

/**
 * The preload's `drizzle-kit push` currently stops at `courses_title_search_idx` (catalog.ts:
 * `->>` / `||` precedence), so later indexes — ours included — are never created. Until that
 * shared fix lands, create the mentoring indexes the schema declares (idempotent).
 */
const MENTORING_INDEXES = [
  `create unique index if not exists mentor_profiles_user_uq on mentor_profiles (user_id)`,
  `create unique index if not exists mentor_bookings_slot_uq on mentor_bookings (mentor_id, starts_at) where status <> 'cancelled'`,
  `create unique index if not exists grow_logs_booking_uq on grow_logs (booking_id)`,
  `create unique index if not exists booking_feedback_side_uq on booking_feedback (booking_id, side)`,
  `create unique index if not exists mentor_matches_active_uq on mentor_matches (mentee_id, microsite_id) where status = 'active'`,
  `create unique index if not exists mentee_applications_pending_uq on mentee_applications (mentee_id, microsite_id) where status = 'pending'`,
]
let indexed = false
async function ensureIndexes() {
  if (indexed) return
  for (const stmt of MENTORING_INDEXES) await db.execute(sql.raw(stmt))
  indexed = true
}

/** SEED base + the mentoring slice (§4.2, §5). */
export async function freshMentoring() {
  await ensureIndexes()
  const base = await freshBase()
  const m = await db.transaction((tx) => seedMentoring(tx, base))
  return { base, m }
}

export type MentoringSeed = Awaited<ReturnType<typeof freshMentoring>>

/** Adds a learner to elevate (and optionally matches them with a mentor directly). */
export async function joinElevate(seed: MentoringSeed, userKey: string, mentorKey?: string) {
  const user = seed.base.users[userKey]!
  const elevate = seed.base.microsites.elevate!
  await joinMicrosite(db, user.id, elevate.id, 'admin')
  if (mentorKey)
    await db.insert(mentorMatches).values({
      menteeId: user.id,
      mentorId: seed.m.mentors[mentorKey]!,
      micrositeId: elevate.id,
    })
  return user
}
