import { type DbOrTx, db } from '@server/db/connection'
import { formEntries, formMicrosites, forms } from '@server/db/schema/forms'
import { memberships } from '@server/db/schema/microsites'
import { conflict, notFound, validationFailed } from '@server/lib/errors'
import { sanitizeText } from '@server/lib/sanitize'
import { and, desc, eq, inArray, isNull } from 'drizzle-orm'

/**
 * Learner-side form access shared by forms, mentoring registration and dashboard surveys:
 * a form is visible when published and linked to one of the viewer's microsites; entries are
 * own-only; text answers are sanitised; one entry per user when the form says so.
 */
export type Form = typeof forms.$inferSelect

export async function findVisibleForm(
  formId: string,
  viewer: Viewer,
  tx: DbOrTx = db,
): Promise<Form> {
  const [form] = await tx
    .select()
    .from(forms)
    .where(and(eq(forms.id, formId), isNull(forms.deletedAt)))
  if (form?.status !== 'published') throw notFound()
  if (viewer.role === 'admin') return form
  const linked = await tx
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
  if (linked.length === 0) throw notFound()
  return form
}

export async function myLatestEntry(formId: string, userId: string, tx: DbOrTx = db) {
  const [row] = await tx
    .select()
    .from(formEntries)
    .where(and(eq(formEntries.formId, formId), eq(formEntries.userId, userId)))
    .orderBy(desc(formEntries.submittedAt))
    .limit(1)
  return row ?? null
}

/** Validates answers against the form's own field list (required, options, max length). */
export function validateAnswers(form: Form, answers: Record<string, unknown>) {
  const fields: Record<string, string> = {}
  const clean: Record<string, unknown> = {}
  for (const f of form.fields) {
    const v = answers[f.key]
    const empty = v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)
    if (empty) {
      if (f.required) fields[f.key] = 'Required'
      continue
    }
    const allowed = new Set((f.options ?? []).map((o) => o.value))
    switch (f.type) {
      case 'text':
      case 'textarea':
      case 'date': {
        if (typeof v !== 'string') fields[f.key] = 'Must be text'
        else if (v.length > (f.maxLength ?? (f.type === 'textarea' ? 5000 : 500)))
          fields[f.key] = 'Too long'
        else clean[f.key] = sanitizeText(v)
        break
      }
      case 'number':
        if (typeof v !== 'number' || !Number.isFinite(v)) fields[f.key] = 'Must be a number'
        else clean[f.key] = v
        break
      case 'select':
      case 'radio':
        if (typeof v !== 'string' || !allowed.has(v)) fields[f.key] = 'Choose one of the options'
        else clean[f.key] = v
        break
      case 'multiselect':
        if (!Array.isArray(v) || v.some((x) => typeof x !== 'string' || !allowed.has(x)))
          fields[f.key] = 'Choose from the options'
        else clean[f.key] = v
        break
      case 'checkbox':
        if (typeof v !== 'boolean') fields[f.key] = 'Must be true or false'
        else clean[f.key] = v
        break
      case 'file':
        if (typeof v !== 'string' || !/^[0-9a-f-]{36}$/i.test(v))
          fields[f.key] = 'Upload a file first'
        else clean[f.key] = v
        break
    }
  }
  if (Object.keys(fields).length) throw validationFailed(fields)
  return clean
}

/** Saves an entry (own). 409 when the form allows one entry and it exists. */
export async function submitEntry(
  form: Form,
  viewer: Viewer,
  answers: Record<string, unknown>,
  micrositeId: string | null,
  tx?: DbOrTx,
) {
  const clean = validateAnswers(form, answers)
  const run = async (t: DbOrTx) => {
    // Serialise per form so two quick submits cannot both pass the one-entry check.
    await t.select({ id: forms.id }).from(forms).where(eq(forms.id, form.id)).for('update')
    if (form.oneEntryPerUser && (await myLatestEntry(form.id, viewer.id, t)))
      throw conflict('You already submitted this form')
    const [row] = await t
      .insert(formEntries)
      .values({ formId: form.id, userId: viewer.id, micrositeId, answers: clean })
      .returning()
    return row!
  }
  return tx ? run(tx) : db.transaction(run)
}

/** Published dashboard surveys for a microsite the viewer has not answered yet. */
export async function pendingDashboardForms(micrositeId: string, userId: string, tx: DbOrTx = db) {
  const rows = await tx
    .select({ form: forms })
    .from(forms)
    .innerJoin(formMicrosites, eq(formMicrosites.formId, forms.id))
    .where(
      and(
        eq(formMicrosites.micrositeId, micrositeId),
        eq(forms.status, 'published'),
        eq(forms.showOnDashboard, true),
        isNull(forms.deletedAt),
      ),
    )
  if (rows.length === 0) return []
  const answered = await tx
    .select({ formId: formEntries.formId })
    .from(formEntries)
    .where(
      and(
        eq(formEntries.userId, userId),
        inArray(
          formEntries.formId,
          rows.map((r) => r.form.id),
        ),
      ),
    )
  const done = new Set(answered.map((a) => a.formId))
  return rows.filter((r) => !done.has(r.form.id)).map((r) => r.form)
}
