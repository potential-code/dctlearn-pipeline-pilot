import type { I18n } from '@shared/schemas/common'
import { jsonb, timestamp, uuid } from 'drizzle-orm/pg-core'

/** Shared column helpers. Every table has `created_at` / `updated_at` in UTC (contract §9.2). */
export const id = () => uuid('id').primaryKey().defaultRandom()

export const createdAt = () =>
  timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
export const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull()
export const timestamps = () => ({ createdAt: createdAt(), updatedAt: updatedAt() })
export const deletedAt = () => timestamp('deleted_at', { withTimezone: true })
export const tstz = (name: string) => timestamp(name, { withTimezone: true })

/** One `{ en, ar }` jsonb column per translatable field (decision 2026-10-07). */
export const i18n = (name: string) => jsonb(name).$type<I18n>()
export const EMPTY_I18N: I18n = { en: '', ar: '' }
