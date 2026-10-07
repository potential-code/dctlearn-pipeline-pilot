import { id, timestamps, tstz } from '@server/db/columns'
import { files } from '@server/db/schema/files'
import { users } from '@server/db/schema/identity'
import { index, integer, jsonb, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

/**
 * Platform area: analytics report cache (P45/P55), translation review state (P60) and the
 * nightly progress exports (contract §9.3).
 */

/**
 * Aggregates computed by the 15-minute schedule. Keyed `dashboard:<range>:<slug|all>` or
 * `report:<slug>:<range>`. Holds counts only — never names or e-mails — so a stale row cannot
 * leak personal data that has since been anonymised.
 */
export const reportCache = pgTable('report_cache', {
  key: text('key').primaryKey(),
  payload: jsonb('payload').$type<unknown>().notNull(),
  computedAt: tstz('computed_at').notNull(),
  ...timestamps(),
})

/**
 * Review state per translatable field (P60). A field with no row and Arabic present counts as
 * `reviewed` (authored content); Arabic blank is always `missing`. `queued_at` marks a field
 * waiting for the machine-translation job (batch 20 per minute, 3 attempts per item).
 */
export const translationStatus = pgTable(
  'translation_status',
  {
    id: id(),
    entity: text('entity').notNull(),
    recordId: text('record_id').notNull(),
    field: text('field').notNull(),
    /** missing · machine · reviewed */
    status: text('status').default('missing').notNull(),
    queuedAt: tstz('queued_at'),
    attempts: integer('attempts').default(0).notNull(),
    lastError: text('last_error'),
    updatedById: uuid('updated_by_id').references(() => users.id),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('translation_status_field_uq').on(t.entity, t.recordId, t.field),
    index('translation_status_queue_idx').on(t.queuedAt),
  ],
)

/** Stored progress CSVs (nightly at 02:00 Gulf time), kept 30 days, downloadable by admins. */
export const progressExports = pgTable(
  'progress_exports',
  {
    id: id(),
    /** nightly */
    kind: text('kind').default('nightly').notNull(),
    /** Gulf calendar date the export belongs to (one nightly export per day). */
    forDate: text('for_date').notNull(),
    fileId: uuid('file_id')
      .notNull()
      .references(() => files.id),
    rows: integer('rows').notNull(),
    expiresAt: tstz('expires_at').notNull(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('progress_exports_kind_date_uq').on(t.kind, t.forDate),
    index('progress_exports_file_idx').on(t.fileId),
  ],
)
