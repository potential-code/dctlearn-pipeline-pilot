import { i18n, id, timestamps, tstz } from '@server/db/columns'
import { forms } from '@server/db/schema/forms'
import { users } from '@server/db/schema/identity'
import { microsites } from '@server/db/schema/microsites'
import { sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

/**
 * Mentoring (P17–P22, P30, P31, P48). Availability is stored as weekly rules in the mentor's
 * time zone; slots are generated on read in UTC (contract §9.8) minus bookings and time off.
 * A booking's slot is protected by the partial unique index on `(mentor_id, starts_at)` for
 * every booking that is not cancelled (§9.2, §9.4).
 */

/** One profile per mentor (or trainer) account. Created when a mentor invitation is accepted. */
export const mentorProfiles = pgTable(
  'mentor_profiles',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    title: text('title').default('').notNull(),
    bio: i18n('bio').default({ en: '', ar: '' }).notNull(),
    categories: jsonb('categories').$type<string[]>().default([]).notNull(),
    /** Languages the mentor runs sessions in (`en`, `ar`) — used by the matcher. */
    languages: jsonb('languages').$type<string[]>().default(['en', 'ar']).notNull(),
    linkedinUrl: text('linkedin_url').default('').notNull(),
    /** Stored file id or a public path. */
    photo: text('photo').default('').notNull(),
    /** mentor · trainer (MuseoPro: browse only, linked to courses). */
    kind: text('kind').default('mentor').notNull(),
    courseIds: jsonb('course_ids').$type<string[]>().default([]).notNull(),
    bookingEnabled: boolean('booking_enabled').default(true).notNull(),
    /** Slots come from availability, so new bookings are confirmed at once (contract §9.1). */
    autoConfirm: boolean('auto_confirm').default(true).notNull(),
    /** active · inactive (admin P48). Inactive mentors are hidden from learners. */
    status: text('status').default('active').notNull(),
    timezone: text('timezone').default('Asia/Dubai').notNull(),
    ...timestamps(),
  },
  (t) => [uniqueIndex('mentor_profiles_user_uq').on(t.userId)],
)

export const mentorMicrosites = pgTable(
  'mentor_microsites',
  {
    mentorId: uuid('mentor_id')
      .notNull()
      .references(() => mentorProfiles.id),
    micrositeId: uuid('microsite_id')
      .notNull()
      .references(() => microsites.id),
    ...timestamps(),
  },
  (t) => [
    primaryKey({ columns: [t.mentorId, t.micrositeId] }),
    index('mentor_microsites_microsite_idx').on(t.micrositeId),
  ],
)

/** Weekly rules, wall-clock `HH:MM` in the mentor's time zone (profile.timezone). */
export const mentorAvailabilityRules = pgTable(
  'mentor_availability_rules',
  {
    id: id(),
    mentorId: uuid('mentor_id')
      .notNull()
      .references(() => mentorProfiles.id),
    weekday: integer('weekday').notNull(),
    startTime: text('start_time').notNull(),
    endTime: text('end_time').notNull(),
    ...timestamps(),
  },
  (t) => [index('mentor_availability_rules_mentor_idx').on(t.mentorId)],
)

export const mentorTimeOff = pgTable(
  'mentor_time_off',
  {
    id: id(),
    mentorId: uuid('mentor_id')
      .notNull()
      .references(() => mentorProfiles.id),
    startsAt: tstz('starts_at').notNull(),
    endsAt: tstz('ends_at').notNull(),
    ...timestamps(),
  },
  (t) => [index('mentor_time_off_mentor_idx').on(t.mentorId)],
)

/** Per-microsite mentoring settings: which `registration` form mentees fill in. */
export const mentoringSettings = pgTable('mentoring_settings', {
  micrositeId: uuid('microsite_id')
    .primaryKey()
    .references(() => microsites.id),
  registrationFormId: uuid('registration_form_id').references(() => forms.id),
  ...timestamps(),
})

/** Mentee asks a chosen mentor (P22 choose → P30 applications). */
export const menteeApplications = pgTable(
  'mentee_applications',
  {
    id: id(),
    menteeId: uuid('mentee_id')
      .notNull()
      .references(() => users.id),
    mentorId: uuid('mentor_id')
      .notNull()
      .references(() => mentorProfiles.id),
    micrositeId: uuid('microsite_id')
      .notNull()
      .references(() => microsites.id),
    /** pending · accepted · declined */
    status: text('status').default('pending').notNull(),
    answers: jsonb('answers').$type<Record<string, unknown>>().default({}).notNull(),
    matchScore: real('match_score'),
    source: text('source').default('rules').notNull(),
    reason: text('reason'),
    decidedAt: tstz('decided_at'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('mentee_applications_pending_uq')
      .on(t.menteeId, t.micrositeId)
      .where(sql`${t.status} = 'pending'`),
    index('mentee_applications_mentor_idx').on(t.mentorId),
    index('mentee_applications_microsite_idx').on(t.micrositeId),
  ],
)

/** The mentor–mentee lock: one active match per mentee and microsite. */
export const mentorMatches = pgTable(
  'mentor_matches',
  {
    id: id(),
    menteeId: uuid('mentee_id')
      .notNull()
      .references(() => users.id),
    mentorId: uuid('mentor_id')
      .notNull()
      .references(() => mentorProfiles.id),
    micrositeId: uuid('microsite_id')
      .notNull()
      .references(() => microsites.id),
    applicationId: uuid('application_id').references(() => menteeApplications.id),
    /** active · released */
    status: text('status').default('active').notNull(),
    source: text('source').default('rules').notNull(),
    matchScore: real('match_score'),
    matchedAt: tstz('matched_at').defaultNow().notNull(),
    releasedAt: tstz('released_at'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('mentor_matches_active_uq')
      .on(t.menteeId, t.micrositeId)
      .where(sql`${t.status} = 'active'`),
    index('mentor_matches_mentor_idx').on(t.mentorId),
    index('mentor_matches_microsite_idx').on(t.micrositeId),
  ],
)

export const mentorBookings = pgTable(
  'mentor_bookings',
  {
    id: id(),
    mentorId: uuid('mentor_id')
      .notNull()
      .references(() => mentorProfiles.id),
    menteeId: uuid('mentee_id')
      .notNull()
      .references(() => users.id),
    micrositeId: uuid('microsite_id')
      .notNull()
      .references(() => microsites.id),
    startsAt: tstz('starts_at').notNull(),
    endsAt: tstz('ends_at').notNull(),
    /** requested · confirmed · completed · cancelled · no_show */
    status: text('status').default('requested').notNull(),
    topic: text('topic'),
    confirmedAt: tstz('confirmed_at'),
    completedAt: tstz('completed_at'),
    cancelledAt: tstz('cancelled_at'),
    cancelledById: uuid('cancelled_by_id').references(() => users.id),
    cancelReason: text('cancel_reason'),
    /** Attendance from the Zoom webhook. */
    mentorJoinedAt: tstz('mentor_joined_at'),
    menteeJoinedAt: tstz('mentee_joined_at'),
    reminder24hSentAt: tstz('reminder_24h_sent_at'),
    reminder1hSentAt: tstz('reminder_1h_sent_at'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('mentor_bookings_slot_uq')
      .on(t.mentorId, t.startsAt)
      .where(sql`${t.status} <> 'cancelled'`),
    index('mentor_bookings_mentor_starts_idx').on(t.mentorId, t.startsAt),
    index('mentor_bookings_mentee_idx').on(t.menteeId),
    index('mentor_bookings_microsite_idx').on(t.micrositeId),
  ],
)

/** One feedback per side (mentee / mentor) per booking. */
export const bookingFeedback = pgTable(
  'booking_feedback',
  {
    id: id(),
    bookingId: uuid('booking_id')
      .notNull()
      .references(() => mentorBookings.id),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id),
    /** mentee · mentor */
    side: text('side').notNull(),
    rating: integer('rating').notNull(),
    /** mentee: attended · mentor_absent · i_missed — mentor: attended · no_show */
    attendance: text('attendance').notNull(),
    comment: text('comment'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('booking_feedback_side_uq').on(t.bookingId, t.side),
    index('booking_feedback_author_idx').on(t.authorId),
  ],
)

/** GROW logs: immutable, one per booking (§9.2). */
export const growLogs = pgTable(
  'grow_logs',
  {
    id: id(),
    bookingId: uuid('booking_id')
      .notNull()
      .references(() => mentorBookings.id),
    mentorId: uuid('mentor_id')
      .notNull()
      .references(() => mentorProfiles.id),
    menteeId: uuid('mentee_id')
      .notNull()
      .references(() => users.id),
    sessionNo: integer('session_no').notNull(),
    sessionDate: text('session_date').notNull(),
    goal: text('goal').notNull(),
    reality: text('reality').notNull(),
    options: text('options').notNull(),
    wayForward: text('way_forward').notNull(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('grow_logs_booking_uq').on(t.bookingId),
    index('grow_logs_mentor_idx').on(t.mentorId),
    index('grow_logs_mentee_idx').on(t.menteeId),
  ],
)

export type MentorProfile = typeof mentorProfiles.$inferSelect
export type MentorBooking = typeof mentorBookings.$inferSelect
