import { z } from 'zod'
import { LOCALES } from '../enums'

/**
 * Field rules of API-CONTRACT §0.0, shared by the forms and the API.
 * Request schemas are lenient about unknown keys (they are stripped, so callers can never set
 * `role`, `userId`, …); response schemas are strict so tests catch undocumented fields.
 */

export const uuid = z.uuid()
export const slug = z
  .string()
  .regex(/^[a-z0-9-]{2,40}$/, 'Use 2–40 lower-case letters, digits or dashes')
export const personName = z.string().trim().min(1).max(80)
export const email = z
  .string()
  .trim()
  .max(254)
  .pipe(z.email())
  .transform((value) => value.toLowerCase())
export const password = z.string().min(10).max(128)
export const shortText = z.string().max(240)
export const richText = z.string().max(20_000)
export const httpsUrl = z
  .string()
  .max(2048)
  .pipe(z.url({ protocol: /^https$/ }))
export const locale = z.enum(LOCALES)
export const isoDateTime = z.iso.datetime({ offset: true })
export const isoDate = z.iso.date()

/** `{ en, ar }` content. Titles: 1–160 per language on `en`; Arabic may be blank until translated. */
export const i18nText = (max = 20_000) =>
  z.object({ en: z.string().max(max), ar: z.string().max(max) })
export const i18nTitle = z.object({
  en: z.string().trim().min(1).max(160),
  ar: z.string().trim().max(160),
})
export const i18nShort = i18nText(240)
export const i18nRich = i18nText(20_000)

/** Response-side I18n, always both keys. */
export const I18n = z.strictObject({ en: z.string(), ar: z.string() })
export type I18n = z.infer<typeof I18n>

export const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
export type PaginationInput = z.infer<typeof pagination>

export const paginated = <T extends z.ZodType>(item: T) =>
  z.strictObject({
    items: z.array(item),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
  })

/** Optimistic concurrency (contract §9.4): clients send back the `updatedAt` they loaded. */
export const ifMatch = z.object({ ifMatch: isoDateTime.optional() })

export const idParam = z.object({ id: z.uuid() })
export const micrositeParam = z.object({ p: slug })

/** Response shapes of §0.2. */
export const UserDto = z.strictObject({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(['learner', 'mentor', 'judge', 'sub_admin', 'admin']),
  locale: z.enum(LOCALES),
  imageUrl: z.string().optional(),
  status: z.enum(['active', 'disabled', 'invited']),
})
export type UserDto = z.infer<typeof UserDto>

export const MicrositeRef = z.strictObject({
  id: z.string(),
  name: I18n,
  accentColor: z.string(),
  logoUrl: z.string(),
  heroUrl: z.string(),
})
export type MicrositeRef = z.infer<typeof MicrositeRef>

export const CourseCard = z.strictObject({
  courseId: z.string(),
  slug: z.string(),
  title: I18n,
  imageUrl: z.string(),
  categories: z.array(z.string()),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  durationMin: z.number().int(),
  isMandatory: z.boolean(),
  isCertProgramme: z.boolean(),
  state: z.enum(['not_started', 'in_progress', 'completed', 'coming_soon']),
  progressPct: z.number(),
  nextUnitId: z.string().optional(),
})
export type CourseCard = z.infer<typeof CourseCard>

export const MentorCard = z.strictObject({
  mentorId: z.string(),
  name: z.string(),
  title: z.string(),
  photoUrl: z.string(),
  categories: z.array(z.string()),
  microsites: z.array(z.string()),
  rating: z.number().optional(),
  sessionsCount: z.number().int(),
  nextFreeSlot: z.string().optional(),
  bookingEnabled: z.boolean(),
})
export type MentorCard = z.infer<typeof MentorCard>

export const Created = z.strictObject({ id: z.string() })
