import { deletedAt, i18n, id, timestamps } from '@server/db/columns'
import { microsites } from '@server/db/schema/microsites'
import { sql } from 'drizzle-orm'
import {
  boolean,
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

/**
 * AI coaches and tools (P23–P27, P61). Script / iframe URLs are https from an allow-listed host.
 * Provider keys never live here (env only). Soft delete (§9.2); `key` is unique among live rows.
 */
export const aiEmbeds = pgTable(
  'ai_embeds',
  {
    id: id(),
    key: text('key').notNull(),
    name: i18n('name').notNull(),
    description: i18n('description').default({ en: '', ar: '' }).notNull(),
    iconUrl: text('icon_url').default('').notNull(),
    /** chat · iframe · voice */
    kind: text('kind').notNull(),
    providerId: text('provider_id').notNull(),
    color: text('color').default('#EE3E43').notNull(),
    scriptUrl: text('script_url'),
    iframeUrl: text('iframe_url'),
    requiresLogin: boolean('requires_login').default(true).notNull(),
    deletedAt: deletedAt(),
    ...timestamps(),
  },
  (t) => [uniqueIndex('ai_embeds_key_live_uq').on(t.key).where(sql`${t.deletedAt} is null`)],
)

export const aiEmbedMicrosites = pgTable(
  'ai_embed_microsites',
  {
    embedId: uuid('embed_id')
      .notNull()
      .references(() => aiEmbeds.id, { onDelete: 'cascade' }),
    micrositeId: uuid('microsite_id')
      .notNull()
      .references(() => microsites.id),
    ...timestamps(),
  },
  (t) => [
    primaryKey({ columns: [t.embedId, t.micrositeId] }),
    index('ai_embed_microsites_microsite_idx').on(t.micrositeId),
  ],
)

/**
 * Voice-hiring applicants (P27). Personal data: admin export only, deleted after 12 months
 * (§9.7, `content.job.ts`). Never logged or audited.
 */
export const voiceIntakes = pgTable(
  'voice_intakes',
  {
    id: id(),
    embedKey: text('embed_key').default('voice-hiring').notNull(),
    applicant: jsonb('applicant').$type<Record<string, unknown>>().notNull(),
    providerSessionId: text('provider_session_id'),
    ...timestamps(),
  },
  (t) => [index('voice_intakes_created_idx').on(t.createdAt)],
)

export type AiEmbedRow = typeof aiEmbeds.$inferSelect
