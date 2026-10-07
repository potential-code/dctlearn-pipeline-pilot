import { afterAll, beforeEach, describe, expect, test } from 'bun:test'
import { db } from '@server/db/connection'
import {
  competitionRounds,
  competitionScores,
  competitionSubmissions,
} from '@server/db/schema/competition'
import { E } from '@server/db/seed/data'
import { DANIEL_EMAIL } from '@server/db/seed/slices/competition.seed'
import {
  ApplicantsPage,
  JudgeDashboard,
  JudgeSubmission,
  ScoresResult,
} from '@shared/schemas/competition'
import { and, eq } from 'drizzle-orm'
import { expectDenied } from '../helpers/denials'
import { anon, as, PASSWORD } from '../helpers/http'
import { lastMailTo, tokenFromUrl } from '../helpers/mail'
import {
  app,
  type CompetitionFixture,
  competitionBase,
  danielAccepts,
  restoreRealReader,
} from './helpers'

afterAll(restoreRealReader)

let f: CompetitionFixture

beforeEach(async () => {
  f = await competitionBase()
})

const scoresBody = (ids: string[], marks: number[], feedback?: string) => ({
  scores: ids.map((criterionId, i) => ({
    criterionId,
    score: marks[i],
    ...(feedback ? { feedback } : {}),
  })),
})

async function statusOf(id: string) {
  const [row] = await db
    .select({ status: competitionSubmissions.status })
    .from(competitionSubmissions)
    .where(eq(competitionSubmissions.id, id))
  return row?.status
}

/** A third judge for zu through the real invite → accept flow (not assigned to anything). */
async function zaraJoins() {
  const admin = await as(E.aisha!, app)
  const res = await admin
    .post('/api/microsites/zu/admin/judges/invite')
    .send({ emails: ['zara.j@example.com'] })
  expect(res.status).toBe(201)
  const mail = await lastMailTo('zara.j@example.com', 'invitation')
  const token = tokenFromUrl(String(mail!.data.url))
  const accept = await anon(app)
    .post(`/api/public/invitations/${token}/accept`)
    .send({ name: 'Zara Judge', password: PASSWORD, locale: 'en' })
  expect(accept.status).toBe(201)
  return 'zara.j@example.com'
}

describe('P33 judge dashboard', () => {
  test('Noura: submitted entries only (Sara in progress is hidden), Ahmed graded', async () => {
    const res = await (await as(E.noura!, app)).get('/api/judge/dashboard')
    expect(res.status).toBe(200)
    const body = JudgeDashboard.parse(res.body)
    expect(body.kpis).toEqual({ assigned: 1, graded: 1, pending: 0 })
    expect(body.rounds).toHaveLength(1)
    expect(body.rounds[0]).toMatchObject({
      roundId: f.comp.roundId,
      microsite: { id: 'zu' },
      status: 'judging',
      deadline: '2026-10-20T20:00:00.000Z',
      assigned: 1,
      graded: 1,
    })
  })

  test('unassigned judge sees nothing; other roles denied', async () => {
    const zara = await zaraJoins()
    const res = await (await as(zara, app)).get('/api/judge/dashboard')
    expect(res.body).toEqual({ kpis: { assigned: 0, graded: 0, pending: 0 }, rounds: [] })
    await expectDenied(app, (c) => c.get('/api/judge/dashboard'), {
      signedOut: null,
      learner: E.ahmed!,
      subAdmin: E.omar!,
      admin: E.aisha!,
      mentor: E.hessa!,
    })
  })
})

describe('P34 applicants & submission', () => {
  test('applicants: name + microsite only, my score', async () => {
    const noura = await as(E.noura!, app)
    const res = await noura.get(`/api/judge/rounds/${f.comp.roundId}/applicants`)
    expect(res.status).toBe(200)
    const body = ApplicantsPage.parse(res.body)
    expect(body.total).toBe(1)
    expect(body.items[0]).toEqual({
      submissionId: f.comp.submissions.ahmed,
      applicant: { name: 'Ahmed Khan', microsite: expect.objectContaining({ id: 'zu' }) },
      submittedAt: '2026-09-30T10:00:00.000Z',
      status: 'graded',
      myScore: 72,
    })
    expect(JSON.stringify(res.body)).not.toContain('ahmed.k@example.com')
    const pending = await noura.get(`/api/judge/rounds/${f.comp.roundId}/applicants?status=pending`)
    expect(pending.body.total).toBe(0)
    expect(
      (await noura.get(`/api/judge/rounds/${f.comp.roundId}/applicants?status=bogus`)).status,
    ).toBe(422)
  })

  test('submission detail: pitch answers, pdf, rubric, my scores', async () => {
    const res = await (await as(E.noura!, app)).get(
      `/api/judge/submissions/${f.comp.submissions.ahmed}`,
    )
    expect(res.status).toBe(200)
    const body = JudgeSubmission.parse(res.body)
    expect(body.applicant.name).toBe('Ahmed Khan')
    expect(body.pitch.pdfUrl).toContain('.pdf')
    expect(body.pitch.answers).toHaveLength(3)
    expect(body.pitch.answers[0]).toEqual({
      question: { en: 'Name and tagline', ar: 'الاسم والشعار' },
      answer: 'Heritage Pulse — feel the past',
    })
    expect(body.rubric.map((c) => c.weightPct)).toEqual([15, 25, 20, 40])
    expect(body.myScores?.map((s) => s.score)).toEqual([7, 7, 8, 7])
  })

  test('unassigned / not submitted / unknown → 404; judge of another round → 404', async () => {
    const noura = await as(E.noura!, app)
    // Sara is assigned to Noura but has not submitted.
    expect((await noura.get(`/api/judge/submissions/${f.comp.submissions.sara}`)).status).toBe(404)
    expect(
      (await noura.get('/api/judge/submissions/00000000-0000-4000-8000-000000000000')).status,
    ).toBe(404)
    expect((await noura.get('/api/judge/submissions/not-a-uuid')).status).toBe(404)

    const zara = await as(await zaraJoins(), app)
    expect((await zara.get(`/api/judge/rounds/${f.comp.roundId}/applicants`)).status).toBe(404)
    expect((await zara.get(`/api/judge/submissions/${f.comp.submissions.ahmed}`)).status).toBe(404)
    const put = await zara
      .put(`/api/judge/submissions/${f.comp.submissions.ahmed}/scores`)
      .send(scoresBody(f.comp.criterionIds, [5, 5, 5, 5]))
    expect(put.status).toBe(404)

    for (const path of [
      `/api/judge/rounds/${f.comp.roundId}/applicants`,
      `/api/judge/submissions/${f.comp.submissions.ahmed}`,
    ]) {
      await expectDenied(app, (c) => c.get(path), {
        signedOut: null,
        applicant: E.ahmed!,
        subAdmin: E.omar!,
        admin: E.aisha!,
      })
    }
  })
})

describe('P34 scoring', () => {
  test('rescore while judging → weighted total; feedback sanitised', async () => {
    const noura = await as(E.noura!, app)
    const res = await noura
      .put(`/api/judge/submissions/${f.comp.submissions.ahmed}/scores`)
      .send(
        scoresBody(f.comp.criterionIds, [10, 8, 6, 9], '<b>Strong</b> pitch<script>x()</script>'),
      )
    expect(res.status).toBe(200)
    // 15 + 20 + 12 + 36
    expect(ScoresResult.parse(res.body)).toEqual({ weightedTotal: 83 })
    const rows = await db
      .select()
      .from(competitionScores)
      .where(eq(competitionScores.submissionId, f.comp.submissions.ahmed))
    expect(rows).toHaveLength(4)
    expect(rows[0]?.feedback).toBe('Strong pitch')
    // Daniel (pending) is still assigned: not scored yet.
    expect(await statusOf(f.comp.submissions.ahmed)).toBe('submitted')
  })

  test('422: score 0 / 11, missing or unknown criterion, long feedback', async () => {
    const noura = await as(E.noura!, app)
    const url = `/api/judge/submissions/${f.comp.submissions.ahmed}/scores`
    const ids = f.comp.criterionIds
    for (const body of [
      scoresBody(ids, [0, 5, 5, 5]),
      scoresBody(ids, [11, 5, 5, 5]),
      scoresBody(ids, [5.5, 5, 5, 5]),
      scoresBody(ids.slice(0, 3), [5, 5, 5]),
      scoresBody([...ids.slice(0, 3), '00000000-0000-4000-8000-000000000000'], [5, 5, 5, 5]),
      scoresBody([ids[0]!, ids[0]!, ids[1]!, ids[2]!, ids[3]!], [5, 5, 5, 5, 5]),
      scoresBody(ids, [5, 5, 5, 5], 'x'.repeat(1001)),
      {},
    ]) {
      const res = await noura.put(url).send(body)
      expect(res.status).toBe(422)
      expect(res.body.error.code).toBe('validation_failed')
    }
  })

  test('scoring outside judging → 409 (open, closed)', async () => {
    const noura = await as(E.noura!, app)
    const url = `/api/judge/submissions/${f.comp.submissions.ahmed}/scores`
    for (const status of ['open', 'closed']) {
      await db
        .update(competitionRounds)
        .set({ status })
        .where(eq(competitionRounds.id, f.comp.roundId))
      const res = await noura.put(url).send(scoresBody(f.comp.criterionIds, [5, 5, 5, 5]))
      expect(res.status).toBe(409)
    }
  })

  test('two judges score at the same time: independent rows, submission → scored', async () => {
    await danielAccepts(f.comp.danielInvitationId)
    const [noura, daniel] = await Promise.all([as(E.noura!, app), as(DANIEL_EMAIL, app)])
    const url = `/api/judge/submissions/${f.comp.submissions.ahmed}/scores`
    const [a, b] = await Promise.all([
      noura.put(url).send(scoresBody(f.comp.criterionIds, [7, 7, 8, 7])),
      daniel.put(url).send(scoresBody(f.comp.criterionIds, [9, 9, 9, 9])),
    ])
    expect(a.status).toBe(200)
    expect(b.status).toBe(200)
    expect(a.body.weightedTotal).toBe(72)
    expect(b.body.weightedTotal).toBe(90)
    const rows = await db
      .select()
      .from(competitionScores)
      .where(eq(competitionScores.submissionId, f.comp.submissions.ahmed))
    expect(rows).toHaveLength(8)
    expect(await statusOf(f.comp.submissions.ahmed)).toBe('scored')

    // Daniel's dashboard now counts the entry as graded.
    const dash = await daniel.get('/api/judge/dashboard')
    expect(dash.body.kpis).toEqual({ assigned: 1, graded: 1, pending: 0 })
    const mine = await db
      .select()
      .from(competitionScores)
      .where(
        and(
          eq(competitionScores.submissionId, f.comp.submissions.ahmed),
          eq(competitionScores.score, 9),
        ),
      )
    expect(mine).toHaveLength(4)
  })
})
