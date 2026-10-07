import { beforeAll, describe, expect, test } from 'bun:test'
import { db } from '@server/db/connection'
import { externalCertificates } from '@server/db/schema/achievements'
import { auditLog } from '@server/db/schema/identity'
import { E } from '@server/db/seed/data'
import { joinMicrosite } from '@server/services/microsites/membership.service'
import { AchievementsResponse, ExternalCertCreated } from '@shared/schemas/achievements'
import { and, eq } from 'drizzle-orm'
import { expectDenied } from '../helpers/denials'
import { userByEmail } from '../helpers/fixtures'
import { as } from '../helpers/http'
import { lastMailTo } from '../helpers/mail'
import { app, freshLearning, type LearningSeed, PDF_BYTES, PNG_BYTES } from './helpers'

let seed: LearningSeed
beforeAll(async () => {
  seed = await freshLearning()
}, 120_000)

describe('P51 achievements', () => {
  test('Saeed (employees): 280 points, 30 this month, 2 certificates, leaderboard per SEED', async () => {
    const res = await (await as(E.saeed!, app)).get('/api/microsites/employees/achievements')
    expect(res.status).toBe(200)
    AchievementsResponse.parse(res.body)
    expect(res.body.points).toEqual({ total: 280, thisMonth: 30 })
    expect(res.body.ledger.length).toBeLessThanOrEqual(20)
    expect(res.body.ledger[0].at >= res.body.ledger[1].at).toBe(true)
    expect(res.body.ledger[0].courseTitle.en).toBe('Museum 101')
    expect(res.body.certificates.map((c: { serial: string }) => c.serial).sort()).toEqual([
      'DCT-2026-C01SAE01',
      'DCT-2026-C03SAE01',
    ])
    expect(res.body.certificates[0].shareUrl).toContain('/certificates/DCT-2026-')
    expect(res.body.externalCertificates).toBeUndefined()
    expect(res.body.leaderboard.me).toEqual({ rank: 1, points: 280 })
    expect(
      res.body.leaderboard.top.map((r: { name: string; points: number }) => [r.name, r.points]),
    ).toEqual([
      ['Saeed Al Hammadi', 280],
      ['Reem Al Shamsi', 200],
      ['Hamad Al Mazrouei', 150],
      ['Mona Al Ameri', 40],
    ])
    expect(JSON.stringify(res.body.leaderboard)).not.toContain('@')
    const earned = res.body.badges.filter((b: { earnedAt?: string }) => b.earnedAt)
    expect(earned.map((b: { key: string }) => b.key).sort()).toEqual(['first-course', 'points-250'])
  })

  test('Yousef (znm): 310 points; leaderboard of znm members counts znm course points', async () => {
    const res = await (await as(E.yousef!, app)).get('/api/microsites/znm/achievements')
    AchievementsResponse.parse(res.body)
    expect(res.body.points.total).toBe(310)
    expect(res.body.certificates).toHaveLength(2)
    expect(res.body.leaderboard.top[0]).toMatchObject({
      name: 'Yousef Al Zaabi',
      points: 310,
      isMe: true,
    })
    // ZNM lists C01 too, so Reem's C01 points count; her C09 completion predates points.
    expect(res.body.leaderboard.top[1]).toMatchObject({ name: 'Reem Al Shamsi', points: 200 })
    expect(res.body.leaderboard.top).toHaveLength(2)
  })

  test('Hamad (nibras): external certificates listed (approved C18, pending C19)', async () => {
    const res = await (await as(E.hamad!, app)).get('/api/microsites/nibras/achievements')
    AchievementsResponse.parse(res.body)
    const ext = res.body.externalCertificates as {
      courseId: string
      status: string
      fileUrl: string
    }[]
    expect(ext.map((e) => e.status).sort()).toEqual(['approved', 'pending'])
    expect(ext[0]!.fileUrl).toStartWith('/api/files/')
  })

  test('access: signed out 401, non-member 403, mentor/judge 403', async () => {
    await expectDenied(app, (c) => c.get('/api/microsites/employees/achievements'), {
      signedOut: null,
      nonMember: E.elise!,
      mentor: E.hessa!,
      judge: E.noura!,
    })
  })
})

describe('P51 external certificate upload', () => {
  const url = '/api/microsites/nibras/external-certificates'

  test('upload a PDF for C20 → 201 pending, audit, admin e-mail', async () => {
    const hamad = await as(E.hamad!, app)
    const res = await hamad
      .post(url)
      .field('courseId', seed.courses.C20!.id)
      .attach('file', PDF_BYTES, { filename: 'prompting.pdf', contentType: 'application/pdf' })
    expect(res.status).toBe(201)
    ExternalCertCreated.parse(res.body)
    expect(res.body.status).toBe('pending')
    const [audit] = await db
      .select()
      .from(auditLog)
      .where(
        and(eq(auditLog.action, 'external_certificate.upload'), eq(auditLog.targetId, res.body.id)),
      )
    expect(audit).toBeDefined()
    const mail = await lastMailTo(E.aisha!, 'admin-external-cert-uploaded')
    expect(mail?.text).toContain('Foundations of Prompt Engineering')
  })

  test('type is checked by content; not-external course 422; foreign course 404; approved 409', async () => {
    const hamad = await as(E.hamad!, app)
    const fake = await hamad
      .post(url)
      .field('courseId', seed.courses.C21!.id)
      .attach('file', Buffer.from('<script>alert(1)</script>'), {
        filename: 'x.pdf',
        contentType: 'application/pdf',
      })
    expect(fake.status).toBe(422)
    const png = await hamad
      .post(url)
      .field('courseId', seed.courses.C21!.id)
      .attach('file', PNG_BYTES, { filename: 'cert.png', contentType: 'image/png' })
    expect(png.status).toBe(201)
    expect(
      (
        await hamad
          .post(url)
          .field('courseId', seed.courses.C01!.id)
          .attach('file', PDF_BYTES, { filename: 'c.pdf', contentType: 'application/pdf' })
      ).status,
    ).toBe(404)
    const notExternal = await hamad
      .post('/api/microsites/employees/external-certificates')
      .field('courseId', seed.courses.C01!.id)
      .attach('file', PDF_BYTES, { filename: 'c.pdf', contentType: 'application/pdf' })
    expect(notExternal.status).toBe(422)
    expect(
      (
        await hamad
          .post(url)
          .field('courseId', seed.courses.C18!.id)
          .attach('file', PDF_BYTES, { filename: 'c.pdf', contentType: 'application/pdf' })
      ).status,
    ).toBe(409)
    expect((await hamad.post(url).field('courseId', 'nope')).status).toBe(422)
    expect((await hamad.post(url).field('courseId', seed.courses.C21!.id)).status).toBe(422)
  })

  test('only learners upload; signed out 401', async () => {
    await expectDenied(
      app,
      (c) =>
        c
          .post(url)
          .field('courseId', seed.courses.C21!.id)
          .attach('file', PDF_BYTES, { filename: 'c.pdf', contentType: 'application/pdf' }),
      { signedOut: null, subAdmin: E.fatima!, admin: E.aisha!, nonMember: E.saeed! },
    )
  })

  test('delete: own pending → 204; approved → 409; someone else’s → 404', async () => {
    const hamad = await as(E.hamad!, app)
    const { hamadC18, hamadC19 } = seed.learning.externalCertificates
    expect((await hamad.delete(`${url}/${hamadC18}`)).status).toBe(409)
    const saeed = await userByEmail(E.saeed!)
    await joinMicrosite(db, saeed.id, seed.microsites.nibras!.id, 'admin')
    expect((await (await as(E.saeed!, app)).delete(`${url}/${hamadC19}`)).status).toBe(404)
    expect((await hamad.delete(`${url}/${hamadC19}`)).status).toBe(204)
    const left = await db
      .select()
      .from(externalCertificates)
      .where(eq(externalCertificates.id, hamadC19!))
    expect(left).toHaveLength(0)
  })
})
