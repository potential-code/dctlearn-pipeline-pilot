import * as ctl from '@server/controllers/judge.controller'
import { route } from '@server/lib/route'
import { requireRole } from '@server/middleware/auth.middleware'
import { idParam } from '@shared/schemas/common'
import {
  ApplicantsPage,
  ApplicantsQuery,
  JudgeDashboard,
  JudgeSubmission,
  judgeRoundParams,
  ScoresInput,
  ScoresResult,
} from '@shared/schemas/competition'
import { Router } from 'express'

export const judgeRouter = Router()

const judge = requireRole('judge')
const tags = ['Judge']
const assigned =
  'role(judge) · assigned submissions only (checked per submission and round) · name + microsite only'

route(judgeRouter, {
  method: 'get',
  path: '/judge/dashboard',
  summary: 'P33 Judge dashboard',
  tags,
  auth: 'role(judge) · rounds where the judge has assignments only',
  middleware: judge,
  response: JudgeDashboard,
  handler: ctl.dashboard,
})
route(judgeRouter, {
  method: 'get',
  path: '/judge/rounds/:roundId/applicants',
  summary: 'P34 Applicants of a round',
  tags,
  auth: assigned,
  middleware: judge,
  params: judgeRoundParams,
  query: ApplicantsQuery,
  response: ApplicantsPage,
  handler: ctl.applicants,
})
route(judgeRouter, {
  method: 'get',
  path: '/judge/submissions/:id',
  summary: 'P34 Submission: pitch answers, rubric, my scores',
  tags,
  auth: assigned,
  middleware: judge,
  params: idParam,
  response: JudgeSubmission,
  handler: ctl.submission,
})
route(judgeRouter, {
  method: 'put',
  path: '/judge/submissions/:id/scores',
  summary: 'P34 Score a submission (1–10 per criterion) → weighted total',
  tags,
  auth: `${assigned} · only while the round is judging · Sanitise: feedback`,
  middleware: judge,
  params: idParam,
  body: ScoresInput,
  response: ScoresResult,
  handler: ctl.scores,
})
