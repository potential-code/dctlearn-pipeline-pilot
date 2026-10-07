import { z } from 'zod'
import { AI_EMBED_KINDS } from '../enums'
import { httpsUrl, I18n, i18nText, i18nTitle, paginated, pagination, slug } from './common'

/** P23–P27 AI coaches / tools / voice hiring, P61 admin AI embeds, P52 ai_* tabs. */

export const AiEmbedKind = z.enum(AI_EMBED_KINDS)
export const embedKey = z
  .string()
  .regex(/^[a-z0-9-]{2,40}$/, 'Use 2–40 lower-case letters, digits or dashes')

export const AiEmbed = z.strictObject({
  key: z.string(),
  name: I18n,
  description: I18n,
  iconUrl: z.string(),
  kind: AiEmbedKind,
  providerId: z.string(),
  color: z.string(),
  requiresLogin: z.boolean(),
  scriptUrl: z.string().optional(),
  iframeUrl: z.string().optional(),
})
export const MicrositeAi = z.strictObject({ coaches: z.array(AiEmbed), tools: z.array(AiEmbed) })

export const AiSession = z.strictObject({ token: z.string(), expiresAt: z.string() })

export const HubAiItem = z.strictObject({
  key: z.string(),
  name: I18n,
  description: I18n,
  iconUrl: z.string(),
  kind: AiEmbedKind,
  url: z.string(),
})
export const HubAiResponse = z.strictObject({ items: z.array(HubAiItem) })

/** P27: every field required; `consent` must be literally true. */
export const VoiceIntakeInput = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z
    .string()
    .trim()
    .max(254)
    .pipe(z.email())
    .transform((v) => v.toLowerCase()),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{6,20}$/, 'Enter a valid phone number'),
  university: z.string().trim().min(1).max(160),
  major: z.string().trim().min(1).max(160),
  graduationYear: z.coerce.number().int().min(1950).max(2100),
  alAinResident: z.boolean(),
  familyBook: z.boolean(),
  availability: z.string().trim().min(1).max(240),
  noticePeriod: z.string().trim().min(1).max(240),
  yearsExperience: z.coerce.number().min(0).max(60),
  consent: z.literal(true, { error: 'Consent is required' }),
})
export type VoiceIntakeInput = z.infer<typeof VoiceIntakeInput>
export const VoiceIntakeResponse = z.strictObject({ sessionToken: z.string() })

/* admin P61 */

const color = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Use a hex colour like #EE3E43')

export const AiEmbedInput = z.object({
  name: i18nTitle,
  description: i18nText(1000).default({ en: '', ar: '' }),
  iconUrl: httpsUrl.or(z.literal('')).default(''),
  kind: AiEmbedKind,
  providerId: z.string().trim().min(1).max(120),
  color: color.default('#EE3E43'),
  scriptUrl: httpsUrl.optional().nullable(),
  iframeUrl: httpsUrl.optional().nullable(),
  microsites: z.array(slug).max(50).default([]),
  requiresLogin: z.boolean().default(true),
})
export const AiEmbedCreate = AiEmbedInput.extend({ key: embedKey })
export type AiEmbedInput = z.infer<typeof AiEmbedInput>

export const AdminAiEmbed = AiEmbed.extend({ microsites: z.array(z.string()) }).strict()
export const AdminAiEmbedsPage = paginated(AdminAiEmbed)
export const AdminAiQuery = pagination.extend({ kind: AiEmbedKind.optional() })
export const EmbedKeyParam = z.object({ key: embedKey })
