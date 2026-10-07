import { beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { db } from '@server/db/connection'
import { microsites, registerInterest } from '@server/db/schema/microsites'
import { E } from '@server/db/seed/data'
import { rateLimitState, resetRateLimits } from '@server/middleware/rate-limit.middleware'
import { LoginConfig, PublicLanding } from '@shared/schemas/microsites'
import { FaqResponse, HomeResponse, PageResponse } from '@shared/schemas/public'
import { eq } from 'drizzle-orm'
import { freshBase } from '../helpers/fixtures'
import { anon, as } from '../helpers/http'
import { lastMailTo } from '../helpers/mail'

beforeAll(freshBase)
beforeEach(resetRateLimits)

describe('P01–P04 public content', () => {
  test('home lists live microsites, non landing-only first', async () => {
    const res = await anon().get('/api/public/home')
    expect(res.status).toBe(200)
    HomeResponse.parse(res.body)
    const ids = res.body.microsites.map((m: { id: string }) => m.id)
    expect(ids).toHaveLength(9)
    expect(ids.slice(-2).sort()).toEqual(['csmd', 'ruwaad'])
  })
  test('pages and FAQ', async () => {
    PageResponse.parse((await anon().get('/api/public/pages/students')).body)
    FaqResponse.parse((await anon().get('/api/public/faq')).body)
    expect((await anon().get('/api/public/pages/unknown')).status).toBe(404)
  })
})

describe('P12 landing', () => {
  test('live microsite: published landing with partners', async () => {
    const res = await anon().get('/api/public/microsites/museopro/landing')
    expect(res.status).toBe(200)
    PublicLanding.parse(res.body)
    expect(res.body.section.kind).toBe('partners')
    expect(res.body.microsite).toMatchObject({
      id: 'museopro',
      signInMode: 'invite_only',
      landingOnly: false,
    })
  })
  test('landing-only microsite offers register interest; draft microsite is 404', async () => {
    const ruwaad = await anon().get('/api/public/microsites/ruwaad/landing')
    expect(ruwaad.body.registerInterest).toEqual({ formId: 'register-interest' })
    await db.update(microsites).set({ status: 'draft' }).where(eq(microsites.slug, 'csmd'))
    expect((await anon().get('/api/public/microsites/csmd/landing')).status).toBe(404)
    expect((await anon().get('/api/public/microsites/nope/landing')).status).toBe(404)
  })
  test('register interest: sanitised, notifies, 5/min per IP', async () => {
    const res = await anon().post('/api/public/microsites/ruwaad/register-interest').send({
      name: 'Ali <b>Hassan</b>',
      email: 'Ali@Example.com',
      message: '<script>x</script>Hello',
    })
    expect(res.status).toBe(201)
    const [row] = await db.select().from(registerInterest)
    expect(row!.name).toBe('Ali Hassan')
    expect(row!.email).toBe('ali@example.com')
    expect(row!.message).toBe('Hello')
    expect(await lastMailTo(E.aisha!, 'register-interest')).toBeDefined()
    rateLimitState.enabled = true
    try {
      const statuses = []
      for (let i = 0; i < 6; i++) {
        statuses.push(
          (
            await anon()
              .post('/api/public/microsites/ruwaad/register-interest')
              .send({ name: 'A', email: `a${i}@example.com` })
          ).status,
        )
      }
      expect(statuses).toEqual([201, 201, 201, 201, 201, 429])
    } finally {
      rateLimitState.enabled = false
    }
  })
})

describe('P07 microsite login', () => {
  test('login-config: open vs invite-only vs landing-only', async () => {
    const forum = await anon().get('/api/public/microsites/chkforum/login-config')
    LoginConfig.parse(forum.body)
    expect(forum.body.allowSignUp).toBe(true)
    const emp = await anon().get('/api/public/microsites/employees/login-config')
    expect(emp.body).toMatchObject({ allowSignUp: false, emailDomainRule: 'dctabudhabi.ae' })
    expect((await anon().get('/api/public/microsites/ruwaad/login-config')).status).toBe(404)
  })
  test('access request: 201 once, 409 twice, 409 for members, 401 signed out', async () => {
    const mona = await as(E.mona!)
    const first = await mona.post('/api/microsites/znm/access-request')
    expect(first.status).toBe(201)
    expect(first.body.status).toBe('open')
    expect(await lastMailTo(E.khalid!, 'access-request')).toBeDefined()
    expect((await mona.post('/api/microsites/znm/access-request')).status).toBe(409)
    expect((await mona.post('/api/microsites/employees/access-request')).status).toBe(409)
    expect((await anon().post('/api/microsites/znm/access-request')).status).toBe(401)
  })
  test('access request on an open microsite joins immediately', async () => {
    const mona = await as(E.mona!)
    const res = await mona.post('/api/microsites/chkforum/access-request')
    expect(res.body.status).toBe('approved')
    expect((await mona.get('/api/microsites/chkforum/dashboard')).status).toBe(200)
  })
})
