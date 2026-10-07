import { z } from 'zod'
import { BOOKING_STATUSES } from '../enums'
import {
  CourseCard,
  I18n,
  isoDate,
  isoDateTime,
  MentorCard,
  MicrositeRef,
  paginated,
  pagination,
  slug,
  uuid,
} from './common'

/**
 * Mentoring DTOs (API-CONTRACT P17–P22, P30, P31, P48, P52 `mentors`). Request schemas strip
 * unknown keys; response schemas are strict. Mentors never receive a mentee's e-mail or phone.
 */

/** SEED §3 — the real list of mentor categories. */
export const MENTOR_CATEGORIES = [
  'Strategy and Planning',
  'Culture and Heritage',
  'Museums and Curation',
  'Marketing and Communications',
  'People and Performance',
  'Finance and Revenue',
  'Visitor Experience and Events',
  'Libraries and Publishing',
  'Tourism and International Operations',
  'Legal and Governance',
  'Sustainability',
  'Business Excellence and Quality',
  'Youth and Community Engagement',
  'Research',
] as const

export const MENTOR_KINDS = ['mentor', 'trainer'] as const
export const MENTOR_STATUSES = ['active', 'inactive'] as const
export const LOBBY_STATES = ['early', 'ready', 'waiting', 'closed', 'cancelled'] as const

const category = z.enum(MENTOR_CATEGORIES)
const growField = z.string().trim().min(1).max(2000)
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$|^24:00$/, 'Use HH:MM')
const optionalHttps = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => v === '' || /^https:\/\/[^\s]+$/.test(v), 'Use an https:// link')

/* ------------------------------------------------------------------ shared response pieces */

export const MentorCardWithCourses = MentorCard.extend({
  courseIds: z.array(z.string()).optional(),
}).strict()

export const MentorsTabQuery = pagination.extend({
  q: z.string().trim().max(120).optional(),
  category: z.string().max(120).optional(),
  kind: z.enum(MENTOR_KINDS).optional(),
})
export const MentorsTabResponse = z.strictObject({
  categories: z.array(z.string()),
  items: paginated(MentorCardWithCourses),
})

export const MentorParams = z.object({ mentorId: uuid })
export const BookingParams = z.object({ id: uuid })
export const MicrositeMentoringParams = z.object({ p: slug })

export const AvailabilitySummary = z.strictObject({
  timezone: z.string(),
  rules: z.array(
    z.strictObject({ weekday: z.number().int(), startTime: z.string(), endTime: z.string() }),
  ),
})

export const MentorDetail = MentorCard.extend({
  bio: I18n,
  linkedinUrl: z.string(),
  courses: z.array(CourseCard),
  availabilitySummary: AvailabilitySummary,
}).strict()

/* ------------------------------------------------------------------ registration & match */

export const RegistrationState = z.strictObject({
  formId: z.string(),
  complete: z.boolean(),
  answers: z.record(z.string(), z.unknown()).optional(),
})
export const RegistrationInput = z.object({
  answers: z.record(z.string(), z.unknown()),
})
export const RegistrationDone = z.strictObject({ complete: z.literal(true) })

export const MatchSuggestion = MentorCard.extend({
  matchScore: z.number(),
  reasons: z.array(I18n),
}).strict()
export const MatchResponse = z.strictObject({
  source: z.enum(['ai', 'rules']),
  suggestions: z.array(MatchSuggestion),
})
export const ChooseInput = z.object({ mentorId: uuid })
export const ChooseResponse = z.strictObject({ matchedMentor: MentorCard })

/* ------------------------------------------------------------------ slots & bookings */

export const SlotsQuery = z
  .object({ from: isoDateTime.optional(), to: isoDateTime.optional() })
  .refine((v) => !v.from || !v.to || new Date(v.from) < new Date(v.to), {
    message: 'from must be before to',
    path: ['to'],
  })
  .refine(
    (v) =>
      !v.from || !v.to || new Date(v.to).getTime() - new Date(v.from).getTime() <= 31 * 86_400_000,
    { message: 'At most 31 days', path: ['to'] },
  )
export const Slot = z.strictObject({ startsAt: z.string(), endsAt: z.string() })
export const SlotsResponse = z.strictObject({ slots: z.array(Slot) })

export const BookingInput = z.object({
  mentorId: uuid,
  startsAt: isoDateTime,
  topic: z.string().trim().max(240).optional(),
})
export const BookingCreated = z.strictObject({
  bookingId: z.string(),
  status: z.enum(BOOKING_STATUSES),
})

export const MyBookingsQuery = pagination.extend({ status: z.enum(BOOKING_STATUSES).optional() })
export const MyBooking = z.strictObject({
  id: z.string(),
  mentor: MentorCard,
  startsAt: z.string(),
  endsAt: z.string(),
  status: z.enum(BOOKING_STATUSES),
  joinUrl: z.string().optional(),
  feedbackGiven: z.boolean(),
})
export const MyBookingsPage = paginated(MyBooking)

export const CancelInput = z.object({ reason: z.string().trim().max(1000).optional() })
export const BookingStatusResponse = z.strictObject({
  bookingId: z.string(),
  status: z.enum(BOOKING_STATUSES),
})

export const SessionState = z.strictObject({
  status: z.enum(BOOKING_STATUSES),
  joinUrl: z.string().optional(),
  startsAt: z.string(),
  canJoinFrom: z.string(),
  lobbyState: z.enum(LOBBY_STATES),
})
export const SessionToken = z.strictObject({
  sdkKey: z.string(),
  signature: z.string(),
  sessionName: z.string(),
  userName: z.string(),
  expiresAt: z.string(),
})

export const MenteeFeedbackInput = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
  attendance: z.enum(['attended', 'mentor_absent', 'i_missed']),
})
export const MentorFeedbackInput = z.object({
  rating: z.number().int().min(1).max(5),
  attendance: z.enum(['attended', 'no_show']),
  note: z.string().trim().max(1000).optional(),
})
export const CreatedId = z.strictObject({ id: z.string() })
export const Ok = z.strictObject({ ok: z.literal(true) })

/* ------------------------------------------------------------------ GROW logs */

export const GrowLog = z.strictObject({
  id: z.string(),
  bookingId: z.string(),
  menteeName: z.string(),
  sessionNo: z.number().int(),
  sessionDate: z.string(),
  goal: z.string(),
  reality: z.string(),
  options: z.string(),
  wayForward: z.string(),
  createdAt: z.string(),
})
export const GrowLogsPage = paginated(GrowLog)
export const GrowLogsQuery = pagination.extend({ menteeId: uuid.optional() })
export const GrowLogInput = z.object({
  bookingId: uuid,
  sessionNo: z.number().int().min(1).max(100),
  sessionDate: isoDate,
  goal: growField,
  reality: growField,
  options: growField,
  wayForward: growField,
})

/* ------------------------------------------------------------------ P30 mentor */

const MenteeRef = z.strictObject({ userId: z.string(), name: z.string() })

export const MentorDashboard = z.strictObject({
  me: MentorCard.extend({ microsites: z.array(MicrositeRef) }).strict(),
  kpis: z.strictObject({
    mentees: z.number().int(),
    upcoming: z.number().int(),
    completedSessions: z.number().int(),
    pendingLogs: z.number().int(),
  }),
  mentees: z.array(
    z.strictObject({
      userId: z.string(),
      name: z.string(),
      microsite: MicrositeRef,
      matchedAt: z.string(),
      sessionsDone: z.number().int(),
      lastSessionAt: z.string().optional(),
      logsPending: z.number().int(),
    }),
  ),
  upcoming: z.array(
    z.strictObject({
      bookingId: z.string(),
      mentee: MenteeRef,
      startsAt: z.string(),
      endsAt: z.string(),
      joinUrl: z.string().optional(),
    }),
  ),
  past: z.array(
    z.strictObject({
      bookingId: z.string(),
      mentee: MenteeRef,
      startsAt: z.string(),
      status: z.enum(BOOKING_STATUSES),
      feedback: z.strictObject({ rating: z.number().int() }).optional(),
      growLogId: z.string().optional(),
    }),
  ),
  applications: z.array(
    z.strictObject({
      id: z.string(),
      mentee: MenteeRef,
      submittedAt: z.string(),
      answers: z.record(z.string(), z.unknown()),
    }),
  ),
})

export const MentorProfile = z.strictObject({
  title: z.string(),
  bio: I18n,
  categories: z.array(z.string()),
  linkedinUrl: z.string(),
  photo: z.string(),
})
export const MentorProfileInput = z.object({
  title: z.string().trim().min(1).max(160),
  bio: z.object({ en: z.string().max(2000), ar: z.string().max(2000) }),
  categories: z.array(category).max(14),
  linkedinUrl: optionalHttps.default(''),
  /** Uploaded file id (`POST /api/files`), an https URL, or '' to clear. Omit to keep. */
  photo: z
    .string()
    .trim()
    .max(2048)
    .refine(
      (v) => v === '' || /^[0-9a-f-]{36}$/i.test(v) || /^https:\/\/[^\s]+$/.test(v),
      'Use an uploaded file id or an https:// link',
    )
    .optional(),
})

export const AcceptResponse = z.strictObject({ matchId: z.string() })
export const DeclineInput = z.object({ reason: z.string().trim().max(1000).optional() })

/* ------------------------------------------------------------------ P31 availability */

export const Availability = z.strictObject({
  rules: z.array(
    z.strictObject({
      id: z.string(),
      weekday: z.number().int(),
      startTime: z.string(),
      endTime: z.string(),
      timezone: z.string(),
    }),
  ),
  timeOff: z.array(z.strictObject({ from: z.string(), to: z.string() })),
  slotMinutes: z.literal(60),
})
export const AvailabilityInput = z.object({
  timezone: z
    .string()
    .max(64)
    .refine((tz) => {
      try {
        new Intl.DateTimeFormat('en-US', { timeZone: tz })
        return true
      } catch {
        return false
      }
    }, 'Unknown time zone'),
  rules: z
    .array(
      z
        .object({ weekday: z.number().int().min(0).max(6), startTime: hhmm, endTime: hhmm })
        .refine((r) => r.startTime < r.endTime, {
          message: 'End must be after start',
          path: ['endTime'],
        }),
    )
    .max(50),
  timeOff: z
    .array(
      z
        .object({ from: isoDateTime, to: isoDateTime })
        .refine((t) => new Date(t.from) < new Date(t.to), {
          message: 'to must be after from',
          path: ['to'],
        }),
    )
    .max(100)
    .default([]),
})
export const MentorBookingsQuery = z.object({
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
})
export const MentorBookingsList = z.array(
  z.strictObject({
    bookingId: z.string(),
    mentee: MenteeRef,
    startsAt: z.string(),
    status: z.enum(BOOKING_STATUSES),
  }),
)

/* ------------------------------------------------------------------ P48 admin mentor pool */

export const AdminMentorsQuery = pagination.extend({
  q: z.string().trim().max(120).optional(),
  microsite: slug.optional(),
  status: z.enum(MENTOR_STATUSES).optional(),
})
export const AdminMentorRow = MentorCard.extend({
  email: z.string(),
  status: z.enum(MENTOR_STATUSES),
  kind: z.enum(MENTOR_KINDS),
  courseIds: z.array(z.string()),
  mentees: z.number().int(),
  sessions: z.number().int(),
}).strict()
export const AdminMentorsPage = paginated(AdminMentorRow)
export const MentorInviteInput = z.object({
  emails: z.array(z.string().max(254)).min(1).max(100),
  microsites: z.array(slug).min(1).max(20),
  categories: z.array(category).max(14).optional(),
})
export const MentorInviteResult = z.strictObject({
  created: z.number().int(),
  skipped: z.array(z.strictObject({ email: z.string(), reason: z.string() })),
})
export const AdminMentorUpdate = z.object({
  microsites: z.array(slug).max(20),
  categories: z.array(category).max(14),
  courseIds: z.array(uuid).max(50),
  bookingEnabled: z.boolean(),
  kind: z.enum(MENTOR_KINDS),
  status: z.enum(MENTOR_STATUSES),
})
export const AdminMentorParams = z.object({ id: uuid })
export const AdminMentorMentees = z.array(
  z.strictObject({
    user: z.strictObject({ id: z.string(), name: z.string(), email: z.string() }),
    microsite: z.string(),
    matchedAt: z.string(),
    sessions: z.number().int(),
    lastLogAt: z.string().optional(),
  }),
)

/* ------------------------------------------------------------------ dashboard / user detail */

export const MentoringDashboardSection = z.strictObject({
  enabled: z.boolean(),
  registrationComplete: z.boolean(),
  matchedMentor: MentorCard.optional(),
  nextSession: z
    .strictObject({ bookingId: z.string(), startsAt: z.string(), joinUrl: z.string().optional() })
    .optional(),
})
