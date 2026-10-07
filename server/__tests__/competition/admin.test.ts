import { beforeEach, describe, expect, test } from 'bun:test'
import { db } from '@server/db/connection'
import {
  competitionAssignments,
  competitionRounds,
  competitionSubmissions,
} from '@server/db/schema/competition'
import { auditLog } from '@server/db/schema/identity'
import { microsites } from '@server/db/schema/microsites'
import { E } from '@server/db/seed/data'
import { DANIEL_EMAIL } from '@server/db/seed/slices/competition.seed'
import { runSchedule } from '@server/jobs/runtime'
import { setNow } from '@server/lib/clock'
import {
  AssignmentsResult,
  InviteJudgesResult,
  JudgesPage,
  RoundDto,
  RoundList,
  RoundScores,
  Rubric,
} from '@shared/schemas/competition'
import { eq } from 'drizzle-orm'
import { expectDenied } from '../helpers/denials'
import { userByEmail } from '../helpers/fixtures'
import { anon, as, PASSWORD } from '../helpers/http'
import { lastMailTo, tokenFromUrl } from '../helpers/mail'
import { app, type CompetitionFixture, competitionBase, danielAccepts } from './helpers'

let f: CompetitionFixture

beforeEach(async () => {
  f = await competitionBase()
})

const base = '/api/microsites/zu/admin'
const rubric4 = [
  { question: { en: 'Idea', ar: '' }, weightPct: 30, order: 0 },
  { question: { en: 'Pitch', ar: '' }, weightPct: 70, order: 1 },
]
const newRound = (over: Record<string, unknown> = {}) => ({
  name: { en: 'Spring Challenge 2027', ar: 'تحدي الربيع' },
  description: { en: '<p>Hello</p><script>x()</script>', ar: '' },
  opensAt: '2027-03-01T00:00:00Z',
  closesAt: '2027-03-20T00:00:00Z',
  courseId: f.c13.id,
  ...over,
})

async function audits(action: string) {
  return db.select().from(auditLog).where(eq(auditLog.action, action))
}

/** Draft round with a valid rubric, via the API. */
async function draftWithRubric() {
  const admin = await as(E.aisha!, app)
  const created = await admin.post(`${base}/rounds`).send(newRound())
  expect(created.status).toBe(201)
  const rubric = await admin
    .put(`${base}/rounds/${created.body.id}/rubric`)
    .send({ criteria: rubric4 })
  expect(rubric.status).toBe(200)
  return { admin, id: created.body.id as string }
}

describe('P41 rounds', () => {
  test('list + create (draft, sanitised) + update; 422 rules', async () => {
    const admin = await as(E.aisha!, app)
    const list = await admin.get(`${base}/rounds`)
    expect(list.status).toBe(200)
    expect(RoundList.parse(list.body).items.map((r) => r.status)).toEqual(['judging'])

    const created = await admin.post(`${base}/rounds`).send(newRound())
    expect(created.status).toBe(201)
    const round = RoundDto.parse(created.body)
    expect(round).toMatchObject({ status: 'draft', eligibilityMinProgressPct: 80 })
    expect(round.description.en).toBe('<p>Hello</p>')
    expect(await audits('round.create')).toHaveLength(1)

    const upd = await admin
      .put(`${base}/rounds/${round.id}`)
      .send({ name: { en: 'Renamed', ar: '' }, eligibilityMinProgressPct: 60 })
    expect(upd.status).toBe(200)
    expect(upd.body).toMatchObject({ name: { en: 'Renamed' }, eligibilityMinProgressPct: 60 })

    for (const body of [
      newRound({ courseId: f.courses.C01!.id }), // not a zu course
      newRound({ closesAt: '2027-02-01T00:00:00Z' }),
      newRound({ name: { en: '', ar: '' } }),
      newRound({ eligibilityMinProgressPct: 101 }),
    ]) {
      expect((await admin.post(`${base}/rounds`).send(body)).status).toBe(422)
    }
    // Course/eligibility of a non-draft round are fixed.
    const locked = await admin
      .put(`${base}/rounds/${f.comp.roundId}`)
      .send({ eligibilityMinProgressPct: 50 })
    expect(locked.status).toBe(409)
    expect(
      (await admin.put(`${base}/rounds/00000000-0000-4000-8000-000000000000`).send({})).status,
    ).toBe(404)
  })

  test('denied: signed out, learner, judge, sub admin of another microsite; feature off', async () => {
    await expectDenied(app, (c) => c.get(`${base}/rounds`), {
      signedOut: null,
      learner: E.ahmed!,
      judge: E.noura!,
      otherSubAdmin: E.omar!,
    })
    await expectDenied(app, (c) => c.post(`${base}/rounds`).send(newRound()), {
      signedOut: null,
      learner: E.ahmed!,
      otherSubAdmin: E.omar!,
    })
    const off = await (await as(E.omar!, app)).get('/api/microsites/employees/admin/rounds')
    expect(off.status).toBe(404)
    expect(off.body.error.code).toBe('feature_off')
    // A sub admin of zu (role sub_admin) is allowed.
    await db
      .update(microsites)
      .set({ subAdminId: f.users.camille!.id })
      .where(eq(microsites.slug, 'zu'))
    const camille = await (await as(E.camille!, app)).get(`${base}/rounds`)
    expect(camille.status).toBe(200)
    // A zu round id under another microsite → 404 (scoped).
    const admin = await as(E.aisha!, app)
    await db.update(microsites).set({ competitionEnabled: true }).where(eq(microsites.slug, 'znm'))
    expect(
      (await admin.get(`/api/microsites/znm/admin/rounds/${f.comp.roundId}/rubric`)).status,
    ).toBe(404)
  })

  test('activate: rubric must total 100 (409), one open round per microsite (409), audited', async () => {
    const admin = await as(E.aisha!, app)
    const bare = await admin.post(`${base}/rounds`).send(newRound())
    const noRubric = await admin.post(`${base}/rounds/${bare.body.id}/activate`)
    expect(noRubric.status).toBe(409)

    const { id } = await draftWithRubric()
    const ok = await admin.post(`${base}/rounds/${id}/activate`)
    expect(ok.status).toBe(200)
    expect(ok.body).toEqual({ status: 'open' })
    expect(await audits('round.activate')).toHaveLength(1)

    const second = await draftWithRubric()
    const clash = await admin.post(`${base}/rounds/${second.id}/activate`)
    expect(clash.status).toBe(409)
    // Not a draft any more.
    expect((await admin.post(`${base}/rounds/${id}/activate`)).status).toBe(409)
    // The partial unique index also guards against a direct second open round.
    let raced: unknown = null
    try {
      await db
        .update(competitionRounds)
        .set({ status: 'open' })
        .where(eq(competitionRounds.id, second.id))
    } catch (error) {
      raced = error
    }
    expect(raced).not.toBeNull()
  })

  test('open → judging (sub admin) → closed; wrong moves 409', async () => {
    const { admin, id } = await draftWithRubric()
    expect((await admin.post(`${base}/rounds/${id}/judging`)).status).toBe(409)
    expect((await admin.post(`${base}/rounds/${id}/close`)).status).toBe(409)
    await admin.post(`${base}/rounds/${id}/activate`)
    const judging = await admin.post(`${base}/rounds/${id}/judging`)
    expect(judging.body).toEqual({ status: 'judging' })
    const closed = await admin.post(`${base}/rounds/${id}/close`)
    expect(closed.body).toEqual({ status: 'closed' })
    expect((await admin.post(`${base}/rounds/${id}/close`)).status).toBe(409)
    expect(await audits('round.judging')).toHaveLength(1)
    expect(await audits('round.close')).toHaveLength(1)
    // Closed rounds cannot be edited.
    expect(
      (await admin.put(`${base}/rounds/${id}`).send({ name: { en: 'X', ar: '' } })).status,
    ).toBe(409)
  })

  test('job: open round past closesAt → judging; assigned judges e-mailed', async () => {
    await db
      .update(competitionRounds)
      .set({ status: 'open', closesAt: new Date('2026-10-06T08:00:00Z') })
      .where(eq(competitionRounds.id, f.comp.roundId))
    // Before closesAt nothing moves.
    setNow('2026-10-06T07:00:00Z')
    expect(await runSchedule('competition.round_close')).toBe(0)
    setNow('2026-10-06T09:00:00Z')
    expect(await runSchedule('competition.round_close')).toBe(1)
    const [round] = await db
      .select()
      .from(competitionRounds)
      .where(eq(competitionRounds.id, f.comp.roundId))
    expect(round?.status).toBe('judging')
    const [entry] = await audits('round.judging')
    expect(entry?.meta).toEqual({ trigger: 'job' })
    const mail = await lastMailTo(E.noura!, 'judge-round-deadline')
    expect(mail?.subject).toContain('24-Hour Challenge 2026')
    expect(mail?.data.assigned).toBe(1)
    expect(await runSchedule('competition.round_close')).toBe(0)
  })
})

describe('P43 rubric', () => {
  test('R1: Σ 100, locked once scored (409)', async () => {
    const admin = await as(E.aisha!, app)
    const res = await admin.get(`${base}/rounds/${f.comp.roundId}/rubric`)
    expect(res.status).toBe(200)
    const body = Rubric.parse(res.body)
    expect(body.criteria.map((c) => c.weightPct)).toEqual([15, 25, 20, 40])
    expect(body.locked).toBe(true)
    const put = await admin
      .put(`${base}/rounds/${f.comp.roundId}/rubric`)
      .send({ criteria: rubric4, ifMatch: body.updatedAt })
    expect(put.status).toBe(409)
    expect(put.body.error.code).toBe('locked')
  })

  test('422 unless Σ = 100; edit keeps ids; stale ifMatch 409', async () => {
    const { admin, id } = await draftWithRubric()
    for (const criteria of [
      [{ question: { en: 'A', ar: '' }, weightPct: 90, order: 0 }],
      [
        { question: { en: 'A', ar: '' }, weightPct: 60, order: 0 },
        { question: { en: 'B', ar: '' }, weightPct: 60, order: 1 },
      ],
      [{ question: { en: '', ar: '' }, weightPct: 100, order: 0 }],
      [],
    ]) {
      const res = await admin.put(`${base}/rounds/${id}/rubric`).send({ criteria })
      expect(res.status).toBe(422)
    }
    const current = Rubric.parse((await admin.get(`${base}/rounds/${id}/rubric`)).body)
    expect(current.locked).toBe(false)
    const edited = await admin.put(`${base}/rounds/${id}/rubric`).send({
      ifMatch: current.updatedAt,
      criteria: [
        { id: current.criteria[0]!.id, question: { en: 'Idea!', ar: '' }, weightPct: 50, order: 0 },
        { question: { en: 'New', ar: '' }, weightPct: 50, order: 1 },
      ],
    })
    expect(edited.status).toBe(200)
    expect(edited.body.criteria[0]).toMatchObject({ id: current.criteria[0]!.id, weightPct: 50 })
    expect(edited.body.criteria).toHaveLength(2)
    const stale = await admin
      .put(`${base}/rounds/${id}/rubric`)
      .send({ ifMatch: current.updatedAt, criteria: rubric4 })
    expect(stale.status).toBe(409)
  })
})

describe('P42 judges & assignments', () => {
  test('list: Noura active, Daniel invited; invite; accept puts the judge on the roster', async () => {
    const admin = await as(E.aisha!, app)
    const list = JudgesPage.parse((await admin.get(`${base}/judges`)).body)
    expect(list.items).toEqual([
      expect.objectContaining({ email: DANIEL_EMAIL, status: 'invited', assigned: 1, graded: 0 }),
      expect.objectContaining({ name: 'Noura Al Kaabi', status: 'active', assigned: 1, graded: 1 }),
    ])
    expect(list.items[0]?.invitationId).toBe(f.comp.danielInvitationId)

    const inv = await admin
      .post(`${base}/judges/invite`)
      .send({ emails: ['zara.j@example.com', E.noura!, 'nope'] })
    expect(inv.status).toBe(201)
    const result = InviteJudgesResult.parse(inv.body)
    expect(result.created).toBe(1)
    expect(result.skipped.map((s) => s.reason).sort()).toEqual(['already_judge', 'invalid_email'])
    const mail = await lastMailTo('zara.j@example.com', 'invitation')
    expect(mail?.html).toContain('a judge')
    const token = tokenFromUrl(String(mail!.data.url))
    const accept = await anon(app)
      .post(`/api/public/invitations/${token}/accept`)
      .send({ name: 'Zara Judge', password: PASSWORD })
    expect(accept.status).toBe(201)
    const after = JudgesPage.parse((await admin.get(`${base}/judges`)).body)
    expect(after.total).toBe(3)
    expect(after.items.find((j) => j.email === 'zara.j@example.com')).toMatchObject({
      status: 'active',
      name: 'Zara Judge',
    })

    await expectDenied(app, (c) => c.post(`${base}/judges/invite`).send({ emails: ['x@y.com'] }), {
      learner: E.ahmed!,
      judge: E.noura!,
      otherSubAdmin: E.omar!,
    })
    expect((await admin.post(`${base}/judges/invite`).send({ emails: [] })).status).toBe(422)
  })

  test('assignments: judges of p only (422), replace, auto-assign least loaded', async () => {
    const admin = await as(E.aisha!, app)
    await danielAccepts(f.comp.danielInvitationId)
    const url = `${base}/rounds/${f.comp.roundId}/assignments`
    const bad = await admin.put(url).send({
      assignments: [{ submissionId: f.comp.submissions.ahmed, judgeUserIds: [f.users.ahmed!.id] }],
    })
    expect(bad.status).toBe(422)
    expect(Object.keys(bad.body.error.fields)).toEqual(['assignments.0.judgeUserIds'])
    const wrongSub = await admin.put(url).send({
      assignments: [
        { submissionId: '00000000-0000-4000-8000-000000000000', judgeUserIds: [f.users.noura!.id] },
      ],
    })
    expect(wrongSub.status).toBe(422)

    // Ahmed → Noura only (Daniel removed): Noura already scored → scored.
    const ok = await admin.put(url).send({
      assignments: [{ submissionId: f.comp.submissions.ahmed, judgeUserIds: [f.users.noura!.id] }],
    })
    expect(ok.status).toBe(200)
    expect(AssignmentsResult.parse(ok.body)).toEqual({ assigned: 1 })
    const [ahmed] = await db
      .select()
      .from(competitionSubmissions)
      .where(eq(competitionSubmissions.id, f.comp.submissions.ahmed))
    expect(ahmed?.status).toBe('scored')

    // Sara submits; auto-assign 2 per entry → Sara gets Daniel (least loaded), Ahmed gets Daniel.
    await db
      .update(competitionSubmissions)
      .set({ status: 'submitted', submittedAt: new Date('2026-10-05T10:00:00Z') })
      .where(eq(competitionSubmissions.id, f.comp.submissions.sara))
    const auto = await admin
      .post(`${base}/rounds/${f.comp.roundId}/assignments/auto`)
      .send({ judgesPerSubmission: 2 })
    expect(auto.status).toBe(200)
    expect(auto.body).toEqual({ assigned: 2 })
    const rows = await db.select().from(competitionAssignments)
    expect(rows).toHaveLength(4)
    expect(
      (
        await admin
          .post(`${base}/rounds/${f.comp.roundId}/assignments/auto`)
          .send({ judgesPerSubmission: 0 })
      ).status,
    ).toBe(422)
    await expectDenied(app, (c) => c.put(url).send({ assignments: [] }), {
      judge: E.noura!,
      otherSubAdmin: E.omar!,
    })
  })
})

describe('P44 scores', () => {
  test("Noura's 72.0 → rank 1 (mean = median with one judge)", async () => {
    const admin = await as(E.aisha!, app)
    for (const aggregation of ['mean', 'median']) {
      const res = await admin.get(
        `${base}/rounds/${f.comp.roundId}/scores?aggregation=${aggregation}`,
      )
      expect(res.status).toBe(200)
      const body = RoundScores.parse(res.body)
      expect(body.aggregation).toBe(aggregation as 'mean')
      expect(body.rows).toHaveLength(1)
      expect(body.rows[0]).toMatchObject({
        submissionId: f.comp.submissions.ahmed,
        applicant: { name: 'Ahmed Khan', email: 'ahmed.k@example.com' },
        finalScore: 72,
        rank: 1,
      })
      expect(body.rows[0]?.judges).toEqual([
        {
          judgeName: 'Noura Al Kaabi',
          total: 72,
          perCriterion: f.comp.criterionIds.map((criterionId, i) => ({
            criterionId,
            score: [7, 7, 8, 7][i]!,
          })),
        },
      ])
    }
    expect(
      (await admin.get(`${base}/rounds/${f.comp.roundId}/scores?aggregation=max`)).status,
    ).toBe(422)
  })

  test('three judges: mean vs median, ranks across entries; CSV audited', async () => {
    const admin = await as(E.aisha!, app)
    await danielAccepts(f.comp.danielInvitationId)
    // Zara joins and Sara submits; Ahmed → Noura, Daniel, Zara; Sara → Noura.
    const inv = await admin.post(`${base}/judges/invite`).send({ emails: ['zara.j@example.com'] })
    expect(inv.status).toBe(201)
    const token = tokenFromUrl(String((await lastMailTo('zara.j@example.com'))!.data.url))
    await anon(app)
      .post(`/api/public/invitations/${token}/accept`)
      .send({ name: 'Zara Judge', password: PASSWORD })
    const zara = (await userByEmail('zara.j@example.com')).id
    await db
      .update(competitionSubmissions)
      .set({ status: 'submitted', submittedAt: new Date('2026-10-05T10:00:00Z') })
      .where(eq(competitionSubmissions.id, f.comp.submissions.sara))
    const assign = await admin.put(`${base}/rounds/${f.comp.roundId}/assignments`).send({
      assignments: [
        {
          submissionId: f.comp.submissions.ahmed,
          judgeUserIds: [f.users.noura!.id, zara, (await userByEmail(DANIEL_EMAIL)).id],
        },
      ],
    })
    expect(assign.status).toBe(200)

    const score = async (email: string, sub: string, marks: number[]) => {
      const res = await (await as(email, app)).put(`/api/judge/submissions/${sub}/scores`).send({
        scores: f.comp.criterionIds.map((criterionId, i) => ({ criterionId, score: marks[i] })),
      })
      expect(res.status).toBe(200)
      return res.body.weightedTotal
    }
    expect(await score(DANIEL_EMAIL, f.comp.submissions.ahmed, [9, 9, 9, 9])).toBe(90)
    expect(await score('zara.j@example.com', f.comp.submissions.ahmed, [5, 5, 5, 5])).toBe(50)
    expect(await score(E.noura!, f.comp.submissions.sara, [7, 7, 7, 8])).toBe(74)

    const mean = RoundScores.parse(
      (await admin.get(`${base}/rounds/${f.comp.roundId}/scores?aggregation=mean`)).body,
    )
    const byId = (rows: typeof mean.rows, id: string) => rows.find((r) => r.submissionId === id)!
    expect(byId(mean.rows, f.comp.submissions.ahmed)).toMatchObject({ finalScore: 70.67, rank: 2 })
    expect(byId(mean.rows, f.comp.submissions.sara)).toMatchObject({ finalScore: 74, rank: 1 })
    expect(byId(mean.rows, f.comp.submissions.ahmed).judges).toHaveLength(3)

    const median = RoundScores.parse(
      (await admin.get(`${base}/rounds/${f.comp.roundId}/scores?aggregation=median`)).body,
    )
    expect(byId(median.rows, f.comp.submissions.ahmed)).toMatchObject({ finalScore: 72, rank: 2 })

    const csv = await admin.get(`${base}/rounds/${f.comp.roundId}/scores.csv?aggregation=median`)
    expect(csv.status).toBe(200)
    expect(csv.headers['content-type']).toContain('text/csv')
    const lines = csv.text.trim().split('\r\n')
    expect(lines[0]).toBe('rank,applicant,email,final_score,aggregation,judges')
    expect(lines[1]).toStartWith('1,Sara Haddad,sara.h@example.com,74,median')
    expect(lines[2]).toStartWith('2,Ahmed Khan,ahmed.k@example.com,72,median')
    expect(await audits('scores.export')).toHaveLength(1)

    for (const path of ['scores', 'scores.csv']) {
      await expectDenied(app, (c) => c.get(`${base}/rounds/${f.comp.roundId}/${path}`), {
        signedOut: null,
        learner: E.ahmed!,
        judge: E.noura!,
        otherSubAdmin: E.omar!,
      })
    }
    // Learners only see score and rank once closed.
    await admin.post(`${base}/rounds/${f.comp.roundId}/close`)
    const dash = await (await as(E.ahmed!, app)).get('/api/microsites/zu/competition/dashboard')
    expect(dash.body).toMatchObject({
      status: 'scored',
      score: { total: 70.67, outOf: 100 },
      rank: 2,
    })
  })
})
