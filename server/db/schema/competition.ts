import { i18n, id, timestamps, tstz } from '@server/db/columns'
import { courses } from '@server/db/schema/catalog'
import { invitations, users } from '@server/db/schema/identity'
import { microsites } from '@server/db/schema/microsites'
import { sql } from 'drizzle-orm'
import { index, integer, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

/**
 * Competition (P28/P29, P33/P34, P41–P44). A round belongs to one microsite and one course; the
 * learner's submission is the action plan (pitch block) of that course, read through the
 * ActionPlanReader seam. Judges are a per-microsite roster; scores are one row per
 * (judge, submission, criterion) and totals are computed on read (contract §9.4).
 */

export const competitionRounds = pgTable(
  'competition_rounds',
  {
    id: id(),
    micrositeId: uuid('microsite_id')
      .notNull()
      .references(() => microsites.id),
    name: i18n('name').notNull(),
    description: i18n('description').default({ en: '', ar: '' }).notNull(),
    /** draft · open · judging · closed (contract §9.1) */
    status: text('status').default('draft').notNull(),
    opensAt: tstz('opens_at').notNull(),
    closesAt: tstz('closes_at').notNull(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id),
    eligibilityMinProgressPct: integer('eligibility_min_progress_pct').default(80).notNull(),
    /** Optimistic concurrency for the rubric (P43 ifMatch). */
    rubricUpdatedAt: tstz('rubric_updated_at').defaultNow().notNull(),
    openedAt: tstz('opened_at'),
    judgingAt: tstz('judging_at'),
    closedAt: tstz('closed_at'),
    ...timestamps(),
  },
  (t) => [
    index('competition_rounds_microsite_idx').on(t.micrositeId),
    index('competition_rounds_course_idx').on(t.courseId),
    // One open round per microsite (contract §9.2).
    uniqueIndex('competition_rounds_one_open_uq')
      .on(t.micrositeId)
      .where(sql`${t.status} = 'open'`),
  ],
)

export const competitionCriteria = pgTable(
  'competition_criteria',
  {
    id: id(),
    roundId: uuid('round_id')
      .notNull()
      .references(() => competitionRounds.id),
    question: i18n('question').notNull(),
    weightPct: integer('weight_pct').notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    ...timestamps(),
  },
  (t) => [index('competition_criteria_round_idx').on(t.roundId)],
)

/**
 * Judges of a microsite. A row is created when a judge is invited for the microsite (pending:
 * `user_id` null) and completed when the invitation is accepted.
 */
export const competitionJudges = pgTable(
  'competition_judges',
  {
    id: id(),
    micrositeId: uuid('microsite_id')
      .notNull()
      .references(() => microsites.id),
    userId: uuid('user_id').references(() => users.id),
    invitationId: uuid('invitation_id').references(() => invitations.id),
    email: text('email').notNull(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('competition_judges_microsite_email_uq').on(t.micrositeId, t.email),
    index('competition_judges_user_idx').on(t.userId),
    index('competition_judges_invitation_idx').on(t.invitationId),
  ],
)

export const competitionSubmissions = pgTable(
  'competition_submissions',
  {
    id: id(),
    roundId: uuid('round_id')
      .notNull()
      .references(() => competitionRounds.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    /** not_started · in_progress · submitted · scored */
    status: text('status').default('not_started').notNull(),
    /** The action-plan block that holds the pitch (from the ActionPlanReader). */
    blockId: uuid('block_id'),
    submittedAt: tstz('submitted_at'),
    scoredAt: tstz('scored_at'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('competition_submissions_round_user_uq').on(t.roundId, t.userId),
    index('competition_submissions_user_idx').on(t.userId),
  ],
)

export const competitionAssignments = pgTable(
  'competition_assignments',
  {
    id: id(),
    submissionId: uuid('submission_id')
      .notNull()
      .references(() => competitionSubmissions.id),
    judgeId: uuid('judge_id')
      .notNull()
      .references(() => competitionJudges.id),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('competition_assignments_uq').on(t.submissionId, t.judgeId),
    index('competition_assignments_judge_idx').on(t.judgeId),
  ],
)

export const competitionScores = pgTable(
  'competition_scores',
  {
    id: id(),
    /** The judge's user id. */
    judgeId: uuid('judge_id')
      .notNull()
      .references(() => users.id),
    submissionId: uuid('submission_id')
      .notNull()
      .references(() => competitionSubmissions.id),
    criterionId: uuid('criterion_id')
      .notNull()
      .references(() => competitionCriteria.id),
    score: integer('score').notNull(),
    feedback: text('feedback'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('competition_scores_uq').on(t.judgeId, t.submissionId, t.criterionId),
    index('competition_scores_submission_idx').on(t.submissionId),
    index('competition_scores_criterion_idx').on(t.criterionId),
  ],
)

export type CompetitionRound = typeof competitionRounds.$inferSelect
export type CompetitionCriterion = typeof competitionCriteria.$inferSelect
export type CompetitionSubmission = typeof competitionSubmissions.$inferSelect
