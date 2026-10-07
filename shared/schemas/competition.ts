import { z } from 'zod'
import { ROUND_STATUSES, SUBMISSION_STATUSES } from '../enums'
import {
  I18n,
  i18nText,
  i18nTitle,
  isoDateTime,
  MicrositeRef,
  paginated,
  slug,
  uuid,
} from './common'

/**
 * Competition shapes (API-CONTRACT §2 P28/P29, §4 P33/P34, §5 P41–P44). Requests are lenient
 * about unknown keys (stripped); responses are strict.
 */

export const RoundStatus = z.enum(ROUND_STATUSES)
export const SubmissionStatus = z.enum(SUBMISSION_STATUSES)

export const roundParams = z.object({ p: slug, id: uuid })
export const judgeRoundParams = z.object({ roundId: uuid })

/* ------------------------------------------------------------------ learner P28 / P29 */

export const CompetitionView = z.strictObject({
  round: z.strictObject({
    id: z.string(),
    name: I18n,
    status: RoundStatus,
    opensAt: z.string(),
    closesAt: z.string(),
    description: I18n,
  }),
  submission: z.strictObject({
    status: SubmissionStatus,
    courseId: z.string(),
    courseSlug: z.string(),
    submittedAt: z.string().optional(),
  }),
  eligible: z.boolean(),
  eligibilityRule: I18n,
})

export const SubmitResponse = z.strictObject({ status: z.literal('submitted') })

export const CompetitionDashboard = z.strictObject({
  points: z.number(),
  unitsCompleted: z.number().int(),
  unitsTotal: z.number().int(),
  countdown: z.strictObject({ closesAt: z.string() }),
  status: SubmissionStatus,
  score: z.strictObject({ total: z.number(), outOf: z.literal(100) }).optional(),
  rank: z.number().int().optional(),
})

/* ------------------------------------------------------------------ judge P33 / P34 */

export const JudgeDashboard = z.strictObject({
  kpis: z.strictObject({
    assigned: z.number().int(),
    graded: z.number().int(),
    pending: z.number().int(),
  }),
  rounds: z.array(
    z.strictObject({
      roundId: z.string(),
      microsite: MicrositeRef,
      name: I18n,
      status: RoundStatus,
      deadline: z.string(),
      assigned: z.number().int(),
      graded: z.number().int(),
    }),
  ),
})

const Applicant = z.strictObject({ name: z.string(), microsite: MicrositeRef })

export const ApplicantsQuery = z.object({
  status: z.enum(['pending', 'graded']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
export const ApplicantsPage = paginated(
  z.strictObject({
    submissionId: z.string(),
    applicant: Applicant,
    submittedAt: z.string(),
    status: z.enum(['pending', 'graded']),
    myScore: z.number().optional(),
  }),
)

const RubricItem = z.strictObject({
  criterionId: z.string(),
  question: I18n,
  weightPct: z.number().int(),
})
const ScoreItem = z.strictObject({
  criterionId: z.string(),
  score: z.number().int(),
  feedback: z.string().optional(),
})

export const JudgeSubmission = z.strictObject({
  applicant: Applicant,
  pitch: z.strictObject({
    /** Omitted when no PDF of the answers exists yet. */
    pdfUrl: z.string().optional(),
    answers: z.array(z.strictObject({ question: I18n, answer: z.string() })),
  }),
  rubric: z.array(RubricItem),
  myScores: z.array(ScoreItem).optional(),
})

export const ScoresInput = z.object({
  scores: z
    .array(
      z.object({
        criterionId: uuid,
        score: z.number().int().min(1).max(10),
        feedback: z.string().max(1000).optional(),
      }),
    )
    .min(1)
    .max(50),
})
export const ScoresResult = z.strictObject({ weightedTotal: z.number() })

/* ------------------------------------------------------------------ sub admin P41–P44 */

export const RoundDto = z.strictObject({
  id: z.string(),
  name: I18n,
  description: I18n,
  status: RoundStatus,
  opensAt: z.string(),
  closesAt: z.string(),
  courseId: z.string(),
  eligibilityMinProgressPct: z.number().int(),
})
export const RoundList = z.strictObject({ items: z.array(RoundDto) })

const pct = z.number().int().min(0).max(100)
export const RoundInput = z
  .object({
    name: i18nTitle,
    description: i18nText(20_000).default({ en: '', ar: '' }),
    opensAt: isoDateTime,
    closesAt: isoDateTime,
    courseId: uuid,
    eligibilityMinProgressPct: pct.default(80),
  })
  .refine((r) => new Date(r.closesAt) > new Date(r.opensAt), {
    path: ['closesAt'],
    message: 'Must be after opensAt',
  })
export const RoundUpdate = z
  .object({
    name: i18nTitle.optional(),
    description: i18nText(20_000).optional(),
    opensAt: isoDateTime.optional(),
    closesAt: isoDateTime.optional(),
    courseId: uuid.optional(),
    eligibilityMinProgressPct: pct.optional(),
  })
  .refine((r) => !r.opensAt || !r.closesAt || new Date(r.closesAt) > new Date(r.opensAt), {
    path: ['closesAt'],
    message: 'Must be after opensAt',
  })

export const RoundStatusResponse = z.strictObject({ status: RoundStatus })

export const Rubric = z.strictObject({
  criteria: z.array(
    z.strictObject({
      id: z.string(),
      question: I18n,
      weightPct: z.number().int(),
      order: z.number().int(),
    }),
  ),
  /** Send back as `ifMatch` on save (contract §9.4). */
  updatedAt: z.string(),
  locked: z.boolean(),
})
export const RubricInput = z
  .object({
    criteria: z
      .array(
        z.object({
          id: uuid.optional(),
          question: i18nText(1000).refine((q) => q.en.trim().length > 0, 'Required'),
          weightPct: z.number().int().min(1).max(100),
          order: z.number().int().min(0).default(0),
        }),
      )
      .min(1)
      .max(20),
    ifMatch: isoDateTime.optional(),
  })
  .refine((r) => r.criteria.reduce((s, c) => s + c.weightPct, 0) === 100, {
    path: ['criteria'],
    message: 'Weights must total 100',
  })

export const JudgeStatus = z.enum(['active', 'disabled', 'invited', 'expired', 'revoked'])
export const JudgesQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
export const JudgesPage = paginated(
  z.strictObject({
    userId: z.string().optional(),
    invitationId: z.string().optional(),
    name: z.string().optional(),
    email: z.string(),
    status: JudgeStatus,
    assigned: z.number().int(),
    graded: z.number().int(),
  }),
)
export const InviteJudges = z.object({
  emails: z.array(z.string().max(254)).min(1).max(100),
})
export const InviteJudgesResult = z.strictObject({
  created: z.number().int(),
  skipped: z.array(z.strictObject({ email: z.string(), reason: z.string() })),
})

export const AssignmentsInput = z.object({
  assignments: z
    .array(z.object({ submissionId: uuid, judgeUserIds: z.array(uuid).max(20) }))
    .min(1)
    .max(1000),
})
export const AutoAssignInput = z.object({
  judgesPerSubmission: z.number().int().min(1).max(10).default(3),
})
export const AssignmentsResult = z.strictObject({ assigned: z.number().int() })

export const ScoresQuery = z.object({ aggregation: z.enum(['mean', 'median']).default('mean') })
export const RoundScores = z.strictObject({
  aggregation: z.enum(['mean', 'median']),
  rows: z.array(
    z.strictObject({
      submissionId: z.string(),
      applicant: z.strictObject({ userId: z.string(), name: z.string(), email: z.string() }),
      judges: z.array(
        z.strictObject({
          judgeName: z.string(),
          total: z.number(),
          perCriterion: z.array(z.strictObject({ criterionId: z.string(), score: z.number() })),
        }),
      ),
      finalScore: z.number().nullable(),
      rank: z.number().int().nullable(),
    }),
  ),
})
