import { id, timestamps, tstz } from '@server/db/columns'
import { users } from '@server/db/schema/identity'
import { sql } from 'drizzle-orm'
import { index, jsonb, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

/**
 * Two-step CSV imports (P40 invitations, P47 users): upload → preview + token → confirm.
 * One pending import per scope at a time (contract §9.4).
 */
export const csvImports = pgTable(
  'csv_imports',
  {
    id: id(),
    kind: text('kind').notNull(), // invitations | users
    /** microsite id, or 'platform' for P47. */
    scope: text('scope').notNull(),
    tokenHash: text('token_hash').notNull(),
    status: text('status').default('pending').notNull(), // pending | confirmed | expired
    rows: jsonb('rows').$type<unknown[]>().notNull(),
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => users.id),
    expiresAt: tstz('expires_at').notNull(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('csv_imports_token_uq').on(t.tokenHash),
    uniqueIndex('csv_imports_one_pending_uq')
      .on(t.kind, t.scope)
      .where(sql`${t.status} = 'pending'`),
    index('csv_imports_created_by_idx').on(t.createdById),
  ],
)
