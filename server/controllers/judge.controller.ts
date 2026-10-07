import type { RouteContext } from '@server/lib/route'
import * as judge from '@server/services/competition/judge.service'
import type { ApplicantsQuery, ScoresInput } from '@shared/schemas/competition'
import type { z } from 'zod'

type Ctx<P = unknown, Q = unknown, B = unknown> = RouteContext<P, Q, B>

/* P33 / P34 judge (assigned submissions only) */
export const dashboard = ({ viewer }: Ctx) => judge.judgeDashboard(viewer)
export const applicants = ({
  viewer,
  params,
  query,
}: Ctx<{ roundId: string }, z.infer<typeof ApplicantsQuery>>) =>
  judge.applicants(viewer, params.roundId, query)
export const submission = ({ viewer, params }: Ctx<{ id: string }>) =>
  judge.submissionDetail(viewer, params.id)
export const scores = ({
  viewer,
  params,
  body,
}: Ctx<{ id: string }, unknown, z.infer<typeof ScoresInput>>) =>
  judge.putScores(viewer, params.id, body)
