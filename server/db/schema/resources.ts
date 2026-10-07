import { deletedAt, i18n, id, timestamps, tstz } from '@server/db/columns'
import { files } from '@server/db/schema/files'
import { users } from '@server/db/schema/identity'
import { microsites } from '@server/db/schema/microsites'
import { index, pgTable, text, uuid } from 'drizzle-orm/pg-core'

/**
 * Microsite resources (P53 sub admin, P54 admin review, P52 / P14 learners): an https link or an
 * uploaded PDF. Status §9.1: pending → approved / rejected (admin); any edit → pending.
 */
export const resources = pgTable(
  'resources',
  {
    id: id(),
    micrositeId: uuid('microsite_id')
      .notNull()
      .references(() => microsites.id),
    title: i18n('title').notNull(),
    /** link · pdf */
    type: text('type').notNull(),
    /** https URL for links; null for PDFs (see fileId). */
    url: text('url'),
    fileId: uuid('file_id').references(() => files.id),
    imageUrl: text('image_url'),
    /** pending · approved · rejected */
    status: text('status').default('pending').notNull(),
    reviewNote: text('review_note'),
    submittedById: uuid('submitted_by_id')
      .notNull()
      .references(() => users.id),
    submittedAt: tstz('submitted_at').defaultNow().notNull(),
    reviewedById: uuid('reviewed_by_id').references(() => users.id),
    reviewedAt: tstz('reviewed_at'),
    deletedAt: deletedAt(),
    ...timestamps(),
  },
  (t) => [
    index('resources_microsite_status_idx').on(t.micrositeId, t.status),
    index('resources_status_idx').on(t.status),
    index('resources_file_idx').on(t.fileId),
    index('resources_submitted_by_idx').on(t.submittedById),
    index('resources_reviewed_by_idx').on(t.reviewedById),
  ],
)

export type ResourceRow = typeof resources.$inferSelect
