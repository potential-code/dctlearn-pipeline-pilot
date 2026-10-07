import { z } from 'zod'
import { FORM_KINDS, FORM_STATUSES } from '../enums'
import {
  I18n,
  i18nShort,
  i18nTitle,
  isoDateTime,
  paginated,
  pagination,
  slug,
  UserDto,
} from './common'

/** P56 forms (admin) and learner forms (mentee registration, dashboard surveys, applications). */

export const FIELD_TYPES = [
  'text',
  'textarea',
  'select',
  'multiselect',
  'radio',
  'checkbox',
  'date',
  'number',
  'file',
] as const
const CHOICE_TYPES = new Set(['select', 'multiselect', 'radio'])

export const FormFieldInput = z.object({
  key: z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,39}$/, 'Use letters, digits and _ (max 40)'),
  label: z.object({ en: z.string().trim().min(1).max(240), ar: z.string().trim().max(240) }),
  type: z.enum(FIELD_TYPES),
  required: z.boolean().default(false),
  options: z
    .array(z.object({ value: z.string().trim().min(1).max(80), label: i18nShort }))
    .max(100)
    .optional(),
  maxLength: z.number().int().min(1).max(5000).optional(),
})

export const FormInput = z
  .object({
    title: i18nTitle,
    kind: z.enum(FORM_KINDS),
    /** Microsite public ids (slugs). */
    microsites: z.array(slug).max(50).default([]),
    fields: z.array(FormFieldInput).min(1).max(100),
    status: z.enum(FORM_STATUSES).default('draft'),
    /** Not in the contract response; optional settings for surveys (P14) and repeat entries. */
    showOnDashboard: z.boolean().optional(),
    oneEntryPerUser: z.boolean().optional(),
    dueAt: isoDateTime.optional().nullable(),
  })
  .superRefine((v, ctx) => {
    const seen = new Set<string>()
    v.fields.forEach((f, i) => {
      if (seen.has(f.key))
        ctx.addIssue({ code: 'custom', path: ['fields', i, 'key'], message: 'Duplicate key' })
      seen.add(f.key)
      const values = (f.options ?? []).map((o) => o.value)
      if (CHOICE_TYPES.has(f.type) && values.length === 0)
        ctx.addIssue({ code: 'custom', path: ['fields', i, 'options'], message: 'Add options' })
      if (new Set(values).size !== values.length)
        ctx.addIssue({
          code: 'custom',
          path: ['fields', i, 'options'],
          message: 'Duplicate option',
        })
    })
  })
export type FormInput = z.infer<typeof FormInput>

const FieldDto = z.strictObject({
  key: z.string(),
  label: I18n,
  type: z.enum(FIELD_TYPES),
  required: z.boolean(),
  options: z.array(z.strictObject({ value: z.string(), label: I18n })).optional(),
})

export const AdminForm = z.strictObject({
  id: z.string(),
  title: I18n,
  kind: z.enum(FORM_KINDS),
  microsites: z.array(z.string()),
  fields: z.array(FieldDto.extend({ maxLength: z.number().optional() }).strict()),
  status: z.enum(FORM_STATUSES),
  showOnDashboard: z.boolean(),
  oneEntryPerUser: z.boolean(),
  dueAt: z.string().optional(),
})
export const AdminFormsQuery = pagination.extend({
  kind: z.enum(FORM_KINDS).optional(),
  status: z.enum(FORM_STATUSES).optional(),
})
export const AdminFormsPage = paginated(AdminForm)

export const EntriesPage = paginated(
  z.strictObject({
    id: z.string(),
    user: UserDto.optional(),
    submittedAt: z.string(),
    answers: z.record(z.string(), z.unknown()),
  }),
)

/* learner */

export const LearnerForm = z.strictObject({
  id: z.string(),
  title: I18n,
  kind: z.enum(FORM_KINDS),
  fields: z.array(FieldDto.extend({ maxLength: z.number().optional() }).strict()),
  myEntry: z
    .strictObject({ submittedAt: z.string(), answers: z.record(z.string(), z.unknown()) })
    .optional(),
})
export const FormIdParam = z.object({ formId: z.uuid() })
export const EntryInput = z.object({ answers: z.record(z.string(), z.unknown()) })

export const DashboardSurvey = z.strictObject({
  formId: z.string(),
  title: I18n,
  dueAt: z.string().optional(),
})
