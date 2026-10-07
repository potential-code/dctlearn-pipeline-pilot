import type { TranslatableEntity } from '@shared/enums'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'

/**
 * P60 translations: every area registers the `{ en, ar }` columns it owns; the i18n area lists
 * missing Arabic, saves reviewed translations and queues machine translation through this.
 */
export type { TranslatableEntity }

export type Translatable = {
  entity: TranslatableEntity
  table: PgTable
  id: PgColumn
  /** Field name → jsonb `{ en, ar }` column. Block payloads use `jsonPaths` instead. */
  fields: Record<string, PgColumn>
  /** Rich-text fields are sanitised on save. */
  richFields?: string[]
}

const registry: Translatable[] = []

export function registerTranslatable(t: Translatable) {
  registry.push(t)
}

export function translatables(entity?: TranslatableEntity) {
  return entity ? registry.filter((t) => t.entity === entity) : [...registry]
}
