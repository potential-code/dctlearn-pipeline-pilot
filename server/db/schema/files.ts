import { id, timestamps } from '@server/db/columns'
import { users } from '@server/db/schema/identity'
import { index, integer, pgTable, text, uuid } from 'drizzle-orm/pg-core'

/** Every stored object. `{ fileId, url }` in the contract = this row + a signed URL. */
export const files = pgTable(
  'files',
  {
    id: id(),
    key: text('key').notNull(),
    category: text('category').notNull(),
    contentType: text('content_type').notNull(),
    size: integer('size').notNull(),
    originalName: text('original_name').default('').notNull(),
    ownerId: uuid('owner_id').references(() => users.id),
    /** public = brand/course imagery served to anyone signed-in or not; private = user-bound. */
    visibility: text('visibility').default('private').notNull(),
    ...timestamps(),
  },
  (t) => [index('files_owner_idx').on(t.ownerId)],
)
