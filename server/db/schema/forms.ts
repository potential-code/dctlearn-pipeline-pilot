import { deletedAt, i18n, id, timestamps, tstz } from '@server/db/columns'
import { users } from '@server/db/schema/identity'
import { microsites } from '@server/db/schema/microsites'
import type { I18n } from '@shared/schemas/common'
import { boolean, index, jsonb, pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core'

export type FormField = {
  key: string
  label: I18n
  type:
    | 'text'
    | 'textarea'
    | 'select'
    | 'multiselect'
    | 'radio'
    | 'checkbox'
    | 'date'
    | 'number'
    | 'file'
  required: boolean
  options?: { value: string; label: I18n }[]
  maxLength?: number
}

/** Surveys, applications and registrations (P56, learner forms, mentee registration). */
export const forms = pgTable('forms', {
  id: id(),
  title: i18n('title').notNull(),
  kind: text('kind').notNull(), // survey | application | registration
  fields: jsonb('fields').$type<FormField[]>().default([]).notNull(),
  status: text('status').default('draft').notNull(), // draft | published | closed
  oneEntryPerUser: boolean('one_entry_per_user').default(true).notNull(),
  /** Shown on the P14 dashboard surveys list. */
  showOnDashboard: boolean('show_on_dashboard').default(false).notNull(),
  dueAt: tstz('due_at'),
  deletedAt: deletedAt(),
  ...timestamps(),
})

export const formMicrosites = pgTable(
  'form_microsites',
  {
    formId: uuid('form_id')
      .notNull()
      .references(() => forms.id),
    micrositeId: uuid('microsite_id')
      .notNull()
      .references(() => microsites.id),
  },
  (t) => [primaryKey({ columns: [t.formId, t.micrositeId] })],
)

export const formEntries = pgTable(
  'form_entries',
  {
    id: id(),
    formId: uuid('form_id')
      .notNull()
      .references(() => forms.id),
    userId: uuid('user_id').references(() => users.id),
    micrositeId: uuid('microsite_id').references(() => microsites.id),
    answers: jsonb('answers').$type<Record<string, unknown>>().notNull(),
    submittedAt: tstz('submitted_at').defaultNow().notNull(),
    ...timestamps(),
  },
  (t) => [index('form_entries_form_idx').on(t.formId), index('form_entries_user_idx').on(t.userId)],
)
