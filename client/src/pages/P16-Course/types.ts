// client: hand-built page (P16 learner course player). Replaces the generated artboard port.
//
// These types mirror the backend learner API (backend:docs/API-CONTRACT.md "P16 Course & unit
// player" and "Assessments", backend:shared/schemas/learning.ts) so the mock store in ./store.ts can be
// swapped for fetch calls. Where the design needs something the contract does not have yet, the field
// is marked "client-only" and listed in docs/CLIENT-NOTES.md under "Backend gaps".

export type I18n = { en: string; ar: string }
export type Level = 'beginner' | 'intermediate' | 'advanced'
export type CourseState = 'not_started' | 'in_progress' | 'completed' | 'coming_soon'
export type UnitStatus = 'locked' | 'available' | 'completed'
export type AssessmentStatus = 'locked' | 'available' | 'passed' | 'failed'

/** The contract's `blockType` plus `quiz_blocking` (the P59 unit-check block, client-only). */
export type BlockType =
  | 'text'
  | 'youtube'
  | 'youtube_playlist'
  | 'scorm'
  | 'audio'
  | 'case_study'
  | 'quotes'
  | 'resources'
  | 'related_courses'
  | 'action_plan'
  | 'survey'
  | 'quiz_blocking'

export type AssessmentType = 'survey' | 'quiz_blocking' | 'quiz_non_blocking'
export type AssessmentKind = 'pre' | 'post' | 'unit'
export type QuestionType = 'multiple_choice' | 'true_false' | 'open_text' | 'sorting'

/* ------------------------------------------------------------------ course view */

export interface CertificateRef {
  id: string
  serial: string
  issuedAt: string
  pdfUrl: string
}

export interface AssessmentRef {
  id: string
  title: I18n
  status: AssessmentStatus
}

export interface UnitRow {
  id: string
  title: I18n
  order: number
  status: UnitStatus
  hasAssessment: boolean
  durationMin?: number
}

export interface ModuleRow {
  id: string
  title: I18n
  order: number
  progressPct: number
  units: UnitRow[]
}

/** GET /api/microsites/{p}/courses/{slug}. `preAssessment` and `isMandatory` per site: client-only. */
export interface CourseView {
  course: {
    id: string
    slug: string
    title: I18n
    description: I18n
    imageUrl: string
    level: Level
    durationMin: number
    categories: I18n[]
    isMandatory: boolean
    certificateEnabled: boolean
    progressPct: number
    state: CourseState
    enrolledAt: string
  }
  modules: ModuleRow[]
  /** client-only: the pre-test (`course_assessments` has no position column yet). */
  preAssessment?: AssessmentRef
  finalAssessment?: AssessmentRef
  certificate?: CertificateRef
}

/* ------------------------------------------------------------------ unit view */

export interface SurveyQuestionView {
  id: string
  text: I18n
  type: 'single' | 'scale' | 'open'
  options?: { id: string; text: I18n }[]
}
export interface SurveyAnswer {
  questionId: string
  optionIds?: string[]
  text?: string
}

export interface ResourceItem {
  title: I18n
  url: string
  type: 'pdf' | 'link' | 'template'
  /** client-only: file badge and size line */
  ext: string
  size: string
  color: string
}

export interface CourseCard {
  slug: string
  title: I18n
  imageUrl: string
  level: Level
  durationMin: number
}

export interface PlaylistItem {
  videoId: string
  title: I18n
  duration: string
  posterUrl: string
}

export interface BlockPayloads {
  text: { title: I18n; html: I18n }
  youtube: {
    title: I18n
    videoId: string
    posterUrl: string
    durationSec: number
    mustWatch: boolean
  }
  youtube_playlist: { title: I18n; items: PlaylistItem[] }
  scorm: {
    title: I18n
    launchUrl: string
    version: '1.2' | '2004'
    posterUrl: string
    completionRule: 'completed' | 'passed'
  }
  audio: { title: I18n; url: string; durationSec: number; transcript?: I18n }
  case_study: { title: I18n; html: I18n; reflection?: I18n }
  quotes: { title: I18n; items: { text: I18n; author?: I18n }[] }
  resources: { title: I18n; items: ResourceItem[] }
  related_courses: { title: I18n; items: CourseCard[] }
  action_plan: {
    title: I18n
    intro?: I18n
    questions: { no: number; text: I18n; charLimit: number }[]
    allowPdf: boolean
  }
  survey: { title: I18n; questions: SurveyQuestionView[] }
  quiz_blocking: { title: I18n; assessmentId: string }
}

export type BlockView = {
  [T in BlockType]: {
    id: string
    type: T
    order: number
    required: boolean
    payload: BlockPayloads[T]
  }
}[BlockType]

/** GET /api/microsites/{p}/units/{unitId}, minus the per-learner flags the store adds. */
export interface UnitView {
  id: string
  moduleId: string
  title: I18n
  order: number
  blocks: BlockView[]
}

/* ------------------------------------------------------------------ assessments */

export interface QuestionView {
  id: string
  text: I18n
  type: QuestionType
  options?: { id: string; text: I18n }[]
}

/** GET /api/assessments/{id}. `kind`, `showAnswers` and `description` are client-only. */
export interface AssessmentView {
  id: string
  kind: AssessmentKind
  title: I18n
  description: I18n
  type: AssessmentType
  passMark: number
  attemptsAllowed: number
  timeLimitMin?: number
  showAnswers: boolean
  questions: QuestionView[]
}

export interface AnswerInput {
  questionId: string
  optionIds?: string[]
  text?: string
  order?: string[]
}

/** POST /api/assessments/{id}/attempts. */
export interface AttemptResult {
  attemptId: string
  scorePct: number
  passed: boolean
  showAnswers: boolean
  correct?: Record<string, string[] | string>
  /** which questions the learner got right; shown only when `correct` is revealed (client-only) */
  right?: Record<string, boolean>
}

export interface AttemptRecord {
  n: number
  scorePct: number
  passed: boolean
  at: string
  answers: AnswerInput[]
  result: AttemptResult
}
