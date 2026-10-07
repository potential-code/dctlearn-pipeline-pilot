import { z } from 'zod'
import { EVENT_STATUSES } from '../enums'
import {
  httpsUrl,
  I18n,
  i18nRich,
  i18nTitle,
  ifMatch,
  isoDateTime,
  MicrositeRef,
  paginated,
  pagination,
  shortText,
  slug,
  UserDto,
} from './common'

/** P57 events & workshops (admin), P52 workshops tab, P14 events section. */

export const EventStatus = z.enum(EVENT_STATUSES)

const optionalHttps = httpsUrl.optional().nullable()

export const EventInput = z
  .object({
    title: i18nTitle,
    description: i18nRich.default({ en: '', ar: '' }),
    category: z.string().trim().max(80).default(''),
    venue: shortText.trim().optional().nullable(),
    startsAt: isoDateTime,
    endsAt: isoDateTime,
    timezone: z.string().trim().min(1).max(64).default('Asia/Dubai'),
    zoomUrl: optionalHttps,
    recordingUrl: optionalHttps,
    imageUrl: optionalHttps,
    /** `micrositeId` is the microsite's public id (slug), as in MicrositeRef. */
    audiences: z
      .array(z.object({ micrositeId: slug }))
      .min(1)
      .max(50),
  })
  .extend(ifMatch.shape)
  .refine((v) => new Date(v.endsAt).getTime() > new Date(v.startsAt).getTime(), {
    path: ['endsAt'],
    message: 'Must be after the start',
  })
  .refine(
    (v) => {
      try {
        new Intl.DateTimeFormat('en', { timeZone: v.timezone })
        return true
      } catch {
        return false
      }
    },
    { path: ['timezone'], message: 'Unknown time zone' },
  )
export type EventInput = z.infer<typeof EventInput>

export const CancelEventInput = z.object({ reason: z.string().trim().min(1).max(1000) })
export const RecordingInput = z.object({ url: httpsUrl, publish: z.boolean() })

export const AdminEventsQuery = pagination.extend({
  status: EventStatus.optional(),
  q: z.string().max(100).optional(),
})

export const AdminEvent = z.strictObject({
  id: z.string(),
  title: I18n,
  description: I18n,
  category: z.string(),
  venue: z.string().optional(),
  startsAt: z.string(),
  endsAt: z.string(),
  timezone: z.string(),
  zoomUrl: z.string().optional(),
  recordingUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  status: EventStatus,
  audiences: z.array(z.strictObject({ micrositeId: z.string() })),
})
export const AdminEventsPage = paginated(AdminEvent)

export const ParticipantsPage = paginated(UserDto.extend({ microsite: MicrositeRef }).strict())

/* learner */

export const WorkshopsQuery = pagination.extend({
  when: z.enum(['upcoming', 'past']).default('upcoming'),
})
export const WorkshopItem = z.strictObject({
  id: z.string(),
  title: I18n,
  category: z.string(),
  venue: z.string().optional(),
  startsAt: z.string(),
  endsAt: z.string(),
  status: EventStatus,
  zoomUrl: z.string().optional(),
  recordingUrl: z.string().optional(),
  imageUrl: z.string().optional(),
})
export const WorkshopsPage = paginated(WorkshopItem)

export const DashboardEvent = z.strictObject({
  id: z.string(),
  title: I18n,
  startsAt: z.string(),
  status: EventStatus,
  joinUrl: z.string().optional(),
})
