import { deletedAt, i18n, id, timestamps } from '@server/db/columns'
import { integer, jsonb, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'

/** Site-wide content blocks (P01 hero, affiliates, featured course ids), keyed. */
export const siteSettings = pgTable('site_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').$type<unknown>().notNull(),
  ...timestamps(),
})

/** P02/P03 page sections. */
export const pageSections = pgTable(
  'page_sections',
  {
    id: id(),
    page: text('page').notNull(), // professionals | students
    key: text('key').notNull(),
    title: i18n('title').notNull(),
    body: i18n('body').notNull(),
    imageUrl: text('image_url'),
    cta: jsonb('cta').$type<{ label: { en: string; ar: string }; url: string }>(),
    sortOrder: integer('sort_order').default(0).notNull(),
    ...timestamps(),
  },
  (t) => [uniqueIndex('page_sections_page_key_uq').on(t.page, t.key)],
)

export const faqItems = pgTable('faq_items', {
  id: id(),
  question: i18n('question').notNull(),
  answer: i18n('answer').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  deletedAt: deletedAt(),
  ...timestamps(),
})
