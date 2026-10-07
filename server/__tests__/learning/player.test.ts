import { beforeAll, describe, expect, test } from 'bun:test'
import { db } from '@server/db/connection'
import { courseCertificates, enrolments, pointsLedger } from '@server/db/schema/catalog'
import { assessmentQuestions, blockProgress } from '@server/db/schema/learning'
import { E } from '@server/db/seed/data'
import { actionPlanReader, onActionPlanSaved } from '@server/services/seams/action-plan.seam'
import {
  ActionPlanSaved,
  CertificateCheck,
  CourseView,
  ScormGet,
  SurveySaved,
  UnitCompleteResponse,
  UnitView,
} from '@shared/schemas/learning'
import { and, eq } from 'drizzle-orm'
import { expectDenied } from '../helpers/denials'
import { userByEmail } from '../helpers/fixtures'
import { anon, as } from '../helpers/http'
import { lastMailTo } from '../helpers/mail'
import { app, freshLearning, type LearningSeed } from './helpers'

let seed: LearningSeed
let C01: LearningSeed['learning']['content'][string]
const saved: string[] = []
onActionPlanSaved(async (_tx, input) => {
  saved.push(input.blockId)
})

beforeAll(async () => {
  seed = await freshLearning()
  C01 = seed.learning.content.C01!
}, 120_000)

const courseUrl = (p: string, key: string) =>
  `/api/microsites/${p}/courses/${seed.courses[key]!.slug}`
const blockUrl = (u: number, b: number, tail: string) =>
  `/api/units/${C01.units[u]}/blocks/${C01.blocks[u]![b]}/${tail}`

async function ledgerCount(email: string, sourceType: string, sourceId: string) {
  const u = await userByEmail(email)
  const rows = await db
    .select()
    .from(pointsLedger)
    .where(
      and(
        eq(pointsLedger.userId, u.id),
        eq(pointsLedger.sourceType, sourceType),
        eq(pointsLedger.sourceId, sourceId),
      ),
    )
  return rows.length
}

describe('P16 course page', () => {
  test('Mona sees C01 at 25 %: U1 completed, U2 available, U3–U4 locked (sequential)', async () => {
    const res = await (await as(E.mona!, app)).get(courseUrl('employees', 'C01'))
    expect(res.status).toBe(200)
    CourseView.parse(res.body)
    expect(res.body.course).toMatchObject({
      progressPct: 25,
      state: 'in_progress',
      isMandatory: true,
    })
    expect(res.body.modules).toHaveLength(2)
    const statuses = res.body.modules.flatMap((m: { units: { status: string }[] }) =>
      m.units.map((u) => u.status),
    )
    expect(statuses).toEqual(['completed', 'available', 'locked', 'locked'])
    expect(res.body.modules[0].units[1].hasAssessment).toBe(true)
    expect(res.body.finalAssessment).toMatchObject({ status: 'locked' })
    expect(res.body.certificate).toBeUndefined()
  })

  test('Saeed (completed) gets his certificate with a signed PDF URL', async () => {
    const res = await (await as(E.saeed!, app)).get(courseUrl('employees', 'C01'))
    CourseView.parse(res.body)
    expect(res.body.course).toMatchObject({ progressPct: 100, state: 'completed' })
    expect(res.body.certificate.serial).toBe('DCT-2026-C01SAE01')
    expect(res.body.certificate.pdfUrl).toStartWith('/api/files/')
    expect(res.body.finalAssessment.status).toBe('passed')
  })

  test('access: non-member 403, other roles 403, signed out 401; course not in p → 404', async () => {
    await expectDenied(app, (c) => c.get(courseUrl('employees', 'C01')), {
      signedOut: null,
      nonMember: E.elise!,
      mentor: E.hessa!,
      judge: E.noura!,
      otherSubAdmin: E.camille!,
    })
    const mona = await as(E.mona!, app)
    expect((await mona.get(courseUrl('employees', 'C09'))).status).toBe(404)
    expect((await mona.get('/api/microsites/employees/courses/no-such-course')).status).toBe(404)
    expect((await (await as(E.omar!, app)).get(courseUrl('employees', 'C01'))).status).toBe(200)
  })
})

describe('P16 unit view', () => {
  test('U2 payloads by type; completion blocked until required blocks are done', async () => {
    const res = await (await as(E.mona!, app)).get(`/api/units/${C01.units[1]}`)
    expect(res.status).toBe(200)
    UnitView.parse(res.body)
    expect(res.body.blocks.map((b: { type: string }) => b.type)).toEqual([
      'audio',
      'text',
      'resources',
    ])
    expect(res.body.blocks[0].payload.title.en).toBe('DCT Flow — Our sectors')
    expect(res.body.unit).toMatchObject({ prevUnitId: C01.units[0], nextUnitId: C01.units[2] })
    expect(res.body.completion).toEqual({ canComplete: false, reason: 'blocks_incomplete' })
  })

  test('U1 shows every showcase block (youtube, text, case study, quotes)', async () => {
    const res = await (await as(E.mona!, app)).get(`/api/units/${C01.units[0]}`)
    UnitView.parse(res.body)
    expect(res.body.blocks.map((b: { type: string }) => b.type)).toEqual([
      'youtube',
      'text',
      'case_study',
      'quotes',
    ])
    expect(res.body.blocks[3].payload.items).toHaveLength(2)
    expect(res.body.blocks.every((b: { completed: boolean }) => b.completed)).toBe(true)
  })

  test('locked unit → 409 locked (also for block writes and completion)', async () => {
    const mona = await as(E.mona!, app)
    const res = await mona.get(`/api/units/${C01.units[2]}`)
    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('locked')
    expect((await mona.post(`/api/units/${C01.units[2]}/complete`)).body.error.code).toBe('locked')
    expect(
      (await mona.post(blockUrl(2, 1, 'progress')).send({ completed: true })).body.error.code,
    ).toBe('locked')
  })

  test('access by id: no microsite with the course → 404; mentor/judge 403; signed out 401', async () => {
    await expectDenied(
      app,
      (c) => c.get(`/api/units/${C01.units[0]}`),
      {
        signedOut: null,
        notInAnyMicrosite: E.elise!,
        mentor: E.hessa!,
        judge: E.noura!,
        otherSubAdmin: E.camille!,
      },
      { notInAnyMicrosite: 404, otherSubAdmin: 404 },
    )
    expect((await (await as(E.aisha!, app)).get(`/api/units/${C01.units[0]}`)).status).toBe(200)
    expect((await (await as(E.mona!, app)).get('/api/units/not-a-uuid')).status).toBe(404)
  })
})

describe('P16 progress and completion', () => {
  test('block progress: invalid body 422; video position comes back as resumeAtSec', async () => {
    const mona = await as(E.mona!, app)
    expect((await mona.post(blockUrl(1, 0, 'progress')).send({ completed: 'yes' })).status).toBe(
      422,
    )
    expect(
      (await mona.post(blockUrl(0, 0, 'progress')).send({ completed: false, positionSec: 42 }))
        .status,
    ).toBe(204)
    const unit = await mona.get(`/api/units/${C01.units[0]}`)
    expect(unit.body.blocks[0].payload.resumeAtSec).toBe(42)
  })

  test('complete U2: 409 before blocks, then 10 points once; double click awards once', async () => {
    const mona = await as(E.mona!, app)
    const early = await mona.post(`/api/units/${C01.units[1]}/complete`)
    expect(early.status).toBe(409)
    for (const b of [0, 1, 2])
      expect((await mona.post(blockUrl(1, b, 'progress')).send({ completed: true })).status).toBe(
        204,
      )
    const first = await mona.post(`/api/units/${C01.units[1]}/complete`)
    expect(first.status).toBe(200)
    UnitCompleteResponse.parse(first.body)
    expect(first.body).toMatchObject({
      unitStatus: 'completed',
      courseProgressPct: 50,
      nextUnitId: C01.units[2],
      pointsAwarded: 10,
    })
    const again = await mona.post(`/api/units/${C01.units[1]}/complete`)
    expect(again.status).toBe(200)
    expect(again.body.pointsAwarded).toBe(0)
    expect(await ledgerCount(E.mona!, 'unit', C01.units[1]!)).toBe(1)
    const mona_ = await userByEmail(E.mona!)
    const [e] = await db
      .select()
      .from(enrolments)
      .where(and(eq(enrolments.userId, mona_.id), eq(enrolments.courseId, seed.courses.C01!.id)))
    expect(e).toMatchObject({ progressPct: 50, state: 'in_progress', nextUnitId: C01.units[2] })
    expect(e!.lastActivityAt).not.toBeNull()
  })

  test('SCORM block: launch URL, state saved, completes on completed/passed only', async () => {
    const mona = await as(E.mona!, app)
    const get = await mona.get(blockUrl(2, 0, 'scorm'))
    expect(get.status).toBe(200)
    ScormGet.parse(get.body)
    expect(get.body).toEqual({
      launchUrl: `/api/scorm/${seed.learning.scormPackageId}/index.html`,
      version: '1.2',
    })
    expect(
      (await mona.put(blockUrl(2, 0, 'scorm')).send({ cmi: { completionStatus: 'done' } })).status,
    ).toBe(422)
    await mona
      .put(blockUrl(2, 0, 'scorm'))
      .send({ cmi: { completionStatus: 'incomplete', location: 'p3', suspendData: 'x=1' } })
    let unit = await mona.get(`/api/units/${C01.units[2]}`)
    expect(unit.body.blocks[0].completed).toBe(false)
    expect((await mona.get(blockUrl(2, 0, 'scorm'))).body.state.cmi.location).toBe('p3')
    await mona
      .put(blockUrl(2, 0, 'scorm'))
      .send({ cmi: { completionStatus: 'completed', scoreRaw: 90 } })
    unit = await mona.get(`/api/units/${C01.units[2]}`)
    expect(unit.body.blocks[0].completed).toBe(true)
  })

  test('race: two simultaneous completions of U3 award the unit points once', async () => {
    const mona = await as(E.mona!, app)
    for (const b of [1, 2]) await mona.post(blockUrl(2, b, 'progress')).send({ completed: true })
    const [a, b] = await Promise.all([
      mona.post(`/api/units/${C01.units[2]}/complete`),
      mona.post(`/api/units/${C01.units[2]}/complete`),
    ])
    expect([a.status, b.status]).toEqual([200, 200])
    expect(a.body.pointsAwarded + b.body.pointsAwarded).toBe(10)
    expect(await ledgerCount(E.mona!, 'unit', C01.units[2]!)).toBe(1)
  })
})

describe('P16 action plan', () => {
  test('autosave: charLimit 422, save merges answers, fires the competition hook, PDF on demand', async () => {
    const mona = await as(E.mona!, app)
    const long = 'x'.repeat(501)
    const bad = await mona.put(blockUrl(3, 1, 'action-plan')).send({ answers: { '1': long } })
    expect(bad.status).toBe(422)
    expect(bad.body.error.fields['answers.1']).toContain('500')
    expect(
      (await mona.put(blockUrl(3, 1, 'action-plan')).send({ answers: { '9': 'x' } })).status,
    ).toBe(422)
    const ok = await mona
      .put(blockUrl(3, 1, 'action-plan'))
      .send({ answers: { '1': 'Lead a tour' } })
    expect(ok.status).toBe(200)
    ActionPlanSaved.parse(ok.body)
    expect(saved).toContain(C01.blocks[3]![1]!)
    await mona.put(blockUrl(3, 1, 'action-plan')).send({
      answers: { '2': 'Run a 10k', '3': 'Arabic', '4': 'My manager', '5': 'Book a course' },
    })
    const unit = await mona.get(`/api/units/${C01.units[3]}`)
    UnitView.parse(unit.body)
    const ap = unit.body.blocks[1]
    expect(ap.payload.answers).toMatchObject({ '1': 'Lead a tour', '5': 'Book a course' })
    expect(ap.payload.pdfUrl).toBe(ok.body.pdfUrl)
    expect(ap.completed).toBe(true)
    const pdf = await mona.get(ok.body.pdfUrl).responseType('blob')
    expect(pdf.status).toBe(200)
    expect(pdf.headers['content-type']).toBe('application/pdf')
    expect(Buffer.from(pdf.body).subarray(0, 5).toString()).toBe('%PDF-')
  })

  test('another learner cannot read someone else’s PDF (own answers only → 404)', async () => {
    const reem = await as(E.reem!, app)
    expect((await reem.get(blockUrl(3, 1, 'action-plan.pdf'))).status).toBe(404)
  })

  test('after competition lock (reader.lock) saves answer 409 locked', async () => {
    const mona = await userByEmail(E.mona!)
    await db.transaction((tx) => actionPlanReader().lock(mona.id, C01.blocks[3]![1]!, tx))
    const res = await (await as(E.mona!, app))
      .put(blockUrl(3, 1, 'action-plan'))
      .send({ answers: { '1': 'changed' } })
    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('locked')
    const answers = await actionPlanReader().getAnswers(mona.id, C01.blocks[3]![1]!)
    expect(answers.answers['1']).toBe('Lead a tour')
    expect(answers.lockedAt).not.toBeNull()
  })

  test('reader: pitch block of C13, unit progress, signed PDF URL for a judge', async () => {
    const pitch = await actionPlanReader().findPitchBlock(seed.courses.C13!.id)
    expect(pitch?.blockId).toBe(seed.learning.content.C13!.actionPlanBlock!)
    expect(pitch?.questions).toHaveLength(3)
    const ahmed = await userByEmail(E.ahmed!)
    const noura = await userByEmail(E.noura!)
    expect(await actionPlanReader().unitProgress(ahmed.id, seed.courses.C13!.id)).toEqual({
      completed: 4,
      total: 4,
    })
    const url = await actionPlanReader().pdfUrl(ahmed.id, pitch!.blockId, noura.id)
    expect(url).toContain(`uid=${noura.id}`)
  })
})

describe('P16 blocking final check → course completion', () => {
  test('U4 needs the quiz; passing it completes the unit, the course, the certificate once', async () => {
    const mona = await as(E.mona!, app)
    for (const b of [0, 2]) await mona.post(blockUrl(3, b, 'progress')).send({ completed: true })
    const blocked = await mona.get(`/api/units/${C01.units[3]}`)
    expect(blocked.body.completion).toEqual({ canComplete: false, reason: 'assessment_required' })
    expect((await mona.post(`/api/units/${C01.units[3]}/complete`)).status).toBe(409)

    const finalId = C01.assessments.final!
    const keys = await db
      .select()
      .from(assessmentQuestions)
      .where(eq(assessmentQuestions.assessmentId, finalId))
    const answers = keys.map((q) =>
      q.type === 'open_text'
        ? { questionId: q.id, text: ' abu dhabi ' }
        : { questionId: q.id, optionIds: q.options.filter((o) => o.correct).map((o) => o.id) },
    )
    const attempt = await mona.post(`/api/assessments/${finalId}/attempts`).send({ answers })
    expect(attempt.status).toBe(200)
    expect(attempt.body).toMatchObject({ scorePct: 100, passed: true, showAnswers: true })

    const done = await mona.post(`/api/units/${C01.units[3]}/complete`)
    expect(done.status).toBe(200)
    UnitCompleteResponse.parse(done.body)
    expect(done.body).toMatchObject({
      unitStatus: 'completed',
      courseProgressPct: 100,
      pointsAwarded: 60,
    })
    expect(done.body.nextUnitId).toBeUndefined()
    expect(done.body.certificate.serial).toMatch(/^DCT-2026-[0-9A-F]{10}$/)

    const twice = await mona.post(`/api/units/${C01.units[3]}/complete`)
    expect(twice.body.pointsAwarded).toBe(0)
    expect(twice.body.certificate.serial).toBe(done.body.certificate.serial)
    const monaRow = await userByEmail(E.mona!)
    const certs = await db
      .select()
      .from(courseCertificates)
      .where(eq(courseCertificates.userId, monaRow.id))
    expect(certs).toHaveLength(1)
    expect(await ledgerCount(E.mona!, 'course', seed.courses.C01!.id)).toBe(1)
    const mail = await lastMailTo(E.mona!, 'course-complete')
    expect(mail?.text).toContain(done.body.certificate.serial)

    const check = await anon(app).get(`/api/public/certificates/${done.body.certificate.serial}`)
    expect(check.status).toBe(200)
    CertificateCheck.parse(check.body)
    expect(check.body).toMatchObject({ valid: true, learnerName: 'Mona Al Ameri' })
    expect(JSON.stringify(check.body)).not.toContain('@')
    expect((await anon(app).get('/api/public/certificates/DCT-2026-NOPE000000')).status).toBe(404)
    expect((await anon(app).get('/api/public/certificates/bad serial')).status).toBe(404)
  })
})

describe('P16 survey block', () => {
  test('Yousef answers the C12 survey; unknown question 422', async () => {
    const c12 = seed.learning.content.C12!
    const y = await as(E.yousef!, app)
    const unit = await y.get(`/api/units/${c12.units[0]}`)
    UnitView.parse(unit.body)
    const survey = unit.body.blocks[0]
    expect(survey.type).toBe('survey')
    const [q1, q2] = survey.payload.questions
    const url = `/api/units/${c12.units[0]}/blocks/${survey.id}/survey`
    expect((await y.put(url).send({ answers: [{ questionId: 'nope' }] })).status).toBe(422)
    expect(
      (await y.put(url).send({ answers: [{ questionId: q1.id, optionIds: ['nope'] }] })).status,
    ).toBe(422)
    const ok = await y.put(url).send({
      answers: [
        { questionId: q1.id, optionIds: [q1.options[0].id] },
        { questionId: q2.id, text: 'More on ticketing' },
      ],
    })
    expect(ok.status).toBe(200)
    SurveySaved.parse(ok.body)
    const again = await y.get(`/api/units/${c12.units[0]}`)
    expect(again.body.blocks[0].payload.answers[1].text).toBe('More on ticketing')
    const yousef = await userByEmail(E.yousef!)
    const rows = await db.select().from(blockProgress).where(eq(blockProgress.userId, yousef.id))
    expect(rows.some((r) => r.blockId === survey.id && r.completedAt)).toBe(true)
  })
})
