import { deletedAt, i18n, id, timestamps, tstz } from '@server/db/columns'
import { courses } from '@server/db/schema/catalog'
import { files } from '@server/db/schema/files'
import { users } from '@server/db/schema/identity'
import { microsites } from '@server/db/schema/microsites'
import { index, integer, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

/** P51 / P58: badges, badge awards and external (uploaded) certificates. */

export const badges = pgTable('badges', {
  key: text('key').primaryKey(),
  name: i18n('name').notNull(),
  description: i18n('description').notNull(),
  imageUrl: text('image_url').default('').notNull(),
  /** courses_completed · points_total · streak_days · manual */
  rule: text('rule').notNull(),
  threshold: integer('threshold'),
  deletedAt: deletedAt(),
  ...timestamps(),
})

export const badgeAwards = pgTable(
  'badge_awards',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    badgeKey: text('badge_key')
      .notNull()
      .references(() => badges.key),
    awardedAt: tstz('awarded_at').defaultNow().notNull(),
    awardedById: uuid('awarded_by_id').references(() => users.id),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('badge_awards_user_badge_uq').on(t.userId, t.badgeKey),
    index('badge_awards_badge_idx').on(t.badgeKey),
  ],
)

/**
 * External certificates (Nibras): one row per learner and course. A new upload after a
 * rejection moves it back to `pending` (§9.1); approval completes the course.
 */
export const externalCertificates = pgTable(
  'external_certificates',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id),
    micrositeId: uuid('microsite_id')
      .notNull()
      .references(() => microsites.id),
    fileId: uuid('file_id')
      .notNull()
      .references(() => files.id),
    /** pending · approved · rejected */
    status: text('status').default('pending').notNull(),
    note: text('note'),
    uploadedAt: tstz('uploaded_at').defaultNow().notNull(),
    decidedAt: tstz('decided_at'),
    decidedById: uuid('decided_by_id').references(() => users.id),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('external_certificates_user_course_uq').on(t.userId, t.courseId),
    index('external_certificates_status_idx').on(t.status),
    index('external_certificates_course_idx').on(t.courseId),
    index('external_certificates_microsite_idx').on(t.micrositeId),
    index('external_certificates_file_idx').on(t.fileId),
  ],
)

export type Badge = typeof badges.$inferSelect
export type ExternalCertificate = typeof externalCertificates.$inferSelect
