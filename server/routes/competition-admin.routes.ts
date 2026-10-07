import * as ctl from '@server/controllers/competition-admin.controller'
import { route } from '@server/lib/route'
import { requireFeature, requireSubAdmin } from '@server/middleware/microsite.middleware'
import { userWriteLimiter } from '@server/middleware/rate-limit.middleware'
import { micrositeParam } from '@shared/schemas/common'
import {
  AssignmentsInput,
  AssignmentsResult,
  AutoAssignInput,
  InviteJudges,
  InviteJudgesResult,
  JudgesPage,
  JudgesQuery,
  RoundDto,
  RoundInput,
  RoundList,
  RoundScores,
  RoundStatusResponse,
  RoundUpdate,
  Rubric,
  RubricInput,
  roundParams,
  ScoresQuery,
} from '@shared/schemas/competition'
import { Router } from 'express'

export const competitionAdminRouter = Router()

const sub = [...requireSubAdmin, requireFeature('competition')]
const tags = ['Sub admin · Competition']
const auth = 'sub_admin(p) or admin'
const base = '/microsites/:p/admin'

/* ------------------------------------------------------------------ P41 rounds */

route(competitionAdminRouter, {
  method: 'get',
  path: `${base}/rounds`,
  summary: 'P41 Rounds',
  tags,
  auth,
  middleware: sub,
  params: micrositeParam,
  response: RoundList,
  handler: ctl.listRounds,
})
route(competitionAdminRouter, {
  method: 'post',
  path: `${base}/rounds`,
  summary: 'P41 Create round (draft)',
  tags,
  auth: `${auth} · Audit: yes`,
  middleware: sub,
  params: micrositeParam,
  body: RoundInput,
  response: RoundDto,
  status: 201,
  handler: ctl.createRound,
})
route(competitionAdminRouter, {
  method: 'put',
  path: `${base}/rounds/:id`,
  summary: 'P41 Update round (course and eligibility while draft only)',
  tags,
  auth: `${auth} · Audit: yes`,
  middleware: sub,
  params: roundParams,
  body: RoundUpdate,
  response: RoundDto,
  handler: ctl.updateRound,
})
route(competitionAdminRouter, {
  method: 'post',
  path: `${base}/rounds/:id/activate`,
  summary: 'P41 draft → open (rubric Σ = 100; one open round per microsite, 409)',
  tags,
  auth: `${auth} · Audit: yes`,
  middleware: sub,
  params: roundParams,
  response: RoundStatusResponse,
  handler: ctl.activate,
})
route(competitionAdminRouter, {
  method: 'post',
  path: `${base}/rounds/:id/judging`,
  summary: 'P41 open → judging (also done by the job at closesAt)',
  tags,
  auth: `${auth} · Audit: yes`,
  middleware: sub,
  params: roundParams,
  response: RoundStatusResponse,
  handler: ctl.startJudging,
})
route(competitionAdminRouter, {
  method: 'post',
  path: `${base}/rounds/:id/close`,
  summary: 'P41 judging → closed (scores and ranks visible to learners)',
  tags,
  auth: `${auth} · Audit: yes`,
  middleware: sub,
  params: roundParams,
  response: RoundStatusResponse,
  handler: ctl.close,
})

/* ------------------------------------------------------------------ P43 rubric */

route(competitionAdminRouter, {
  method: 'get',
  path: `${base}/rounds/:id/rubric`,
  summary: 'P43 Rubric',
  tags,
  auth,
  middleware: sub,
  params: roundParams,
  response: Rubric,
  handler: ctl.rubric,
})
route(competitionAdminRouter, {
  method: 'put',
  path: `${base}/rounds/:id/rubric`,
  summary: 'P43 Save rubric (422 unless Σ = 100; 409 once scoring started; ifMatch)',
  tags,
  auth: `${auth} · rubric locked once scoring starts`,
  middleware: sub,
  params: roundParams,
  body: RubricInput,
  response: Rubric,
  handler: ctl.saveRubric,
})

/* ------------------------------------------------------------------ P42 judges */

route(competitionAdminRouter, {
  method: 'get',
  path: `${base}/judges`,
  summary: 'P42 Judges (roster + pending invitations)',
  tags,
  auth,
  middleware: sub,
  params: micrositeParam,
  query: JudgesQuery,
  response: JudgesPage,
  handler: ctl.judges,
})
route(competitionAdminRouter, {
  method: 'post',
  path: `${base}/judges/invite`,
  summary: 'P42 Invite judges (role judge, scoped to p)',
  tags,
  auth: `${auth} · rate 30/min/user · Audit: yes`,
  middleware: [...sub, userWriteLimiter],
  params: micrositeParam,
  body: InviteJudges,
  response: InviteJudgesResult,
  status: 201,
  handler: ctl.inviteJudges,
})
route(competitionAdminRouter, {
  method: 'put',
  path: `${base}/rounds/:id/assignments`,
  summary: 'P42 Set judges of submissions (judges of p only)',
  tags,
  auth: `${auth} · assignments only to judges invited to p`,
  middleware: sub,
  params: roundParams,
  body: AssignmentsInput,
  response: AssignmentsResult,
  handler: ctl.assignments,
})
route(competitionAdminRouter, {
  method: 'post',
  path: `${base}/rounds/:id/assignments/auto`,
  summary: 'P42 Auto-assign N judges per submitted entry (least loaded first)',
  tags,
  auth: `${auth} · assignments only to judges invited to p`,
  middleware: sub,
  params: roundParams,
  body: AutoAssignInput,
  response: AssignmentsResult,
  handler: ctl.autoAssign,
})

/* ------------------------------------------------------------------ P44 scores */

route(competitionAdminRouter, {
  method: 'get',
  path: `${base}/rounds/:id/scores`,
  summary: 'P44 Scores (mean | median, rank)',
  tags,
  auth,
  middleware: sub,
  params: roundParams,
  query: ScoresQuery,
  response: RoundScores,
  handler: ctl.scores,
})
route(competitionAdminRouter, {
  method: 'get',
  path: `${base}/rounds/:id/scores.csv`,
  summary: 'P44 Scores CSV',
  tags,
  auth: `${auth} · Audit: yes`,
  middleware: sub,
  params: roundParams,
  query: ScoresQuery,
  raw: true,
  produces: 'text/csv',
  handler: ctl.scoresCsv,
})
