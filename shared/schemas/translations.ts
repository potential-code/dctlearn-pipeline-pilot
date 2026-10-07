import { z } from 'zod'
import { paginated } from './common'

/** P60 translations (contract §6). */
export const TRANSLATABLE_ENTITIES = [
  'course',
  'unit',
  'block',
  'page',
  'faq',
  'microsite',
] as const
export const TRANSLATION_STATUSES = ['missing', 'machine', 'reviewed'] as const
const entity = z.enum(TRANSLATABLE_ENTITIES)

export const TranslationsQuery = z.object({
  entity: entity.optional(),
  missing: z.literal('ar').optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export const TranslationRow = z.strictObject({
  entity,
  id: z.string(),
  field: z.string(),
  en: z.string(),
  ar: z.string(),
  status: z.enum(TRANSLATION_STATUSES),
})
export const TranslationsPage = paginated(TranslationRow)

export const TranslationUpdate = z.object({
  entity,
  id: z.string().min(1).max(100),
  field: z.string().min(1).max(60),
  ar: z.string().trim().min(1).max(20_000),
})

export const MachineTranslationRequest = z.object({
  entity,
  ids: z.array(z.string().min(1).max(100)).min(1).max(100),
})
export const MachineTranslationQueued = z.strictObject({ queued: z.number().int() })
