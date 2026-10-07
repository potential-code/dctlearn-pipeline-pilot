import { beforeAll, describe, expect, test } from 'bun:test'
import { db } from '@server/db/connection'
import { assessmentAttempts, assessmentQuestions } from '@server/db/schema/learning'
import { E } from '@server/db/seed/data'
import { AdminCourseDetail, AssessmentView, AttemptResult } from '@shared/schemas/learning'
import { and, eq } from 'drizzle-orm'
import { expectDenied } from '../helpers/denials'
import { userByEmail } from '../helpers/fixtures'
import { as } from '../helpers/http'
import { app, freshLearning, type LearningSeed } from './helpers'

let seed: LearningSeed
beforeAll(async () => {
  seed = await freshLearning()
}, 120_000)

describe('Assessments', () => {
  test('C08 quiz is locked until unit 1 is complete (sequential)', async () => {
    const quiz = seed.learning.content.C08!.assessments.quiz!
    const res = await (await as(E.mona!, app)).get(`/api/assessments/${quiz}`)
    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('locked')
  })

  test('GET has no answer keys; failing the only attempt reveals them; a second attempt is 409', async () => {
    const c08 = seed.learning.content.C08!
    const mona = await as(E.mona!, app)
    for (const b of c08.blocks[0]!)
      await mona.post(`/api/units/${c08.units[0]}/blocks/${b}/progress`).send({ completed: true })
    expect((await mona.post(`/api/units/${c08.units[0]}/complete`)).status).toBe(200)

    const res = await mona.get(`/api/assessments/${c08.assessments.quiz}`)
    expect(res.status).toBe(200)
    AssessmentView.parse(res.body)
    expect(res.body).toMatchObject({
      passMark: 80,
      attemptsAllowed: 1,
      attemptsUsed: 0,
      type: 'quiz_blocking',
    })
    expect(JSON.stringify(res.body)).not.toContain('correct')

    expect(
      (await mona.post(`/api/assessments/${c08.assessments.quiz}/attempts`).send({ answers: 'x' }))
        .status,
    ).toBe(422)
    expect(
      (
        await mona
          .post(`/api/assessments/${c08.assessments.quiz}/attempts`)
          .send({ answers: [{ questionId: crypto.randomUUID(), optionIds: [] }] })
      ).status,
    ).toBe(422)

    const [q1, q2] = res.body.questions
    const wrong = await mona.post(`/api/assessments/${c08.assessments.quiz}/attempts`).send({
      answers: [
        { questionId: q1.id, optionIds: [q1.options[0].id] },
        { questionId: q2.id, optionIds: [q2.options[1].id] },
      ],
    })
    expect(wrong.status).toBe(200)
    AttemptResult.parse(wrong.body)
    expect(wrong.body).toMatchObject({ scorePct: 0, passed: false, showAnswers: true })
    expect(Object.keys(wrong.body.correct).sort()).toEqual([q1.id, q2.id].sort())

    const again = await mona
      .post(`/api/assessments/${c08.assessments.quiz}/attempts`)
      .send({ answers: [] })
    expect(again.status).toBe(409)
    expect(again.body.error.code).toBe('locked')
    expect((await mona.get(`/api/assessments/${c08.assessments.quiz}`)).body.attemptsUsed).toBe(1)

    // The blocking quiz keeps unit 2 from completing.
    for (const b of c08.blocks[1]!)
      await mona.post(`/api/units/${c08.units[1]}/blocks/${b}/progress`).send({ completed: true })
    const unit = await mona.get(`/api/units/${c08.units[1]}`)
    expect(unit.body.completion).toEqual({ canComplete: false, reason: 'assessment_required' })
    expect((await mona.post(`/api/units/${c08.units[1]}/complete`)).status).toBe(409)
  })

  test('double submit: two parallel attempts on a 1-attempt quiz store one attempt', async () => {
    const c08 = seed.learning.content.C08!
    const saeed = await as(E.saeed!, app)
    for (const b of c08.blocks[0]!)
      await saeed.post(`/api/units/${c08.units[0]}/blocks/${b}/progress`).send({ completed: true })
    await saeed.post(`/api/units/${c08.units[0]}/complete`)
    const [a, b] = await Promise.all([
      saeed.post(`/api/assessments/${c08.assessments.quiz}/attempts`).send({ answers: [] }),
      saeed.post(`/api/assessments/${c08.assessments.quiz}/attempts`).send({ answers: [] }),
    ])
    expect([a.status, b.status].sort()).toEqual([200, 409])
    const u = await userByEmail(E.saeed!)
    const rows = await db
      .select()
      .from(assessmentAttempts)
      .where(
        and(
          eq(assessmentAttempts.userId, u.id),
          eq(assessmentAttempts.assessmentId, c08.assessments.quiz!),
        ),
      )
    expect(rows).toHaveLength(1)
  })

  test('survey assessment: always passes, no answer keys', async () => {
    const survey = seed.learning.content.C01!.assessments.survey!
    const mona = await as(E.mona!, app)
    const view = await mona.get(`/api/assessments/${survey}`)
    AssessmentView.parse(view.body)
    const res = await mona.post(`/api/assessments/${survey}/attempts`).send({
      answers: [{ questionId: view.body.questions[2].id, text: 'Heritage' }],
    })
    expect(res.body).toMatchObject({ scorePct: 100, passed: true, showAnswers: false })
    expect(res.body.correct).toBeUndefined()
  })

  test('access: non-member 404, mentor 403, signed out 401', async () => {
    const survey = seed.learning.content.C01!.assessments.survey!
    await expectDenied(
      app,
      (c) => c.get(`/api/assessments/${survey}`),
      { signedOut: null, nonMember: E.elise!, mentor: E.hessa!, judge: E.noura! },
      { nonMember: 404 },
    )
    expect(
      (await (await as(E.mona!, app)).get(`/api/assessments/${crypto.randomUUID()}`)).status,
    ).toBe(404)
  })

  test('§9.5 editing a question after attempts creates a new version; old attempts keep their score', async () => {
    const final = seed.learning.content.C01!.assessments.final!
    const courseId = seed.courses.C01!.id
    const admin = await as(E.aisha!, app)
    const before = AdminCourseDetail.parse((await admin.get(`/api/admin/courses/${courseId}`)).body)
    const a = before.assessments.find((x) => x.id === final)!
    expect(a.version).toBe(1)
    const q = a.questions[0]!
    const edit = await admin
      .put(`/api/admin/courses/${courseId}/assessments/${final}/questions/${q.id}`)
      .send({
        text: { en: 'What does DCT stand for (2026)?', ar: 'ماذا يعني DCT؟' },
        type: 'multiple_choice',
        options: q.options.map((o) => ({ text: o.text, correct: o.correct })),
        points: 1,
      })
    expect(edit.status).toBe(200)
    expect(edit.body.id).not.toBe(q.id)
    const after = AdminCourseDetail.parse((await admin.get(`/api/admin/courses/${courseId}`)).body)
    const a2 = after.assessments.find((x) => x.id === final)!
    expect(a2.version).toBe(2)
    expect(a2.questions).toHaveLength(5)
    expect(a2.questions[0]!.text.en).toBe('What does DCT stand for (2026)?')
    const old = await db
      .select()
      .from(assessmentQuestions)
      .where(and(eq(assessmentQuestions.assessmentId, final), eq(assessmentQuestions.version, 1)))
    expect(old).toHaveLength(5)
    const saeed = await userByEmail(E.saeed!)
    const [attempt] = await db
      .select()
      .from(assessmentAttempts)
      .where(
        and(eq(assessmentAttempts.userId, saeed.id), eq(assessmentAttempts.assessmentId, final)),
      )
    expect(attempt).toMatchObject({ version: 1, scorePct: 100, passed: true })
    // A second edit on the new version (no attempts yet) stays on version 2.
    await admin
      .put(`/api/admin/courses/${courseId}/assessments/${final}/questions/${edit.body.id}`)
      .send({
        text: { en: 'What does DCT stand for?', ar: '' },
        type: 'multiple_choice',
        options: q.options,
        points: 2,
      })
    const a3 = AdminCourseDetail.parse(
      (await admin.get(`/api/admin/courses/${courseId}`)).body,
    ).assessments.find((x) => x.id === final)!
    expect(a3.version).toBe(2)
    expect(a3.questions[0]!.points).toBe(2)
  })
})
