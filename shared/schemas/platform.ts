import { z } from 'zod'
import { paginated } from './common'

/** Admin jobs screen, stored exports and personal-data rights (contract §9.3, §9.7). */
export const JOB_STATUSES = ['queued', 'running', 'succeeded', 'failed', 'dead'] as const

export const JobsQuery = z.object({
  status: z.enum(JOB_STATUSES).optional(),
  name: z.string().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

/** Payloads are never returned: they can hold e-mail addresses and invitation links. */
export const JobRun = z.strictObject({
  id: z.string(),
  name: z.string(),
  status: z.enum(JOB_STATUSES),
  attempts: z.number().int(),
  maxAttempts: z.number().int(),
  runAt: z.string(),
  finishedAt: z.string().optional(),
  lastError: z.string().optional(),
  createdAt: z.string(),
})
export const JobsPage = paginated(JobRun)

export const ScheduleRow = z.strictObject({
  name: z.string(),
  everySeconds: z.number().int(),
  lastRunAt: z.string().optional(),
  lastStatus: z.enum(['succeeded', 'failed']).optional(),
  lastError: z.string().optional(),
})
export const ScheduleList = z.array(ScheduleRow)

export const ExportsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
export const ExportRow = z.strictObject({
  id: z.string(),
  kind: z.literal('nightly'),
  forDate: z.string(),
  rows: z.number().int(),
  size: z.number().int(),
  createdAt: z.string(),
  expiresAt: z.string(),
  downloadUrl: z.string(),
})
export const ExportsPage = paginated(ExportRow)

/** 202 body of `GET /me/export` and `POST /me/delete-request`. */
export const DataRequestAccepted = z.strictObject({
  id: z.string(),
  kind: z.enum(['export', 'delete']),
  status: z.enum(['requested', 'done']),
  requestedAt: z.string(),
})

export const AnonymiseResult = z.strictObject({ id: z.string(), anonymisedAt: z.string() })
