import type { RouteContext } from '@server/lib/route'
import * as dashboard from '@server/services/analytics/dashboard.service'
import { progressCsv } from '@server/services/analytics/progress.service'
import type { RangeToken } from '@shared/schemas/analytics'

type Ctx<P = unknown, Q = unknown, B = unknown> = RouteContext<P, Q, B>

export const getDashboard = ({
  query,
  viewer,
}: Ctx<unknown, { range: RangeToken; microsite?: string }>) => dashboard.getDashboard(query, viewer)

export const getReport = ({ params, query, viewer }: Ctx<{ p: string }, { range: RangeToken }>) =>
  dashboard.getMicrositeReport(params.p, query, viewer)

export const askInsights = ({ body }: Ctx<unknown, unknown, { question: string }>) =>
  dashboard.askInsights(body.question)

export const exportProgress = async ({
  query,
  viewer,
  res,
}: Ctx<unknown, { microsite?: string; from?: string; to?: string }>) => {
  const csv = await progressCsv(query, viewer)
  const name = `progress${query.microsite ? `-${query.microsite}` : ''}.csv`
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${name}"`)
  res.setHeader('Cache-Control', 'private, no-store')
  res.send(csv)
}
