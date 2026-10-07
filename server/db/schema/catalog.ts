import { i18n, id, timestamps, tstz } from '@server/db/columns'
import { users } from '@server/db/schema/identity'
import { microsites } from '@server/db/schema/microsites'
import { sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

/**
 * Catalogue core shared by every module: courses (with card fields), microsite course lists,
 * enrolments with progress, certificates and the points ledger. The learning module owns the
 * course content (modules → units → blocks) and the rules that move these rows.
 */

export const courses = pgTable(
  'courses',
  {
    id: id(),
    slug: text('slug').notNull(),
    title: i18n('title').notNull(),
    description: i18n('description').default({ en: '', ar: '' }).notNull(),
    overview: i18n('overview').default({ en: '', ar: '' }).notNull(),
    imageUrl: text('image_url').default('').notNull(),
    categories: jsonb('categories').$type<string[]>().default([]).notNull(),
    level: text('level').default('beginner').notNull(),
    durationMin: integer('duration_min').default(0).notNull(),
    status: text('status').default('draft').notNull(), // draft | published | archived
    sequential: boolean('sequential').default(true).notNull(),
    certificateEnabled: boolean('certificate_enabled').default(true).notNull(),
    /** Completion by approved external certificate upload (Nibras). */
    externalCertificate: boolean('external_certificate').default(false).notNull(),
    comingSoon: boolean('coming_soon').default(false).notNull(),
    isCertProgramme: boolean('is_cert_programme').default(false).notNull(),
    /** Points per course (P58): unit, module, course, assessmentPass. */
    pointsConfig: jsonb('points_config')
      .$type<{ unit: number; module: number; course: number; assessmentPass: number }>()
      .default({ unit: 10, module: 0, course: 50, assessmentPass: 20 })
      .notNull(),
    legacyId: text('legacy_id'),
    publishedAt: tstz('published_at'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('courses_slug_uq').on(t.slug),
    index('courses_title_search_idx').using(
      'gin',
      sql`to_tsvector('simple', (${t.title}->>'en') || ' ' || (${t.title}->>'ar'))`,
    ),
  ],
)

export const micrositeCourses = pgTable(
  'microsite_courses',
  {
    id: id(),
    micrositeId: uuid('microsite_id')
      .notNull()
      .references(() => microsites.id),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id),
    isMandatory: boolean('is_mandatory').default(false).notNull(),
    /** Nibras tracks etc. */
    track: text('track'),
    sortOrder: integer('sort_order').default(0).notNull(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('microsite_courses_uq').on(t.micrositeId, t.courseId),
    index('microsite_courses_course_idx').on(t.courseId),
  ],
)

export const enrolments = pgTable(
  'enrolments',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id),
    progressPct: real('progress_pct').default(0).notNull(),
    /** not_started · in_progress · completed */
    state: text('state').default('not_started').notNull(),
    nextUnitId: uuid('next_unit_id'),
    enrolledAt: tstz('enrolled_at').defaultNow().notNull(),
    startedAt: tstz('started_at'),
    completedAt: tstz('completed_at'),
    lastActivityAt: tstz('last_activity_at'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('enrolments_user_course_uq').on(t.userId, t.courseId),
    index('enrolments_course_idx').on(t.courseId),
  ],
)

export const courseCertificates = pgTable(
  'course_certificates',
  {
    id: id(),
    enrolmentId: uuid('enrolment_id')
      .notNull()
      .references(() => enrolments.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id),
    serial: text('serial').notNull(),
    /** Name printed at issue time; cleared on anonymisation (§9.7). */
    learnerName: text('learner_name').notNull(),
    pdfKey: text('pdf_key'),
    issuedAt: tstz('issued_at').defaultNow().notNull(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('course_certificates_enrolment_uq').on(t.enrolmentId),
    uniqueIndex('course_certificates_serial_uq').on(t.serial),
    index('course_certificates_user_idx').on(t.userId),
  ],
)

/**
 * Every point a learner earns. Idempotent per (user, source_type, source_id).
 * `course_id` lets the leaderboard count only points earned in a microsite's courses.
 */
export const pointsLedger = pgTable(
  'learning_points_ledger',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    courseId: uuid('course_id').references(() => courses.id),
    /** unit · module · course · assessment · manual · badge */
    sourceType: text('source_type').notNull(),
    sourceId: text('source_id').notNull(),
    points: integer('points').notNull(),
    reason: i18n('reason').notNull(),
    actorId: uuid('actor_id').references(() => users.id),
    at: tstz('at').defaultNow().notNull(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('points_ledger_source_uq').on(t.userId, t.sourceType, t.sourceId),
    index('points_ledger_user_idx').on(t.userId, t.at),
    index('points_ledger_course_idx').on(t.courseId),
  ],
)
