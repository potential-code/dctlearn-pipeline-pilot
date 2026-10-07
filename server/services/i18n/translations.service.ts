import { type DbOrTx, db } from '@server/db/connection'
import { translationStatus } from '@server/db/schema/platform'
import { recordAudit } from '@server/lib/audit'
import { now } from '@server/lib/clock'
import { featureOff, notFound, validationFailed } from '@server/lib/errors'
import { sanitizeRich, sanitizeText } from '@server/lib/sanitize'
import {
  type Translatable,
  type TranslatableEntity,
  translatables,
} from '@server/services/seams/translatable.registry'
import type { I18n } from '@shared/schemas/common'
import { TRANSLATABLE_ENTITIES } from '@shared/schemas/translations'
import { and, asc, eq, inArray, isNotNull, lt, sql } from 'drizzle-orm'
import { getTableConfig, type PgColumn } from 'drizzle-orm/pg-core'
import { translationEnabled, translationProvider } from './translation.provider'

/**
 * P60 translations over every registered `{ en, ar }` column (`registerTranslatable`).
 * Status per field: Arabic blank → `missing`; otherwise the stored review state, defaulting to
 * `reviewed` for authored content. Fields whose English is blank are not listed (nothing to
 * translate). The list is assembled in memory: the translatable content is small (hundreds of
 * fields), and it spans tables owned by several areas.
 */
type Status = 'missing' | 'machine' | 'reviewed'
type Row = {
  entity: TranslatableEntity
  id: string
  field: string
  en: string
  ar: string
  status: Status
}

const MAX_ATTEMPTS = 3
export const MACHINE_BATCH = 20

const isUuidColumn = (col: PgColumn) => col.columnType === 'PgUUID'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function idValue(reg: Translatable, id: string) {
  return isUuidColumn(reg.id) ? sql`${id}::uuid` : sql`${id}`
}

/** Expands `items[].text` against a value into concrete paths (`items.0.text`, …). */
export function expandPaths(value: unknown, pattern: string): string[] {
  const walk = (node: unknown, parts: string[], prefix: string[]): string[] => {
    if (parts.length === 0) return [prefix.join('.')]
    const [head, ...rest] = parts as [string, ...string[]]
    const isArray = head.endsWith('[]')
    const key = isArray ? head.slice(0, -2) : head
    const child = (node as Record<string, unknown> | null)?.[key]
    if (child === undefined || child === null) return []
    if (!isArray) return walk(child, rest, [...prefix, key])
    if (!Array.isArray(child)) return []
    return child.flatMap((item, i) => walk(item, rest, [...prefix, key, String(i)]))
  }
  return walk(value, pattern.split('.'), [])
}

function getPath(value: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>((node, key) => (node as Record<string, unknown> | null)?.[key], value)
}

const PATH_RE = /^[A-Za-z0-9_]+(\.[A-Za-z0-9_]+)*$/

async function readRecords(reg: Translatable, ids?: string[], tx: DbOrTx = db) {
  const fields = Object.entries(reg.fields)
  const valid = ids?.filter((id) => !isUuidColumn(reg.id) || UUID_RE.test(id))
  if (valid && valid.length === 0) return []
  const jp = reg.jsonPaths
  const selected = [
    ...fields.map(([, col]) => sql`${sql.identifier(col.name)}`),
    ...(jp ? [sql`${sql.identifier(jp.column.name)} as "__json"`] : []),
    ...(jp?.typeColumn ? [sql`${sql.identifier(jp.typeColumn.name)}::text as "__type"`] : []),
  ]
  const cols = selected.length ? sql`, ${sql.join(selected, sql`, `)}` : sql``
  const conditions = [
    ...(valid
      ? [
          sql`${sql.identifier(reg.id.name)} in (${sql.join(
            valid.map((id) => idValue(reg, id)),
            sql`, `,
          )})`,
        ]
      : []),
    ...(reg.deletedAt ? [sql`${sql.identifier(reg.deletedAt.name)} is null`] : []),
  ]
  const where = conditions.length ? sql` where ${sql.join(conditions, sql` and `)}` : sql``
  const result = await tx.execute<Record<string, unknown>>(
    sql`select ${sql.identifier(reg.id.name)}::text as "__id"${cols} from ${reg.table}${where}`,
  )
  return [...result].map((r) => {
    const values: Record<string, I18n> = Object.fromEntries(
      fields.map(([field, col]) => {
        const v = r[col.name] as Partial<I18n> | null
        return [field, { en: v?.en ?? '', ar: v?.ar ?? '' }]
      }),
    )
    if (jp) {
      const json = r.__json
      const type = (r.__type as string | undefined) ?? null
      for (const pattern of jp.patterns(type)) {
        for (const path of expandPaths(json, pattern)) {
          const v = getPath(json, path) as Partial<I18n> | null
          if (v && typeof v === 'object' && ('en' in v || 'ar' in v))
            values[path] = { en: String(v.en ?? ''), ar: String(v.ar ?? '') }
        }
      }
    }
    return { id: String(r.__id), values }
  })
}

async function statusMap(entity: TranslatableEntity, tx: DbOrTx = db) {
  const rows = await tx.select().from(translationStatus).where(eq(translationStatus.entity, entity))
  return new Map(rows.map((r) => [`${r.recordId}:${r.field}`, r]))
}

function statusOf(ar: string, stored: string | undefined): Status {
  if (ar.trim() === '') return 'missing'
  return stored === 'machine' ? 'machine' : 'reviewed'
}

export async function listTranslations(q: {
  entity?: TranslatableEntity
  missing?: 'ar'
  page: number
  pageSize: number
}) {
  const rows: Row[] = []
  for (const reg of translatables(q.entity)) {
    const statuses = await statusMap(reg.entity)
    for (const rec of await readRecords(reg)) {
      for (const [field, value] of Object.entries(rec.values)) {
        if (value.en.trim() === '') continue
        const status = statusOf(value.ar, statuses.get(`${rec.id}:${field}`)?.status)
        if (q.missing === 'ar' && status !== 'missing') continue
        rows.push({ entity: reg.entity, id: rec.id, field, en: value.en, ar: value.ar, status })
      }
    }
  }
  const order = (e: string) => TRANSLATABLE_ENTITIES.indexOf(e as TranslatableEntity)
  rows.sort(
    (a, b) =>
      order(a.entity) - order(b.entity) ||
      a.id.localeCompare(b.id) ||
      a.field.localeCompare(b.field),
  )
  const start = (q.page - 1) * q.pageSize
  return {
    items: rows.slice(start, start + q.pageSize),
    page: q.page,
    pageSize: q.pageSize,
    total: rows.length,
  }
}

function registrationFor(entity: TranslatableEntity, field: string) {
  return (
    translatables(entity).find((r) => Object.hasOwn(r.fields, field)) ??
    (PATH_RE.test(field) ? (translatables(entity).find((r) => r.jsonPaths) ?? null) : null)
  )
}

async function writeArabic(tx: DbOrTx, reg: Translatable, field: string, id: string, ar: string) {
  const touch = getTableConfig(reg.table).columns.some((x) => x.name === 'updated_at')
    ? sql`, "updated_at" = now()`
    : sql``
  const direct = reg.fields[field]
  if (!direct && reg.jsonPaths) {
    // Nested value: set `<path>.ar` inside the jsonb column (path validated: [A-Za-z0-9_.] only).
    if (!PATH_RE.test(field)) throw validationFailed({ field: 'This field cannot be translated' })
    const c = sql.identifier(reg.jsonPaths.column.name)
    const path = `{${[...field.split('.'), 'ar'].join(',')}}`
    await tx.execute(
      sql`update ${reg.table} set ${c} = jsonb_set(${c}, ${path}::text[], to_jsonb(${ar}::text))${touch} where ${sql.identifier(reg.id.name)} = ${idValue(reg, id)}`,
    )
    return
  }
  const col = direct!
  const c = sql.identifier(col.name)
  await tx.execute(
    sql`update ${reg.table} set ${c} = jsonb_set(coalesce(${c}, '{"en":"","ar":""}'::jsonb), '{ar}', to_jsonb(${ar}::text))${touch} where ${sql.identifier(reg.id.name)} = ${idValue(reg, id)}`,
  )
}

async function setStatus(
  tx: DbOrTx,
  key: { entity: string; recordId: string; field: string },
  set: Partial<typeof translationStatus.$inferInsert>,
) {
  await tx
    .insert(translationStatus)
    .values({ ...key, ...set })
    .onConflictDoUpdate({
      target: [translationStatus.entity, translationStatus.recordId, translationStatus.field],
      set,
    })
}

function clean(reg: Translatable, field: string, text: string) {
  const last = field.split('.').at(-1) ?? field
  const rich =
    reg.richFields?.includes(field) ||
    (!reg.fields[field] && Boolean(reg.jsonPaths?.rich?.includes(last)))
  return rich ? sanitizeRich(text) : sanitizeText(text)
}

/** PUT: save a reviewed Arabic value (rich fields sanitised, plain fields stripped of markup). */
export async function updateTranslation(
  body: { entity: TranslatableEntity; id: string; field: string; ar: string },
  viewer: Viewer,
) {
  const reg = registrationFor(body.entity, body.field)
  if (!reg) throw validationFailed({ field: 'This field cannot be translated' })
  const ar = clean(reg, body.field, body.ar).trim()
  if (!ar) throw validationFailed({ ar: 'Enter the Arabic text' })
  return db.transaction(async (tx) => {
    const [rec] = await readRecords(reg, [body.id], tx)
    if (!rec) throw notFound()
    if (!Object.hasOwn(rec.values, body.field))
      throw validationFailed({ field: 'This field cannot be translated' })
    await writeArabic(tx, reg, body.field, rec.id, ar)
    await setStatus(
      tx,
      { entity: body.entity, recordId: rec.id, field: body.field },
      { status: 'reviewed', queuedAt: null, attempts: 0, lastError: null, updatedById: viewer.id },
    )
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'translation.update',
      target: { type: body.entity, id: rec.id, label: body.field },
      ip: viewer.ip,
    })
    return {
      entity: body.entity,
      id: rec.id,
      field: body.field,
      en: rec.values[body.field]?.en ?? '',
      ar,
      status: 'reviewed' as const,
    }
  })
}

/**
 * POST machine: queue every field of the given records that has English and is not a reviewed
 * translation. 503 `feature_off` when no provider is configured.
 */
export async function queueMachineTranslation(body: { entity: TranslatableEntity; ids: string[] }) {
  if (!translationEnabled()) throw featureOff(503, 'Machine translation is not configured')
  let queued = 0
  await db.transaction(async (tx) => {
    for (const reg of translatables(body.entity)) {
      const statuses = await statusMap(reg.entity, tx)
      for (const rec of await readRecords(reg, [...new Set(body.ids)], tx)) {
        for (const [field, value] of Object.entries(rec.values)) {
          if (value.en.trim() === '') continue
          if (statusOf(value.ar, statuses.get(`${rec.id}:${field}`)?.status) === 'reviewed')
            continue
          await setStatus(
            tx,
            { entity: reg.entity, recordId: rec.id, field },
            { queuedAt: now(), attempts: 0, lastError: null },
          )
          queued++
        }
      }
    }
  })
  return { queued }
}

/** The 1-minute job: translate up to 20 queued fields; 3 attempts per item, then dropped. */
export async function runMachineTranslationBatch(limit = MACHINE_BATCH) {
  if (!translationEnabled()) return { translated: 0, failed: 0, skipped: true }
  const queue = await db
    .select()
    .from(translationStatus)
    .where(and(isNotNull(translationStatus.queuedAt), lt(translationStatus.attempts, MAX_ATTEMPTS)))
    .orderBy(asc(translationStatus.queuedAt))
    .limit(limit)
  if (queue.length === 0) return { translated: 0, failed: 0, skipped: false }

  const items: { q: (typeof queue)[number]; reg: Translatable; en: string }[] = []
  for (const q of queue) {
    const reg = registrationFor(q.entity as TranslatableEntity, q.field)
    const [rec] = reg ? await readRecords(reg, [q.recordId]) : []
    const en = rec?.values[q.field]?.en ?? ''
    if (!reg || !rec || en.trim() === '') {
      await db
        .update(translationStatus)
        .set({ queuedAt: null })
        .where(eq(translationStatus.id, q.id))
      continue
    }
    items.push({ q, reg, en })
  }
  if (items.length === 0) return { translated: 0, failed: 0, skipped: false }

  const fail = async (ids: string[], message: string) => {
    await db
      .update(translationStatus)
      .set({
        attempts: sql`${translationStatus.attempts} + 1`,
        lastError: message.slice(0, 500),
        queuedAt: sql`case when ${translationStatus.attempts} + 1 >= ${MAX_ATTEMPTS} then null else ${translationStatus.queuedAt} end`,
      })
      .where(inArray(translationStatus.id, ids))
  }

  let out: string[]
  try {
    out = await translationProvider().translate({
      texts: items.map((i) => i.en),
      sourceLocale: 'en',
      targetLocale: 'ar',
    })
  } catch (error) {
    await fail(
      items.map((i) => i.q.id),
      error instanceof Error ? error.message : String(error),
    )
    return { translated: 0, failed: items.length, skipped: false }
  }

  let translated = 0
  const failed: string[] = []
  for (const [n, item] of items.entries()) {
    const ar = clean(item.reg, item.q.field, out[n] ?? '').trim()
    if (!ar) {
      failed.push(item.q.id)
      continue
    }
    await db.transaction(async (tx) => {
      await writeArabic(tx, item.reg, item.q.field, item.q.recordId, ar)
      await tx
        .update(translationStatus)
        .set({ status: 'machine', queuedAt: null, attempts: 0, lastError: null })
        .where(eq(translationStatus.id, item.q.id))
    })
    translated++
  }
  if (failed.length) await fail(failed, 'Empty translation')
  return { translated, failed: failed.length, skipped: false }
}
