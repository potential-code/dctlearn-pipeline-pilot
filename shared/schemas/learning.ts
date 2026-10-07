import { z } from 'zod'
import {
  ASSESSMENT_TYPES,
  BLOCK_TYPES,
  COURSE_LEVELS,
  COURSE_STATUSES,
  QUESTION_TYPES,
  UNIT_STATUSES,
} from '../enums'
import {
  CourseCard,
  I18n,
  i18nRich,
  i18nShort,
  i18nTitle,
  ifMatch,
  paginated,
  shortText,
  slug,
  uuid,
} from './common'

/**
 * P16 player, assessments, certificate check, P52 courses tab, P46/P59 course editor.
 * Request schemas strip unknown keys; response schemas are strict (contract §9.12).
 */

const intMin0 = z.number().int().min(0)

/** https URL or a stored file id (uuid) from `POST /api/admin/uploads`. */
export const mediaRef = z
  .string()
  .max(2048)
  .refine(
    (v) => /^[0-9a-f-]{36}$/i.test(v) || /^https:\/\/[^\s]+$/i.test(v),
    'Use an https:// link or an uploaded file',
  )

/* ================================================================== params */

export const CourseSlugParams = z.object({ p: slug, slug: z.string().min(1).max(80) })
export const UnitParams = z.object({ unitId: uuid })
export const BlockParams = z.object({ unitId: uuid, blockId: uuid })
export const AssessmentParams = z.object({ id: uuid })
export const SerialParams = z.object({ serial: z.string().regex(/^[A-Z0-9-]{6,40}$/) })

/* ================================================================== P16 course view */

export const CertificateRef = z.strictObject({
  id: z.string(),
  serial: z.string(),
  issuedAt: z.string(),
  pdfUrl: z.string(),
})

/** A quiz or survey attached to a unit (v0.4: units expose their assessments so they can be taken). */
export const UnitAssessmentRef = z.strictObject({
  id: z.string(),
  title: I18n,
  type: z.enum(['survey', 'quiz_blocking', 'quiz_non_blocking']),
  status: z.enum(['locked', 'available', 'passed', 'failed']),
})

export const CourseView = z.strictObject({
  course: z.strictObject({
    id: z.string(),
    slug: z.string(),
    title: I18n,
    description: I18n,
    imageUrl: z.string(),
    level: z.enum(COURSE_LEVELS),
    durationMin: z.number().int(),
    categories: z.array(z.string()),
    isMandatory: z.boolean(),
    certificateEnabled: z.boolean(),
    progressPct: z.number(),
    state: z.enum(['not_started', 'in_progress', 'completed', 'coming_soon']),
    enrolledAt: z.string(),
  }),
  modules: z.array(
    z.strictObject({
      id: z.string(),
      title: I18n,
      order: z.number().int(),
      progressPct: z.number(),
      units: z.array(
        z.strictObject({
          id: z.string(),
          title: I18n,
          order: z.number().int(),
          status: z.enum(UNIT_STATUSES),
          hasAssessment: z.boolean(),
          assessments: z.array(UnitAssessmentRef),
          durationMin: z.number().int().optional(),
        }),
      ),
    }),
  ),
  finalAssessment: z
    .strictObject({
      id: z.string(),
      title: I18n,
      status: z.enum(['locked', 'available', 'passed', 'failed']),
    })
    .optional(),
  certificate: CertificateRef.optional(),
})

/* ================================================================== P16 unit view: block payloads */

const SurveyQuestionOut = z.strictObject({
  id: z.string(),
  text: I18n,
  type: z.enum(QUESTION_TYPES),
  options: z.array(z.strictObject({ id: z.string(), text: I18n })).optional(),
})

export const SurveyAnswer = z.object({
  questionId: z.string().min(1).max(64),
  optionIds: z.array(z.string().max(64)).max(50).optional(),
  text: z.string().max(2000).optional(),
  order: z.array(z.string().max(64)).max(50).optional(),
})
const SurveyAnswerOut = z.strictObject({
  questionId: z.string(),
  optionIds: z.array(z.string()).optional(),
  text: z.string().optional(),
  order: z.array(z.string()).optional(),
})

export const BlockPayloadOut = {
  text: z.strictObject({ html: I18n }),
  image: z.strictObject({ url: z.string(), caption: I18n.optional(), alt: I18n }),
  video: z.strictObject({
    videoId: z.string().optional(),
    url: z.string().optional(),
    title: I18n.optional(),
    resumeAtSec: z.number().int().optional(),
  }),
  youtube: z.strictObject({
    videoId: z.string().optional(),
    url: z.string().optional(),
    title: I18n.optional(),
    resumeAtSec: z.number().int().optional(),
  }),
  youtube_playlist: z.strictObject({
    items: z.array(z.strictObject({ videoId: z.string(), title: z.string() })),
  }),
  scorm: z.strictObject({ launchUrl: z.string(), version: z.enum(['1.2', '2004']) }),
  audio: z.strictObject({ url: z.string(), title: I18n, transcript: I18n.optional() }),
  case_study: z.strictObject({ html: I18n }),
  quotes: z.strictObject({
    items: z.array(z.strictObject({ text: I18n, author: z.string().optional() })),
  }),
  resources: z.strictObject({
    items: z.array(
      z.strictObject({ title: I18n, url: z.string(), type: z.enum(['pdf', 'link', 'template']) }),
    ),
  }),
  related_courses: z.strictObject({ items: z.array(CourseCard) }),
  action_plan: z.strictObject({
    title: I18n,
    questions: z.array(
      z.strictObject({ no: z.number().int().min(1).max(5), text: I18n, charLimit: z.number() }),
    ),
    answers: z.record(z.string(), z.string()),
    pdfUrl: z.string().optional(),
  }),
  survey: z.strictObject({
    questions: z.array(SurveyQuestionOut),
    answers: z.array(SurveyAnswerOut).optional(),
  }),
} as const satisfies Record<(typeof BLOCK_TYPES)[number], z.ZodType>

const blockOut = <T extends keyof typeof BlockPayloadOut>(type: T) =>
  z.strictObject({
    id: z.string(),
    type: z.literal(type),
    order: z.number().int(),
    required: z.boolean(),
    completed: z.boolean(),
    payload: BlockPayloadOut[type],
  })

export const BlockView = z.discriminatedUnion('type', [
  blockOut('text'),
  blockOut('image'),
  blockOut('video'),
  blockOut('youtube'),
  blockOut('youtube_playlist'),
  blockOut('scorm'),
  blockOut('audio'),
  blockOut('case_study'),
  blockOut('quotes'),
  blockOut('resources'),
  blockOut('related_courses'),
  blockOut('action_plan'),
  blockOut('survey'),
])

export const UnitView = z.strictObject({
  unit: z.strictObject({
    id: z.string(),
    title: I18n,
    order: z.number().int(),
    moduleId: z.string(),
    status: z.enum(UNIT_STATUSES),
    prevUnitId: z.string().optional(),
    nextUnitId: z.string().optional(),
  }),
  blocks: z.array(BlockView),
  assessments: z.array(UnitAssessmentRef),
  completion: z.strictObject({
    canComplete: z.boolean(),
    reason: z.enum(['blocks_incomplete', 'assessment_required']).optional(),
  }),
})

/* ================================================================== P16 writes */

export const BlockProgressInput = z.object({
  completed: z.boolean(),
  positionSec: z.number().int().min(0).max(86_400).optional(),
})

export const ActionPlanInput = z.object({
  answers: z.partialRecord(z.enum(['1', '2', '3', '4', '5']), z.string().max(5000)),
})
export const ActionPlanSaved = z.strictObject({ pdfUrl: z.string() })

export const SurveyInput = z.object({ answers: z.array(SurveyAnswer).max(100) })
export const SurveySaved = z.strictObject({ completed: z.literal(true) })

const SCORM_STATUSES = [
  'not attempted',
  'incomplete',
  'completed',
  'passed',
  'failed',
  'browsed',
  'unknown',
] as const
export const ScormCmi = z.object({
  completionStatus: z.enum(SCORM_STATUSES),
  successStatus: z.enum(['passed', 'failed', 'unknown']).optional(),
  scoreRaw: z.number().min(0).max(100_000).optional(),
  location: z.string().max(1000).optional(),
  suspendData: z.string().max(64_000).optional(),
})
export const ScormPut = z.object({ cmi: ScormCmi })
export const ScormGet = z.strictObject({
  launchUrl: z.string(),
  version: z.enum(['1.2', '2004']),
  state: z
    .strictObject({
      cmi: z.strictObject({
        completionStatus: z.enum(SCORM_STATUSES),
        successStatus: z.enum(['passed', 'failed', 'unknown']).optional(),
        scoreRaw: z.number().optional(),
        location: z.string().optional(),
        suspendData: z.string().optional(),
      }),
    })
    .optional(),
})

export const UnitCompleteResponse = z.strictObject({
  unitStatus: z.enum(UNIT_STATUSES),
  courseProgressPct: z.number(),
  nextUnitId: z.string().optional(),
  pointsAwarded: z.number().int(),
  certificate: CertificateRef.optional(),
})

/* ================================================================== assessments */

export const AssessmentView = z.strictObject({
  id: z.string(),
  title: I18n,
  type: z.enum(ASSESSMENT_TYPES),
  passMark: z.number().int(),
  attemptsAllowed: z.number().int(),
  attemptsUsed: z.number().int(),
  timeLimitMin: z.number().int().optional(),
  questions: z.array(SurveyQuestionOut),
})

export const AttemptInput = z.object({
  answers: z
    .array(
      z.object({
        questionId: uuid,
        optionIds: z.array(z.string().max(64)).max(50).optional(),
        text: z.string().max(2000).optional(),
        order: z.array(z.string().max(64)).max(50).optional(),
      }),
    )
    .max(200),
})

export const AttemptResult = z.strictObject({
  attemptId: z.string(),
  scorePct: z.number(),
  passed: z.boolean(),
  showAnswers: z.boolean(),
  correct: z.record(z.string(), z.union([z.array(z.string()), z.string()])).optional(),
})

/* ================================================================== certificate verification */

export const CertificateCheck = z.strictObject({
  valid: z.boolean(),
  learnerName: z.string(),
  courseTitle: I18n,
  issuedAt: z.string(),
  issuer: z.string(),
})

/* ================================================================== P52 courses tab */

export const CoursesTabQuery = z.object({
  q: z.string().max(100).optional().catch(undefined),
  category: z.string().max(200).optional().catch(undefined),
  state: z.enum(['all', 'in_progress', 'completed']).default('all').catch('all'),
  sort: z.string().max(40).optional().catch(undefined),
  page: z.coerce.number().int().min(1).default(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20).catch(20),
})
export const CoursesTabResponse = z.strictObject({
  categories: z.array(z.string()),
  defaultFilter: z.string().optional(),
  items: paginated(CourseCard),
})

/* ================================================================== P46 / P59 admin */

export const AdminCoursesQuery = z.object({
  q: z.string().max(100).optional(),
  status: z.enum(COURSE_STATUSES).optional(),
  microsite: slug.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
export const AdminCourseRow = z.strictObject({
  id: z.string(),
  slug: z.string(),
  title: I18n,
  status: z.enum(COURSE_STATUSES),
  level: z.enum(COURSE_LEVELS),
  units: z.number().int(),
  enrolled: z.number().int(),
  completed: z.number().int(),
  updatedAt: z.string(),
  microsites: z.array(z.string()),
})
export const AdminCoursesPage = paginated(AdminCourseRow)

const categories = z.array(z.string().trim().min(1).max(120)).max(20)

export const CourseCreate = z.object({
  title: i18nTitle,
  slug: z
    .string()
    .regex(/^[a-z0-9-]{2,60}$/)
    .optional(),
  description: i18nRich,
  level: z.enum(COURSE_LEVELS),
  durationMin: z.number().int().min(0).max(10_000),
  categories,
  imageUrl: mediaRef.or(z.literal('')),
  certificateEnabled: z.boolean(),
  sequential: z.boolean(),
  externalCertificate: z.boolean().optional(),
})
export const CourseUpdate = CourseCreate.partial().extend(ifMatch.shape)

export const ModuleInput = z.object({ title: i18nTitle })
export const UnitInput = z.object({
  title: i18nTitle,
  durationMin: z.number().int().min(0).max(1000).optional(),
})
export const UnitUpdate = UnitInput.partial().extend({ moduleId: uuid.optional() })
export const ReorderInput = z.object({ ids: z.array(uuid).min(1).max(500) })

/* ---------------------------------------------------------------- block payload inputs */

const i18nPlain = i18nShort
const videoInput = z
  .object({
    videoId: z
      .string()
      .regex(/^[A-Za-z0-9_-]{6,20}$/)
      .optional(),
    url: mediaRef.optional(),
    title: i18nPlain.optional(),
  })
  .refine((v) => Boolean(v.videoId || v.url), 'Give a videoId or a url')

export const SurveyQuestionInput = z.object({
  id: z.string().max(64).optional(),
  text: i18nShort,
  type: z.enum(QUESTION_TYPES),
  options: z
    .array(z.object({ id: z.string().max(64).optional(), text: i18nShort }))
    .max(20)
    .optional(),
})

/** Stored payload per block type (what the editor sends). Rich text is sanitised on save. */
export const BlockPayloadInput = {
  text: z.object({ html: i18nRich }),
  case_study: z.object({ html: i18nRich }),
  image: z.object({ url: mediaRef, caption: i18nPlain.optional(), alt: i18nPlain }),
  video: videoInput,
  youtube: videoInput,
  youtube_playlist: z.object({
    items: z
      .array(
        z.object({
          videoId: z.string().regex(/^[A-Za-z0-9_-]{6,20}$/),
          title: z.string().max(240),
        }),
      )
      .min(1)
      .max(50),
  }),
  scorm: z.object({ packageId: uuid }),
  audio: z.object({ url: mediaRef, title: i18nTitle, transcript: i18nRich.optional() }),
  quotes: z.object({
    items: z
      .array(z.object({ text: i18nText500(), author: z.string().max(120).optional() }))
      .min(1)
      .max(20),
  }),
  resources: z.object({
    items: z
      .array(
        z.object({ title: i18nTitle, url: mediaRef, type: z.enum(['pdf', 'link', 'template']) }),
      )
      .min(1)
      .max(30),
  }),
  related_courses: z.object({}),
  action_plan: z.object({
    title: i18nTitle,
    questions: z
      .array(
        z.object({
          no: z.number().int().min(1).max(5),
          text: i18nShort,
          charLimit: z.number().int().min(50).max(5000).default(500),
        }),
      )
      .min(1)
      .max(5)
      .refine((qs) => new Set(qs.map((q) => q.no)).size === qs.length, 'Question numbers repeat'),
  }),
  survey: z.object({ questions: z.array(SurveyQuestionInput).min(1).max(50) }),
} as const satisfies Record<(typeof BLOCK_TYPES)[number], z.ZodType>

function i18nText500() {
  return z.object({ en: z.string().max(500), ar: z.string().max(500) })
}

export const BlockCreate = z.object({
  type: z.enum(BLOCK_TYPES),
  payload: z.record(z.string(), z.unknown()).default({}),
  required: z.boolean().default(true),
})
export const BlockUpdate = z.object({
  payload: z.record(z.string(), z.unknown()).optional(),
  required: z.boolean().optional(),
})

/* ---------------------------------------------------------------- assessments (admin) */

export const AssessmentInput = z.object({
  title: i18nTitle,
  type: z.enum(ASSESSMENT_TYPES),
  passMark: z.number().int().min(0).max(100),
  attemptsAllowed: z.number().int().min(0).max(20),
  timeLimitMin: z.number().int().min(1).max(600).optional(),
  shuffle: z.boolean().default(false),
  isFinal: z.boolean().default(false),
  moduleId: uuid.optional(),
  /** Unit the assessment belongs to (its completion needs a pass when quiz_blocking). */
  unitId: uuid.optional(),
})
export const AssessmentUpdate = AssessmentInput.partial()

export const QuestionInput = z.object({
  text: i18nShort,
  type: z.enum(QUESTION_TYPES),
  options: z
    .array(z.object({ id: z.string().max(64).optional(), text: i18nShort, correct: z.boolean() }))
    .max(20)
    .default([]),
  points: z.number().int().min(0).max(100).default(1),
})
export const QuestionParams = z.object({ id: uuid, aid: uuid, qid: uuid })

export const CardInput = z.object({
  imageUrl: mediaRef.or(z.literal('')),
  categories,
  level: z.enum(COURSE_LEVELS),
  durationMin: z.number().int().min(0).max(10_000),
  comingSoon: z.boolean(),
  isCertProgramme: z.boolean(),
  overview: i18nRich,
})

export const CertificateSettingsInput = z.object({
  backgroundUrl: mediaRef.or(z.literal('')),
  logoUrl: mediaRef.or(z.literal('')),
  signatureName: shortText,
  signatureTitle: shortText,
  signatureImageUrl: mediaRef.optional(),
})

export const PointsConfigInput = z.object({
  unit: intMin0.max(1000),
  module: intMin0.max(1000),
  course: intMin0.max(1000),
  assessmentPass: intMin0.max(1000),
})

/* ---------------------------------------------------------------- admin responses */

const AdminBlock = z.strictObject({
  id: z.string(),
  type: z.enum(BLOCK_TYPES),
  order: z.number().int(),
  required: z.boolean(),
  payload: z.record(z.string(), z.unknown()),
})
const AdminQuestion = z.strictObject({
  id: z.string(),
  text: I18n,
  type: z.enum(QUESTION_TYPES),
  options: z.array(z.strictObject({ id: z.string(), text: I18n, correct: z.boolean() })),
  points: z.number().int(),
  order: z.number().int(),
})
export const AdminAssessment = z.strictObject({
  id: z.string(),
  title: I18n,
  type: z.enum(ASSESSMENT_TYPES),
  passMark: z.number().int(),
  attemptsAllowed: z.number().int(),
  timeLimitMin: z.number().int().optional(),
  shuffle: z.boolean(),
  isFinal: z.boolean(),
  moduleId: z.string().optional(),
  unitId: z.string().optional(),
  version: z.number().int(),
  questions: z.array(AdminQuestion),
})

export const AdminCourseDetail = z.strictObject({
  course: z.strictObject({
    id: z.string(),
    slug: z.string(),
    title: I18n,
    description: I18n,
    status: z.enum(COURSE_STATUSES),
    level: z.enum(COURSE_LEVELS),
    durationMin: z.number().int(),
    categories: z.array(z.string()),
    imageUrl: z.string(),
    certificateEnabled: z.boolean(),
    externalCertificate: z.boolean(),
    sequential: z.boolean(),
    pointsConfig: z.strictObject({
      unit: z.number().int(),
      module: z.number().int(),
      course: z.number().int(),
      assessmentPass: z.number().int(),
    }),
    publishedAt: z.string().optional(),
    updatedAt: z.string(),
  }),
  modules: z.array(
    z.strictObject({
      id: z.string(),
      title: I18n,
      order: z.number().int(),
      units: z.array(
        z.strictObject({
          id: z.string(),
          title: I18n,
          order: z.number().int(),
          durationMin: z.number().int().optional(),
          blocks: z.array(AdminBlock),
        }),
      ),
    }),
  ),
  assessments: z.array(AdminAssessment),
  card: z.strictObject({
    imageUrl: z.string(),
    categories: z.array(z.string()),
    level: z.enum(COURSE_LEVELS),
    durationMin: z.number().int(),
    comingSoon: z.boolean(),
    isCertProgramme: z.boolean(),
    overview: I18n,
  }),
  certificateSettings: z
    .strictObject({
      backgroundUrl: z.string(),
      logoUrl: z.string(),
      signatureName: z.string(),
      signatureTitle: z.string(),
      signatureImageUrl: z.string().optional(),
    })
    .nullable(),
})

export const UploadResponse = z.strictObject({ fileId: z.string(), url: z.string() })
export const CourseStatusResponse = z.strictObject({
  id: z.string(),
  status: z.enum(COURSE_STATUSES),
})
