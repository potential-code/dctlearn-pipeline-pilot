import { beforeAll, describe, expect, test } from 'bun:test'
import { app } from '@server/app'
import { db } from '@server/db/connection'
import { enrolments } from '@server/db/schema/catalog'
import { microsites } from '@server/db/schema/microsites'
import { E } from '@server/db/seed/data'
import type { BaseSeed } from '@server/db/seed/fixtures'
import { DashboardResponse } from '@shared/schemas/microsites'
import { and, eq } from 'drizzle-orm'
import { expectDenied } from '../helpers/denials'
import { freshBase, userByEmail } from '../helpers/fixtures'
import { as } from '../helpers/http'

let seed: BaseSeed
beforeAll(async () => {
  seed = await freshBase()
})

describe('P14 dashboard', () => {
  test('member gets own dashboard; joining enrolled them in every course', async () => {
    const saeed = await userByEmail(E.saeed!)
    await db
      .update(enrolments)
      .set({ progressPct: 60, state: 'in_progress' })
      .where(and(eq(enrolments.userId, saeed.id), eq(enrolments.courseId, seed.courses.C02!.id)))
    const c = await as(E.saeed!)
    const res = await c.get('/api/microsites/employees/dashboard')
    expect(res.status).toBe(200)
    DashboardResponse.parse(res.body)
    expect(res.body.kpis.inProgress).toBe(1)
    expect(res.body.continueLearning[0]).toMatchObject({
      slug: seed.courses.C02!.slug,
      state: 'in_progress',
      progressPct: 60,
    })
    expect(res.body.mandatory.map((m: { slug: string }) => m.slug).sort()).toEqual(
      [seed.courses.C01!.slug, seed.courses.C03!.slug].sort(),
    )
    expect(res.body.mentoring).toBeUndefined()
    const elevate = await c.get('/api/microsites/elevate/dashboard')
    expect(elevate.body.mentoring).toMatchObject({ enabled: true })
  })

  test('access rules: non-member 403, signed out 401, other roles 403; admin and own sub admin allowed', async () => {
    await expectDenied(app, (c) => c.get('/api/microsites/employees/dashboard'), {
      signedOut: null,
      nonMember: E.yousef!,
      mentor: E.hessa!,
      judge: E.noura!,
      otherSubAdmin: E.khalid!,
    })
    expect((await (await as(E.aisha!)).get('/api/microsites/employees/dashboard')).status).toBe(200)
    expect((await (await as(E.omar!)).get('/api/microsites/employees/dashboard')).status).toBe(200)
  })

  test('archived or landing-only microsite → 404 for learners', async () => {
    await db.update(microsites).set({ status: 'archived' }).where(eq(microsites.slug, 'museopro'))
    expect((await (await as(E.elise!)).get('/api/microsites/museopro/dashboard')).status).toBe(404)
    await db.update(microsites).set({ status: 'live' }).where(eq(microsites.slug, 'museopro'))
    expect((await (await as(E.elise!)).get('/api/microsites/ruwaad/dashboard')).status).toBe(404)
  })

  test('P52 hub: disabled tab 404; tab without an owner yet 404', async () => {
    const c = await as(E.yousef!)
    expect((await c.get('/api/microsites/znm/hub/mentors')).status).toBe(404)
    expect((await c.get('/api/microsites/znm/hub/bogus')).status).toBe(404)
  })
})
