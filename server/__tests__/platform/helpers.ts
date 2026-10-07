import { buildApp } from '@server/app'
import { db } from '@server/db/connection'
import { courseCertificates, enrolments } from '@server/db/schema/catalog'
import { users } from '@server/db/schema/identity'
import { memberships } from '@server/db/schema/microsites'
import type { BaseSeed } from '@server/db/seed/fixtures'
import { analyticsRouter } from '@server/routes/analytics.routes'
import { dataRightsRouter } from '@server/routes/data-rights.routes'
import { platformRouter } from '@server/routes/platform.routes'
import { translationsRouter } from '@server/routes/translations.routes'
import { and, eq } from 'drizzle-orm'
import '@server/registrations/platform'
import '@server/jobs/platform.job'

export const app = buildApp([analyticsRouter, translationsRouter, platformRouter, dataRightsRouter])

/** Everyone not allowed on admin-only endpoints (contract §0.3). */
export const NOT_ADMIN = {
  signedOut: null,
  learner: 'saeed.h@dctlearn.example',
  subAdmin: 'omar.m@dctlearn.example',
  mentor: 'hessa.n@example.com',
  judge: 'noura.k@example.com',
}

const OLD = new Date('2026-01-10T08:00:00Z')

/**
 * Deterministic dates and SEED §4.4 progress for analytics (today = 2026-10-06 09:00 UTC):
 * - everyone created / joined 2026-01-10, except Saeed and Mona (2026-09-20, in the last 30 days)
 *   and Yousef (2026-08-20, in the 30 days before that);
 * - 9 completions with certificates, 8 of them in the last 30 days (Reem's C09 is 2026-08-01);
 * - Mona has C01 in progress (activity 2026-10-02).
 */
export async function seedAnalytics(base: BaseSeed) {
  const u = base.users
  const c = base.courses
  await db.update(users).set({ createdAt: OLD, lastLoginAt: null })
  await db.update(memberships).set({ createdAt: OLD })
  const recent = new Date('2026-09-20T10:00:00Z')
  for (const key of ['saeed', 'mona'])
    await db.update(users).set({ createdAt: recent }).where(eq(users.id, u[key]!.id))
  await db
    .update(memberships)
    .set({ createdAt: recent })
    .where(
      and(
        eq(memberships.micrositeId, base.microsites.employees!.id),
        eq(memberships.userId, u.saeed!.id),
      ),
    )
  await db.update(memberships).set({ createdAt: recent }).where(eq(memberships.userId, u.mona!.id))
  await db
    .update(users)
    .set({ createdAt: new Date('2026-08-20T10:00:00Z') })
    .where(eq(users.id, u.yousef!.id))

  const done: [string, string, string][] = [
    ['saeed', 'C01', '2026-09-25T10:00:00Z'],
    ['saeed', 'C03', '2026-09-26T10:00:00Z'],
    ['yousef', 'C09', '2026-09-10T10:00:00Z'],
    ['yousef', 'C10', '2026-09-15T10:00:00Z'],
    ['reem', 'C09', '2026-08-01T10:00:00Z'],
    ['reem', 'C01', '2026-09-30T10:00:00Z'],
    ['ahmed', 'C13', '2026-09-29T10:00:00Z'],
    ['elise', 'C14', '2026-09-28T10:00:00Z'],
    ['hamad', 'C01', '2026-10-01T10:00:00Z'],
  ]
  let n = 1
  for (const [who, course, at] of done) {
    const when = new Date(at)
    const [e] = await db
      .update(enrolments)
      .set({
        state: 'completed',
        progressPct: 100,
        startedAt: when,
        completedAt: when,
        lastActivityAt: when,
      })
      .where(and(eq(enrolments.userId, u[who]!.id), eq(enrolments.courseId, c[course]!.id)))
      .returning()
    await db.insert(courseCertificates).values({
      enrolmentId: e!.id,
      userId: e!.userId,
      courseId: e!.courseId,
      serial: `DCT-2026-${String(n++).padStart(4, '0')}`,
      learnerName: u[who]!.name,
      issuedAt: when,
    })
  }
  const activity = new Date('2026-10-02T10:00:00Z')
  await db
    .update(enrolments)
    .set({ state: 'in_progress', progressPct: 25, startedAt: activity, lastActivityAt: activity })
    .where(and(eq(enrolments.userId, u.mona!.id), eq(enrolments.courseId, c.C01!.id)))
}
