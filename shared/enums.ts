/** Enums of API-CONTRACT §0.1, as tuples so Zod and Drizzle can share them. */
export const SIGN_IN_MODES = ['open', 'invite_only', 'landing_only'] as const
export const MICROSITE_STATUSES = ['requested', 'draft', 'live', 'archived'] as const
export const HUB_TABS = [
  'courses',
  'workshops',
  'mentors',
  'ai_coaches',
  'ai_tools',
  'resources',
] as const
export const COURSE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const
export const CARD_STATES = ['not_started', 'in_progress', 'completed', 'coming_soon'] as const
export const BLOCK_TYPES = [
  'text',
  'image',
  'video',
  'youtube',
  'youtube_playlist',
  'scorm',
  'audio',
  'case_study',
  'quotes',
  'resources',
  'related_courses',
  'action_plan',
  'survey',
] as const
export const FORM_KINDS = ['survey', 'application', 'registration'] as const
export const EXTERNAL_CERT_STATUSES = ['pending', 'approved', 'rejected'] as const
export const MENTEE_APPLICATION_STATUSES = ['pending', 'accepted', 'declined'] as const
export const ASSESSMENT_TYPES = ['survey', 'quiz_blocking', 'quiz_non_blocking'] as const
export const QUESTION_TYPES = ['multiple_choice', 'true_false', 'open_text', 'sorting'] as const
export const UNIT_STATUSES = ['locked', 'available', 'completed'] as const
export const BOOKING_STATUSES = [
  'requested',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
] as const
export const INVITATION_STATUSES = ['sent', 'accepted', 'revoked', 'expired'] as const
export const RESOURCE_STATUSES = ['pending', 'approved', 'rejected'] as const
export const ROUND_STATUSES = ['draft', 'open', 'judging', 'closed'] as const
export const SUBMISSION_STATUSES = ['not_started', 'in_progress', 'submitted', 'scored'] as const
export const AI_EMBED_KINDS = ['chat', 'iframe', 'voice'] as const
export const EVENT_STATUSES = ['upcoming', 'live', 'past', 'cancelled'] as const
export const USER_STATUSES = ['active', 'disabled', 'invited'] as const
export const LOCALES = ['en', 'ar'] as const
export const COURSE_STATUSES = ['draft', 'published', 'archived'] as const
export const FORM_STATUSES = ['draft', 'published', 'closed'] as const
export const ACCESS_REQUEST_STATUSES = ['open', 'approved', 'declined'] as const
export const MICROSITE_REQUEST_STATUSES = ['requested', 'approved', 'rejected'] as const

export type SignInMode = (typeof SIGN_IN_MODES)[number]
export type MicrositeStatus = (typeof MICROSITE_STATUSES)[number]
export type HubTab = (typeof HUB_TABS)[number]
export type CourseLevel = (typeof COURSE_LEVELS)[number]
export type CardState = (typeof CARD_STATES)[number]
export type UserStatus = (typeof USER_STATUSES)[number]
export type Locale = (typeof LOCALES)[number]
export type InvitationStatus = (typeof INVITATION_STATUSES)[number]
