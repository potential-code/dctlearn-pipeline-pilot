import { beforeEach, describe, expect, test } from 'bun:test'
import { db } from '@server/db/connection'
import {
  competitionAssignments,
  competitionRounds,
  competitionSubmissions,
} from '@server/db/schema/competition'
import { E } from '@server/db/seed/data'
import { runActionPlanSaved } from '@server/services/seams/action-plan.seam'
import { CompetitionDashboard, CompetitionView } from '@shared/schemas/competition'
import { DashboardResponse } from '@shared/schemas/microsites'
import { and, eq } from 'drizzle-orm'
import { expectDenied } from '../helpers/denials'
import { as } from '../helpers/http'
import {
  app,
  type CompetitionFixture,
  competitionBase,
  PITCH_BLOCK_ID,
  setProgress,
} from './helpers'

let f: CompetitionFixture

beforeEach(async () => {
  f = await competitionBase()
})

const openR1 = () =>
  db
    .update(competitionRounds)
    .set({ status: 'open' })
    .where(eq(competitionRounds.id, f.comp.roundId))

async function subOf(userId: string) {
  const [row] = await db
    .select()
    .from(competitionSubmissions)
    .where(
      and(
        eq(competitionSubmissions.roundId, f.comp.roundId),
        eq(competitionSubmissions.userId, userId),
      ),
    )
  return row
}

describe('P28 GET competition', () => {
  test('Ahmed: round R1 judging, submitted, eligible', async () => {
    const res = await (await as(E.ahmed!, app)).get('/api/microsites/zu/competition')
    expect(res.status).toBe(200)
    const body = CompetitionView.parse(res.body)
    expect(body.round).toMatchObject({
      id: f.comp.roundId,
      status: 'judging',
      name: { en: '24-Hour Challenge 2026' },
      opensAt: '2026-09-15T00:00:00.000Z',
      closesAt: '2026-10-20T20:00:00.000Z',
    })
    expect(body.submission).toEqual({
      status: 'submitted',
      courseId: f.c13.id,
      courseSlug: f.c13.slug,
      submittedAt: '2026-09-30T10:00:00.000Z',
    })
    expect(body.eligible).toBe(true)
    expect(body.eligibilityRule.en).toContain('80%')
  })

  test('Sara: in progress, not eligible at 75 %', async () => {
    const res = await (await as(E.sara!, app)).get('/api/microsites/zu/competition')
    expect(res.status).toBe(200)
    expect(res.body.submission.status).toBe('in_progress')
    expect(res.body.submission.submittedAt).toBeUndefined()
    expect(res.body.eligible).toBe(false)
  })

  test('denied: signed out, non-members, other roles; feature off → 404', async () => {
    for (const path of ['/competition', '/competition/dashboard']) {
      await expectDenied(app, (c) => c.get(`/api/microsites/zu${path}`), {
        signedOut: null,
        otherLearner: E.saeed!,
        otherSubAdmin: E.omar!,
        judge: E.noura!,
        mentor: E.hessa!,
      })
    }
    await expectDenied(app, (c) => c.post('/api/microsites/zu/competition/submit'), {
      signedOut: null,
      otherLearner: E.saeed!,
      judge: E.noura!,
    })
    const off = await (await as(E.saeed!, app)).get('/api/microsites/employees/competition')
    expect(off.status).toBe(404)
    expect(off.body.error.code).toBe('feature_off')
  })

  test('no visible round (draft only) → 404', async () => {
    await db
      .update(competitionRounds)
      .set({ status: 'draft' })
      .where(eq(competitionRounds.id, f.comp.roundId))
    expect((await (await as(E.ahmed!, app)).get('/api/microsites/zu/competition')).status).toBe(404)
  })
})

describe('P28 submit (one-way, §9.1)', () => {
  test('ineligible 409 → eligible submits, locks the action plan, second submit 409', async () => {
    await openR1()
    const sara = await as(E.sara!, app)
    const early = await sara.post('/api/microsites/zu/competition/submit')
    expect(early.status).toBe(409)

    await setProgress(f.users.sara!.id, f.c13.id, 85)
    const ok = await sara.post('/api/microsites/zu/competition/submit')
    expect(ok.status).toBe(200)
    expect(ok.body).toEqual({ status: 'submitted' })
    expect(f.fake.isLocked(f.users.sara!.id)).toBe(true)
    const row = await subOf(f.users.sara!.id)
    expect(row?.status).toBe('submitted')
    expect(row?.submittedAt?.toISOString()).toBe('2026-10-06T09:00:00.000Z')

    const again = await sara.post('/api/microsites/zu/competition/submit')
    expect(again.status).toBe(409)
    expect(again.body.error.code).toBe('locked')
    // Ahmed already submitted.
    expect(
      (await (await as(E.ahmed!, app)).post('/api/microsites/zu/competition/submit')).status,
    ).toBe(409)
  })

  test('double submit at once: exactly one succeeds', async () => {
    await openR1()
    await setProgress(f.users.sara!.id, f.c13.id, 90)
    const sara = await as(E.sara!, app)
    const results = await Promise.all([
      sara.post('/api/microsites/zu/competition/submit'),
      sara.post('/api/microsites/zu/competition/submit'),
    ])
    expect(results.map((r) => r.status).sort()).toEqual([200, 409])
  })

  test('round not open (judging) → 409; no saved answers → 409', async () => {
    await setProgress(f.users.sara!.id, f.c13.id, 90)
    const sara = await as(E.sara!, app)
    expect((await sara.post('/api/microsites/zu/competition/submit')).status).toBe(409)
    await openR1()
    f.fake.setAnswers(f.users.sara!.id, { '1': '  ' })
    const empty = await sara.post('/api/microsites/zu/competition/submit')
    expect(empty.status).toBe(409)
    expect((await subOf(f.users.sara!.id))?.status).toBe('in_progress')
  })

  test('first action-plan save: not_started → in_progress (only the pitch block)', async () => {
    await openR1()
    await db
      .delete(competitionAssignments)
      .where(eq(competitionAssignments.submissionId, f.comp.submissions.sara))
    await db
      .delete(competitionSubmissions)
      .where(eq(competitionSubmissions.userId, f.users.sara!.id))
    await runActionPlanSaved(db, {
      userId: f.users.sara!.id,
      blockId: '22222222-2222-4222-8222-222222222222',
    })
    expect(await subOf(f.users.sara!.id)).toBeUndefined()
    await runActionPlanSaved(db, { userId: f.users.sara!.id, blockId: PITCH_BLOCK_ID })
    expect((await subOf(f.users.sara!.id))?.status).toBe('in_progress')
    // A later save never moves a submitted entry back.
    await runActionPlanSaved(db, { userId: f.users.ahmed!.id, blockId: PITCH_BLOCK_ID })
    expect((await subOf(f.users.ahmed!.id))?.status).toBe('submitted')
  })
})

describe('P29 dashboard', () => {
  test('units, countdown; score and rank only after the round is closed', async () => {
    const ahmed = await as(E.ahmed!, app)
    const res = await ahmed.get('/api/microsites/zu/competition/dashboard')
    expect(res.status).toBe(200)
    const body = CompetitionDashboard.parse(res.body)
    expect(body).toEqual({
      points: 0,
      unitsCompleted: 4,
      unitsTotal: 4,
      countdown: { closesAt: '2026-10-20T20:00:00.000Z' },
      status: 'submitted',
    })

    const admin = await as(E.aisha!, app)
    expect(
      (await admin.post(`/api/microsites/zu/admin/rounds/${f.comp.roundId}/close`)).status,
    ).toBe(200)
    const closed = await ahmed.get('/api/microsites/zu/competition/dashboard')
    expect(closed.body.score).toEqual({ total: 72, outOf: 100 })
    expect(closed.body.rank).toBe(1)
    // Sara never submitted: no score.
    const sara = await (await as(E.sara!, app)).get('/api/microsites/zu/competition/dashboard')
    expect(sara.body.score).toBeUndefined()
    expect(sara.body.unitsCompleted).toBe(3)
  })

  test('P14 dashboard competition section', async () => {
    const res = await (await as(E.ahmed!, app)).get('/api/microsites/zu/dashboard')
    expect(res.status).toBe(200)
    const body = DashboardResponse.parse(res.body)
    expect(body.competition).toEqual({
      enabled: true,
      roundId: f.comp.roundId,
      roundName: { en: '24-Hour Challenge 2026', ar: 'تحدي 24 ساعة 2026' },
      status: 'submitted',
      deadline: '2026-10-20T20:00:00.000Z',
    })
  })
})
