import { deletedAt, i18n, id, timestamps, tstz } from '@server/db/columns'
import { users } from '@server/db/schema/identity'
import { microsites } from '@server/db/schema/microsites'
import { boolean, index, pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core'

/**
 * Events & workshops (P57, P52 workshops, P14 events). The status `upcoming → live → past` is
 * computed from the clock on read (join window ± grace); only `cancelled` is stored
 * (`cancelled_at`). Soft delete (§9.2).
 */
export const events = pgTable(
  'events',
  {
    id: id(),
    title: i18n('title').notNull(),
    description: i18n('description').default({ en: '', ar: '' }).notNull(),
    category: text('category').default('').notNull(),
    venue: text('venue'),
    startsAt: tstz('starts_at').notNull(),
    endsAt: tstz('ends_at').notNull(),
    timezone: text('timezone').default('Asia/Dubai').notNull(),
    zoomUrl: text('zoom_url'),
    recordingUrl: text('recording_url'),
    /** Learners see the recording only once published. */
    recordingPublished: boolean('recording_published').default(false).notNull(),
    imageUrl: text('image_url'),
    cancelledAt: tstz('cancelled_at'),
    cancelReason: text('cancel_reason'),
    createdById: uuid('created_by_id').references(() => users.id),
    deletedAt: deletedAt(),
    ...timestamps(),
  },
  (t) => [
    index('events_starts_at_idx').on(t.startsAt),
    index('events_created_by_idx').on(t.createdById),
  ],
)

/** Audience = microsites; participants are the members of those microsites (no RSVP). */
export const eventAudiences = pgTable(
  'event_audiences',
  {
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    micrositeId: uuid('microsite_id')
      .notNull()
      .references(() => microsites.id),
    ...timestamps(),
  },
  (t) => [
    primaryKey({ columns: [t.eventId, t.micrositeId] }),
    index('event_audiences_microsite_idx').on(t.micrositeId),
  ],
)

export type EventRow = typeof events.$inferSelect
