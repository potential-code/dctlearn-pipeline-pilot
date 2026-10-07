import type { RouteContext } from '@server/lib/route'
import { micrositeOf } from '@server/middleware/microsite.middleware'
import * as admin from '@server/services/competition/admin.service'
import * as rounds from '@server/services/competition/rounds.service'
import type {
  AssignmentsInput,
  AutoAssignInput,
  InviteJudges,
  JudgesQuery,
  RoundInput,
  RoundUpdate,
  RubricInput,
  ScoresQuery,
} from '@shared/schemas/competition'
import type { z } from 'zod'

type Ctx<P = unknown, Q = unknown, B = unknown> = RouteContext<P, Q, B>
type Id = { p: string; id: string }

/* P41 rounds */
export const listRounds = ({ res }: Ctx) => admin.listRounds(micrositeOf(res))
export const createRound = ({
  viewer,
  res,
  body,
}: Ctx<unknown, unknown, z.infer<typeof RoundInput>>) =>
  admin.createRound(micrositeOf(res), viewer, body)
export const updateRound = ({
  viewer,
  res,
  params,
  body,
}: Ctx<Id, unknown, z.infer<typeof RoundUpdate>>) =>
  admin.updateRound(micrositeOf(res), viewer, params.id, body)
export const activate = ({ viewer, res, params }: Ctx<Id>) =>
  rounds.activateRound(micrositeOf(res).id, params.id, viewer)
export const startJudging = ({ viewer, res, params }: Ctx<Id>) =>
  rounds.startJudging(micrositeOf(res).id, params.id, viewer)
export const close = ({ viewer, res, params }: Ctx<Id>) =>
  rounds.closeRound(micrositeOf(res).id, params.id, viewer)

/* P43 rubric */
export const rubric = ({ res, params }: Ctx<Id>) => admin.getRubric(micrositeOf(res), params.id)
export const saveRubric = ({
  viewer,
  res,
  params,
  body,
}: Ctx<Id, unknown, z.infer<typeof RubricInput>>) =>
  admin.putRubric(micrositeOf(res), viewer, params.id, body)

/* P42 judges + assignments */
export const judges = ({ res, query }: Ctx<unknown, z.infer<typeof JudgesQuery>>) =>
  admin.listJudges(micrositeOf(res), query)
export const inviteJudges = ({
  viewer,
  res,
  body,
}: Ctx<unknown, unknown, z.infer<typeof InviteJudges>>) =>
  admin.inviteJudges(micrositeOf(res), viewer, body.emails)
export const assignments = ({
  viewer,
  res,
  params,
  body,
}: Ctx<Id, unknown, z.infer<typeof AssignmentsInput>>) =>
  admin.setAssignments(micrositeOf(res), viewer, params.id, body)
export const autoAssign = ({
  viewer,
  res,
  params,
  body,
}: Ctx<Id, unknown, z.infer<typeof AutoAssignInput>>) =>
  admin.autoAssign(micrositeOf(res), viewer, params.id, body.judgesPerSubmission)

/* P44 scores */
export const scores = ({ res, params, query }: Ctx<Id, z.infer<typeof ScoresQuery>>) =>
  admin.roundScores(micrositeOf(res), params.id, query.aggregation)
export const scoresCsv = async ({
  viewer,
  res,
  params,
  query,
}: Ctx<Id, z.infer<typeof ScoresQuery>>) => {
  const csv = await admin.roundScoresCsv(micrositeOf(res), viewer, params.id, query.aggregation)
  res
    .status(200)
    .type('text/csv; charset=utf-8')
    .set('Content-Disposition', `attachment; filename="scores-${params.id}.csv"`)
    .send(csv)
  return undefined
}
