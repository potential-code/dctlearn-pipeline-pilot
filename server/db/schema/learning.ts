import { deletedAt, i18n, id, timestamps, tstz } from '@server/db/columns'
import { courses } from '@server/db/schema/catalog'
import { files } from '@server/db/schema/files'
import { users } from '@server/db/schema/identity'
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
 * Learning content and learner progress (contract P16 / P59 / §9.5).
 *
 * Content: courses → modules → units → blocks (+ assessments → questions, versioned).
 * Content rows are soft-deleted (`deleted_at`): §9.5 keeps progress rows of removed units/blocks
 * but ignores them, so a hard delete (which would have to cascade) is never used once a course
 * has learners. FK children of a course cascade only for drafts that are hard-deleted.
 */

export const courseModules = pgTable(
  'course_modules',
  {
    id: id(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    title: i18n('title').notNull(),
    order: integer('order').default(0).notNull(),
    deletedAt: deletedAt(),
    ...timestamps(),
  },
  (t) => [index('course_modules_course_idx').on(t.courseId)],
)

export const courseUnits = pgTable(
  'course_units',
  {
    id: id(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    moduleId: uuid('module_id')
      .notNull()
      .references(() => courseModules.id, { onDelete: 'cascade' }),
    title: i18n('title').notNull(),
    order: integer('order').default(0).notNull(),
    durationMin: integer('duration_min'),
    deletedAt: deletedAt(),
    ...timestamps(),
  },
  (t) => [
    index('course_units_course_idx').on(t.courseId),
    index('course_units_module_idx').on(t.moduleId),
  ],
)

/**
 * One content block. `payload` is the stored (admin) shape per `type`; the player turns it into
 * the contract's block payload (signed URLs, learner answers, related course cards).
 */
export const courseBlocks = pgTable(
  'course_blocks',
  {
    id: id(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    unitId: uuid('unit_id')
      .notNull()
      .references(() => courseUnits.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    order: integer('order').default(0).notNull(),
    required: boolean('required').default(true).notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().default({}).notNull(),
    deletedAt: deletedAt(),
    ...timestamps(),
  },
  (t) => [
    index('course_blocks_unit_idx').on(t.unitId),
    index('course_blocks_course_idx').on(t.courseId),
  ],
)

/**
 * Assessments. `version` increases when an assessment that already has attempts is changed
 * (§9.5); questions belong to one version and past attempts keep their score.
 * Attached to a unit (`unit_id`: completing that unit needs a pass when `quiz_blocking`) or to
 * the course as final assessment (`is_final`, no unit).
 */
export const courseAssessments = pgTable(
  'course_assessments',
  {
    id: id(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    moduleId: uuid('module_id').references(() => courseModules.id, { onDelete: 'cascade' }),
    unitId: uuid('unit_id').references(() => courseUnits.id, { onDelete: 'cascade' }),
    title: i18n('title').notNull(),
    /** survey · quiz_blocking · quiz_non_blocking */
    type: text('type').notNull(),
    passMark: integer('pass_mark').default(70).notNull(),
    /** 0 = unlimited. */
    attemptsAllowed: integer('attempts_allowed').default(1).notNull(),
    timeLimitMin: integer('time_limit_min'),
    shuffle: boolean('shuffle').default(false).notNull(),
    isFinal: boolean('is_final').default(false).notNull(),
    version: integer('version').default(1).notNull(),
    deletedAt: deletedAt(),
    ...timestamps(),
  },
  (t) => [
    index('course_assessments_course_idx').on(t.courseId),
    index('course_assessments_unit_idx').on(t.unitId),
    index('course_assessments_module_idx').on(t.moduleId),
  ],
)

export type QuestionOption = { id: string; text: { en: string; ar: string }; correct: boolean }

export const assessmentQuestions = pgTable(
  'assessment_questions',
  {
    id: id(),
    assessmentId: uuid('assessment_id')
      .notNull()
      .references(() => courseAssessments.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    text: i18n('text').notNull(),
    /** multiple_choice · true_false · open_text · sorting */
    type: text('type').notNull(),
    /** Answer key lives here (`correct`; for sorting the stored order is the key). Never sent to learners. */
    options: jsonb('options').$type<QuestionOption[]>().default([]).notNull(),
    points: integer('points').default(1).notNull(),
    order: integer('order').default(0).notNull(),
    ...timestamps(),
  },
  (t) => [index('assessment_questions_assessment_idx').on(t.assessmentId, t.version)],
)

export const assessmentAttempts = pgTable(
  'assessment_attempts',
  {
    id: id(),
    assessmentId: uuid('assessment_id')
      .notNull()
      .references(() => courseAssessments.id),
    version: integer('version').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    answers: jsonb('answers').$type<unknown[]>().default([]).notNull(),
    scorePct: real('score_pct').notNull(),
    passed: boolean('passed').notNull(),
    ...timestamps(),
  },
  (t) => [
    index('assessment_attempts_user_idx').on(t.userId, t.assessmentId),
    index('assessment_attempts_assessment_idx').on(t.assessmentId),
  ],
)

/** One row per completed unit and learner (idempotent completion, §9.4). */
export const unitProgress = pgTable(
  'unit_progress',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id),
    unitId: uuid('unit_id')
      .notNull()
      .references(() => courseUnits.id),
    completedAt: tstz('completed_at').notNull(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('unit_progress_user_unit_uq').on(t.userId, t.unitId),
    index('unit_progress_user_course_idx').on(t.userId, t.courseId),
    index('unit_progress_unit_idx').on(t.unitId),
  ],
)

export const blockProgress = pgTable(
  'block_progress',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id),
    unitId: uuid('unit_id')
      .notNull()
      .references(() => courseUnits.id),
    blockId: uuid('block_id')
      .notNull()
      .references(() => courseBlocks.id),
    completedAt: tstz('completed_at'),
    positionSec: integer('position_sec'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('block_progress_user_block_uq').on(t.userId, t.blockId),
    index('block_progress_user_course_idx').on(t.userId, t.courseId),
    index('block_progress_block_idx').on(t.blockId),
  ],
)

/** Action-plan answers; `locked_at` set by competition submit (409 locked on later saves). */
export const actionPlanAnswers = pgTable(
  'action_plan_answers',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    blockId: uuid('block_id')
      .notNull()
      .references(() => courseBlocks.id),
    answers: jsonb('answers').$type<Record<string, string>>().default({}).notNull(),
    lockedAt: tstz('locked_at'),
    /** Cached PDF (files.id); cleared whenever the answers change. */
    pdfFileId: uuid('pdf_file_id').references(() => files.id),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('action_plan_answers_user_block_uq').on(t.userId, t.blockId),
    index('action_plan_answers_block_idx').on(t.blockId),
  ],
)

export const surveyAnswers = pgTable(
  'survey_block_answers',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    blockId: uuid('block_id')
      .notNull()
      .references(() => courseBlocks.id),
    answers: jsonb('answers').$type<unknown[]>().default([]).notNull(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('survey_block_answers_user_block_uq').on(t.userId, t.blockId),
    index('survey_block_answers_block_idx').on(t.blockId),
  ],
)

export const scormStates = pgTable(
  'scorm_states',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    blockId: uuid('block_id')
      .notNull()
      .references(() => courseBlocks.id),
    cmi: jsonb('cmi').$type<Record<string, unknown>>().default({}).notNull(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('scorm_states_user_block_uq').on(t.userId, t.blockId),
    index('scorm_states_block_idx').on(t.blockId),
  ],
)

/**
 * SCORM packages: id = the uploaded zip's files.id. Unpacked by a job into
 * `scorm/{id}/…` in storage after zip-slip and manifest checks.
 */
export const scormPackages = pgTable('scorm_packages', {
  id: uuid('id')
    .primaryKey()
    .references(() => files.id),
  /** pending · ready · failed */
  status: text('status').default('pending').notNull(),
  version: text('version').default('1.2').notNull(),
  launchPath: text('launch_path').default('').notNull(),
  fileCount: integer('file_count').default(0).notNull(),
  error: text('error'),
  createdById: uuid('created_by_id').references(() => users.id),
  ...timestamps(),
})

/** P59 certificate settings per course. */
export const courseCertificateSettings = pgTable('course_certificate_settings', {
  courseId: uuid('course_id')
    .primaryKey()
    .references(() => courses.id, { onDelete: 'cascade' }),
  backgroundUrl: text('background_url').default('').notNull(),
  logoUrl: text('logo_url').default('').notNull(),
  signatureName: text('signature_name').default('').notNull(),
  signatureTitle: text('signature_title').default('').notNull(),
  signatureImageUrl: text('signature_image_url'),
  ...timestamps(),
})

export type CourseModule = typeof courseModules.$inferSelect
export type CourseUnit = typeof courseUnits.$inferSelect
export type CourseBlock = typeof courseBlocks.$inferSelect
export type CourseAssessment = typeof courseAssessments.$inferSelect
export type AssessmentQuestion = typeof assessmentQuestions.$inferSelect
