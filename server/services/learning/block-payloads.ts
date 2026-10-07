import { randomUUID } from 'node:crypto'
import { validationFailed, zodFields } from '@server/lib/errors'
import { sanitizeI18nRich } from '@server/lib/sanitize'
import type { BLOCK_TYPES } from '@shared/enums'
import { BlockPayloadInput } from '@shared/schemas/learning'

export type BlockType = (typeof BLOCK_TYPES)[number]

/**
 * Stored block payloads. The editor sends `BlockPayloadInput[type]`; rich text (`html`,
 * `transcript`) is sanitised on save (contract P59 **Sanitise**), survey questions/options get
 * stable ids so answers can refer to them.
 */
export function parseBlockPayload(type: BlockType, raw: unknown): Record<string, unknown> {
  const parsed = BlockPayloadInput[type].safeParse(raw ?? {})
  if (!parsed.success) {
    const fields = zodFields(parsed.error.issues)
    throw validationFailed(
      Object.fromEntries(Object.entries(fields).map(([k, v]) => [`payload.${k}`, v])),
    )
  }
  const p = parsed.data as Record<string, unknown>
  switch (type) {
    case 'text':
    case 'case_study':
      return { html: sanitizeI18nRich(p.html as { en: string; ar: string }) }
    case 'audio':
      return p.transcript
        ? { ...p, transcript: sanitizeI18nRich(p.transcript as { en: string; ar: string }) }
        : p
    case 'survey': {
      const questions = (p.questions as SurveyQuestion[]).map((q) => ({
        ...q,
        id: q.id ?? randomUUID(),
        ...(q.options
          ? { options: q.options.map((o) => ({ ...o, id: o.id ?? randomUUID() })) }
          : {}),
      }))
      return { questions }
    }
    default:
      return p
  }
}

type SurveyQuestion = {
  id?: string
  text: { en: string; ar: string }
  type: string
  options?: { id?: string; text: { en: string; ar: string } }[]
}

/**
 * P60 translations of block payloads: the `{ en, ar }` values per type, as JSON paths inside
 * `course_blocks.payload` (`[]` = every array item). Registered with the translatable registry
 * as the `payload` field of entity `block`; the i18n area walks these paths. `html` and
 * `transcript` are rich text (sanitised on save).
 */
export const BLOCK_I18N_PATHS: Record<BlockType, string[]> = {
  text: ['html'],
  case_study: ['html'],
  image: ['caption', 'alt'],
  video: ['title'],
  youtube: ['title'],
  youtube_playlist: [],
  scorm: [],
  audio: ['title', 'transcript'],
  quotes: ['items[].text'],
  resources: ['items[].title'],
  related_courses: [],
  action_plan: ['title', 'questions[].text'],
  survey: ['questions[].text', 'questions[].options[].text'],
}
export const BLOCK_RICH_PATHS = ['html', 'transcript']
