import type { RouteContext } from '@server/lib/route'
import * as exportsSvc from '@server/services/platform/exports.service'
import * as jobs from '@server/services/platform/jobs-admin.service'
import type { JOB_STATUSES } from '@shared/schemas/platform'

type Ctx<P = unknown, Q = unknown, B = unknown> = RouteContext<P, Q, B>
type JobStatus = (typeof JOB_STATUSES)[number]

export const listJobs = ({
  query,
}: Ctx<unknown, { status?: JobStatus; name?: string; page: number; pageSize: number }>) =>
  jobs.listJobRuns(query)

export const listSchedules = () => jobs.listScheduleStates()

export const retryJob = ({ params, viewer }: Ctx<{ id: string }>) =>
  jobs.retryJob(params.id, viewer)

export const listExports = ({ query }: Ctx<unknown, { page: number; pageSize: number }>) =>
  exportsSvc.listExports(query)

export const downloadExport = async ({ params, viewer, res }: Ctx<{ id: string }>) => {
  const file = await exportsSvc.downloadExport(params.id, viewer)
  res.setHeader('Content-Type', `${file.contentType}; charset=utf-8`)
  res.setHeader('Content-Disposition', `attachment; filename="${file.name.replace(/"/g, '')}"`)
  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.end(Buffer.from(file.bytes))
}
