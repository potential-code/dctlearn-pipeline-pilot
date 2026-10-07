import { z } from 'zod'
import { EXTERNAL_CERT_STATUSES } from '../enums'
import { I18n, i18nShort, i18nTitle, paginated, slug, UserDto, uuid } from './common'
import { mediaRef } from './learning'

const mediaRefOrEmpty = mediaRef.or(z.literal(''))

/** P51 achievements, external certificates and P58 achievements administration. */

export const AchievementsResponse = z.strictObject({
  points: z.strictObject({ total: z.number().int(), thisMonth: z.number().int() }),
  ledger: z.array(
    z.strictObject({
      at: z.string(),
      points: z.number().int(),
      reason: I18n,
      courseTitle: I18n.optional(),
    }),
  ),
  badges: z.array(
    z.strictObject({
      key: z.string(),
      name: I18n,
      description: I18n,
      imageUrl: z.string(),
      earnedAt: z.string().optional(),
    }),
  ),
  certificates: z.array(
    z.strictObject({
      id: z.string(),
      courseTitle: I18n,
      serial: z.string(),
      issuedAt: z.string(),
      pdfUrl: z.string(),
      shareUrl: z.string(),
    }),
  ),
  externalCertificates: z
    .array(
      z.strictObject({
        id: z.string(),
        courseId: z.string(),
        courseTitle: I18n,
        fileUrl: z.string(),
        uploadedAt: z.string(),
        status: z.enum(EXTERNAL_CERT_STATUSES),
      }),
    )
    .optional(),
  leaderboard: z.strictObject({
    me: z.strictObject({ rank: z.number().int(), points: z.number().int() }),
    top: z.array(
      z.strictObject({
        rank: z.number().int(),
        name: z.string(),
        points: z.number().int(),
        isMe: z.boolean(),
      }),
    ),
  }),
})

export const ExternalCertUploadFields = z.object({ courseId: uuid })
export const ExternalCertParams = z.object({ p: slug, id: uuid })
export const ExternalCertCreated = z.strictObject({
  id: z.string(),
  status: z.enum(EXTERNAL_CERT_STATUSES),
})

/* ---------------------------------------------------------------- P58 admin */

export const BADGE_RULES = ['courses_completed', 'points_total', 'streak_days', 'manual'] as const

export const BadgeInput = z
  .object({
    key: slug,
    name: i18nTitle,
    description: i18nShort,
    imageUrl: mediaRefOrEmpty,
    rule: z.enum(BADGE_RULES),
    threshold: z.number().int().min(1).max(1_000_000).optional(),
  })
  .refine((b) => b.rule === 'manual' || b.threshold !== undefined, {
    message: 'Rule badges need a threshold',
    path: ['threshold'],
  })
export const BadgeUpdate = z.object({
  name: i18nTitle.optional(),
  description: i18nShort.optional(),
  imageUrl: mediaRefOrEmpty.optional(),
  rule: z.enum(BADGE_RULES).optional(),
  threshold: z.number().int().min(1).max(1_000_000).nullable().optional(),
})
export const BadgeParams = z.object({ key: slug })
export const BadgeDto = z.strictObject({
  key: z.string(),
  name: I18n,
  description: I18n,
  imageUrl: z.string(),
  rule: z.enum(BADGE_RULES),
  threshold: z.number().int().optional(),
})
export const BadgeList = z.array(BadgeDto)
export const AwardInput = z.object({ userId: uuid })
export const AwardCreated = z.strictObject({
  userId: z.string(),
  badgeKey: z.string(),
  awardedAt: z.string(),
})

export const POINT_SOURCES = ['unit', 'module', 'course', 'assessment', 'manual'] as const
export const PointsQuery = z.object({
  userId: uuid.optional(),
  microsite: slug.optional(),
  source: z.enum(POINT_SOURCES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
export const PointsPage = paginated(
  z.strictObject({
    at: z.string(),
    user: UserDto,
    points: z.number().int(),
    source: z.enum([...POINT_SOURCES, 'badge']),
    courseTitle: I18n.optional(),
  }),
)
export const PointsAdjust = z.object({
  userId: uuid,
  points: z
    .number()
    .int()
    .min(-10_000)
    .max(10_000)
    .refine((n) => n !== 0, 'Points cannot be 0'),
  reason: z.string().trim().min(1).max(240),
})
export const PointsAdjusted = z.strictObject({ id: z.string(), points: z.number().int() })

export const ExternalCertsQuery = z.object({
  status: z.enum(EXTERNAL_CERT_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
export const ExternalCertsPage = paginated(
  z.strictObject({
    id: z.string(),
    user: UserDto,
    microsite: z.string(),
    course: z.strictObject({ id: z.string(), title: I18n }),
    fileUrl: z.string(),
    uploadedAt: z.string(),
    status: z.enum(EXTERNAL_CERT_STATUSES),
  }),
)
export const RejectNote = z.object({ note: z.string().trim().min(1).max(1000) })
export const ExternalCertDecision = z.strictObject({
  id: z.string(),
  status: z.enum(EXTERNAL_CERT_STATUSES),
})
