import { z } from 'zod'
import { ROLES } from '../roles'
import { I18n, isoDate, MicrositeRef, slug, UserDto } from './common'

/** P45 dashboard · P55 reports (contract §6). Ranges end at "now" and are half-open. */
export const RANGE_TOKENS = ['7d', '30d', '90d', '12m'] as const
export type RangeToken = (typeof RANGE_TOKENS)[number]
export const rangeToken = z.enum(RANGE_TOKENS)

export const DashboardQuery = z.object({
  range: rangeToken.default('30d'),
  microsite: slug.optional(),
})
export const ReportQuery = z.object({ range: rangeToken.default('30d') })

export const SeriesPoint = z.strictObject({
  /** `YYYY-MM-DD` of the bucket's first day (UTC): day for 7d/30d, week for 90d, month for 12m. */
  bucket: z.string(),
  value: z.number(),
})

export const Kpis = z.strictObject({
  totalUsers: z.number().int(),
  newUsers: z.number().int(),
  activeUsers: z.number().int(),
  completions: z.number().int(),
  certificates: z.number().int(),
  /** newUsers against the previous period of the same length, in % (one decimal). */
  growthPct: z.number(),
})

export const ByMicrositeRow = z.strictObject({
  microsite: MicrositeRef,
  members: z.number().int(),
  active: z.number().int(),
  completions: z.number().int(),
})

export const RecentSignup = UserDto.extend({
  joinedAt: z.string(),
  lastSignInAt: z.string().optional(),
}).strict()

export const Dashboard = z.strictObject({
  kpis: Kpis,
  series: z.strictObject({ signups: z.array(SeriesPoint), completions: z.array(SeriesPoint) }),
  byMicrosite: z.array(ByMicrositeRow),
  byRole: z.array(z.strictObject({ role: z.enum(ROLES), count: z.number().int() })),
  recentSignups: z.array(RecentSignup),
})
export type Dashboard = z.infer<typeof Dashboard>

export const TopCourse = z.strictObject({
  courseId: z.string(),
  title: I18n,
  started: z.number().int(),
  completed: z.number().int(),
})

export const MicrositeReport = Dashboard.extend({ topCourses: z.array(TopCourse) }).strict()

export const InsightsAsk = z.object({ question: z.string().trim().min(3).max(500) })
export const InsightsAnswer = z.strictObject({ answer: z.string(), dataUsed: z.array(z.string()) })

/** Progress CSV: `from`/`to` are UTC calendar days, both inclusive. */
export const ProgressCsvQuery = z
  .object({ microsite: slug.optional(), from: isoDate.optional(), to: isoDate.optional() })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    path: ['to'],
    message: 'End date must be on or after the start date',
  })
