import { type DbOrTx, db } from '@server/db/connection'
import { type FormField, formEntries, formMicrosites, forms } from '@server/db/schema/forms'
import { users } from '@server/db/schema/identity'
import { memberships, microsites } from '@server/db/schema/microsites'
import { recordAudit } from '@server/lib/audit'
import { now } from '@server/lib/clock'
import { notFound, validationFailed } from '@server/lib/errors'
import { paged, pageWindow } from '@server/lib/pagination'
import { micrositeIdsForSlugs } from '@server/services/events/audience'
import { getFile } from '@server/services/files.service'
import { toUserDto } from '@server/services/identity/user-dto'
import { toCsv } from '@server/utils/csv'
import type { PaginationInput } from '@shared/schemas/common'
import type { AdminFormsQuery, FormInput } from '@shared/schemas/forms'
import { and, asc, count, desc, eq, inArray, isNull } from 'drizzle-orm'
import type { z } from 'zod'
import {
  type Form,
  findVisibleForm,
  myLatestEntry,
  pendingDashboardForms,
  submitEntry,
} from './form-access.service'

/** P56 admin forms + learner forms. Entries CSV export is audited. */

const notDeleted = isNull(forms.deletedAt)

async function findForm(id: string, tx: DbOrTx = db) {
  const [row] = await tx
    .select()
    .from(forms)
    .where(and(eq(forms.id, id), notDeleted))
  if (!row) throw notFound()
  return row
}

async function micrositeSlugs(formIds: string[]) {
  const map = new Map<string, string[]>()
  if (formIds.length === 0) return map
  const rows = await db
    .select({ formId: formMicrosites.formId, slug: microsites.slug })
    .from(formMicrosites)
    .innerJoin(microsites, eq(microsites.id, formMicrosites.micrositeId))
    .where(inArray(formMicrosites.formId, formIds))
    .orderBy(asc(microsites.slug))
  for (const r of rows) map.set(r.formId, [...(map.get(r.formId) ?? []), r.slug])
  return map
}

const fieldDto = (f: FormField) => ({
  key: f.key,
  label: f.label,
  type: f.type,
  required: f.required,
  ...(f.options ? { options: f.options.map((o) => ({ value: o.value, label: o.label })) } : {}),
})

function adminDto(f: Form, slugs: string[]) {
  return {
    id: f.id,
    title: f.title,
    kind: f.kind as 'survey' | 'application' | 'registration',
    microsites: slugs,
    fields: f.fields.map(fieldDto),
    status: f.status as 'draft' | 'published' | 'closed',
  }
}

async function adminFormDto(id: string) {
  const f = await findForm(id)
  return adminDto(f, (await micrositeSlugs([id])).get(id) ?? [])
}

export async function listForms(query: z.infer<typeof AdminFormsQuery>) {
  const where = and(
    notDeleted,
    query.kind ? eq(forms.kind, query.kind) : undefined,
    query.status ? eq(forms.status, query.status) : undefined,
  )
  const [total] = await db.select({ n: count() }).from(forms).where(where)
  const rows = await db
    .select()
    .from(forms)
    .where(where)
    .orderBy(desc(forms.createdAt))
    .limit(pageWindow(query).limit)
    .offset(pageWindow(query).offset)
  const slugs = await micrositeSlugs(rows.map((r) => r.id))
  return paged(
    rows.map((r) => adminDto(r, slugs.get(r.id) ?? [])),
    total?.n ?? 0,
    query,
  )
}

function values(input: FormInput) {
  return {
    title: input.title,
    kind: input.kind,
    status: input.status,
    fields: input.fields.map(
      (f): FormField => ({
        key: f.key,
        label: f.label,
        type: f.type,
        required: f.required,
        ...(f.options ? { options: f.options } : {}),
        ...(f.maxLength ? { maxLength: f.maxLength } : {}),
      }),
    ),
    ...(input.showOnDashboard !== undefined ? { showOnDashboard: input.showOnDashboard } : {}),
    ...(input.oneEntryPerUser !== undefined ? { oneEntryPerUser: input.oneEntryPerUser } : {}),
    ...(input.dueAt !== undefined ? { dueAt: input.dueAt ? new Date(input.dueAt) : null } : {}),
  }
}

async function setMicrosites(tx: DbOrTx, formId: string, slugs: string[]) {
  const ids = await micrositeIdsForSlugs(slugs, 'microsites', tx)
  await tx.delete(formMicrosites).where(eq(formMicrosites.formId, formId))
  if (ids.length)
    await tx.insert(formMicrosites).values(ids.map((micrositeId) => ({ formId, micrositeId })))
}

export async function createForm(input: FormInput, viewer: Viewer) {
  const id = await db.transaction(async (tx) => {
    const [row] = await tx.insert(forms).values(values(input)).returning()
    await setMicrosites(tx, row!.id, input.microsites)
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'form.create',
      target: { type: 'form', id: row!.id, label: input.title.en },
      ip: viewer.ip,
    })
    return row!.id
  })
  return adminFormDto(id)
}

export async function updateForm(id: string, input: FormInput, viewer: Viewer) {
  await db.transaction(async (tx) => {
    await findForm(id, tx)
    await tx.update(forms).set(values(input)).where(eq(forms.id, id))
    await setMicrosites(tx, id, input.microsites)
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'form.update',
      target: { type: 'form', id, label: input.title.en },
      ip: viewer.ip,
    })
  })
  return adminFormDto(id)
}

/** Soft delete (§9.2); entries are kept. */
export async function deleteForm(id: string, viewer: Viewer) {
  await db.transaction(async (tx) => {
    const f = await findForm(id, tx)
    await tx.update(forms).set({ deletedAt: now() }).where(eq(forms.id, id))
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'form.delete',
      target: { type: 'form', id, label: f.title.en },
      ip: viewer.ip,
    })
  })
}

export async function listEntries(id: string, query: PaginationInput, viewer: Viewer) {
  await findForm(id)
  const where = eq(formEntries.formId, id)
  const [total] = await db.select({ n: count() }).from(formEntries).where(where)
  const rows = await db
    .select({ e: formEntries, u: users })
    .from(formEntries)
    .leftJoin(users, eq(users.id, formEntries.userId))
    .where(where)
    .orderBy(desc(formEntries.submittedAt))
    .limit(pageWindow(query).limit)
    .offset(pageWindow(query).offset)
  const items = await Promise.all(
    rows.map(async ({ e, u }) => ({
      id: e.id,
      ...(u ? { user: await toUserDto(u, viewer.id) } : {}),
      submittedAt: e.submittedAt.toISOString(),
      answers: e.answers,
    })),
  )
  return paged(items, total?.n ?? 0, query)
}

const csvValue = (v: unknown) =>
  Array.isArray(v) ? v.join('; ') : v === undefined || v === null ? '' : v

/** Entries as CSV (formula-safe via `toCsv`). Audited. */
export async function entriesCsv(id: string, viewer: Viewer) {
  const form = await findForm(id)
  const rows = await db
    .select({ e: formEntries, u: users, m: microsites })
    .from(formEntries)
    .leftJoin(users, eq(users.id, formEntries.userId))
    .leftJoin(microsites, eq(microsites.id, formEntries.micrositeId))
    .where(eq(formEntries.formId, id))
    .orderBy(asc(formEntries.submittedAt))
  const keys = form.fields.map((f) => f.key)
  const csv = toCsv(
    ['entryId', 'submittedAt', 'name', 'email', 'microsite', ...keys],
    rows.map(({ e, u, m }) => [
      e.id,
      e.submittedAt,
      u?.name ?? '',
      u?.email ?? '',
      m?.slug ?? '',
      ...keys.map((k) => csvValue(e.answers[k])),
    ]),
  )
  await recordAudit(db, {
    actorId: viewer.id,
    action: 'form.entries_export',
    target: { type: 'form', id, label: form.title.en },
    ip: viewer.ip,
    meta: { rows: rows.length },
  })
  return { csv, filename: `form-${id}-entries.csv` }
}

/* ------------------------------------------------------------------ learner */

export async function getLearnerForm(formId: string, viewer: Viewer) {
  const form = await findVisibleForm(formId, viewer)
  const mine = await myLatestEntry(formId, viewer.id)
  return {
    id: form.id,
    title: form.title,
    kind: form.kind as 'survey' | 'application' | 'registration',
    fields: form.fields.map((f) => ({
      ...fieldDto(f),
      ...(f.maxLength ? { maxLength: f.maxLength } : {}),
    })),
    ...(mine
      ? { myEntry: { submittedAt: mine.submittedAt.toISOString(), answers: mine.answers } }
      : {}),
  }
}

/** The entry is tagged with the first of the form's microsites the viewer belongs to. */
export async function submitLearnerEntry(
  formId: string,
  viewer: Viewer,
  answers: Record<string, unknown>,
) {
  const form = await findVisibleForm(formId, viewer)
  // A file answer must be an upload of the viewer's own (ids cannot point at others' files).
  for (const f of form.fields) {
    const v = answers[f.key]
    if (f.type !== 'file' || typeof v !== 'string' || !/^[0-9a-f-]{36}$/i.test(v)) continue
    const file = await getFile(v)
    if (file?.ownerId !== viewer.id) throw validationFailed({ [f.key]: 'Upload a file first' })
  }
  const [link] = await db
    .select({ id: formMicrosites.micrositeId })
    .from(formMicrosites)
    .innerJoin(
      memberships,
      and(
        eq(memberships.micrositeId, formMicrosites.micrositeId),
        eq(memberships.userId, viewer.id),
      ),
    )
    .where(eq(formMicrosites.formId, formId))
    .limit(1)
  const entry = await submitEntry(form, viewer, answers, link?.id ?? null)
  return { id: entry.id }
}

/** P14 surveys: published dashboard forms of the microsite not yet answered. */
export async function dashboardSurveys(viewer: Viewer, micrositeId: string) {
  return (await pendingDashboardForms(micrositeId, viewer.id)).map((f) => ({
    formId: f.id,
    title: f.title,
    ...(f.dueAt ? { dueAt: f.dueAt.toISOString() } : {}),
  }))
}
