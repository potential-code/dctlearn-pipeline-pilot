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
  /**
   * `{ en, ar }` values nested inside one jsonb column (block payloads). Each concrete path is
   * listed as its own field, e.g. `html`, `items.0.text`, `questions.1.options.0.text`.
   */
  jsonPaths?: {
    column: PgColumn
    /** Column whose value picks the patterns (e.g. block `type`). */
    typeColumn?: PgColumn
    /** Patterns per type; `[]` marks an array, e.g. `items[].text`. */
    patterns: (type: string | null) => string[]
    /** Last path segments that hold rich text (sanitised as HTML). */
    rich?: string[]
  }
  /** Soft-delete column: rows with a value are not listed. */
  deletedAt?: PgColumn
}

const registry: Translatable[] = []

export function registerTranslatable(t: Translatable) {
  registry.push(t)
}

export function translatables(entity?: TranslatableEntity) {
  return entity ? registry.filter((t) => t.entity === entity) : [...registry]
}
