import { beforeAll, describe, expect, test } from 'bun:test'
import { E } from '@server/db/seed/data'
import { type BaseSeed, seedBase } from '@server/db/seed/fixtures'
import { resetDb } from '../helpers/db'
import { anon, as } from '../helpers/http'

let seed: BaseSeed
beforeAll(async () => {
  await resetDb()
  seed = await seedBase()
})

describe('health', () => {
  test('GET /api/health', async () => {
    const res = await anon().get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok', db: 'ok', version: expect.any(String) })
    expect(res.headers['x-request-id']).toBeTruthy()
    expect(res.headers['x-content-type-options']).toBe('nosniff')
  })
})

describe('sign-in and landing rule', () => {
  test('signed out /api/me is 401 unauthenticated', async () => {
    const res = await anon().get('/api/me')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('unauthenticated')
  })

  test('admin lands on /admin', async () => {
    const c = await as(E.aisha!)
    const res = await c.get('/api/me')
    expect(res.status).toBe(200)
    expect(res.body.defaultRoute).toBe('/admin')
    expect(res.body.user.role).toBe('admin')
  })

  test('learner with two memberships → /platforms; from=elevate → elevate dashboard', async () => {
    const c = await as(E.saeed!)
    const plain = await c.get('/api/me')
    expect(plain.body.defaultRoute).toBe('/platforms')
    expect(plain.body.microsites.map((m: { id: string }) => m.id).sort()).toEqual([
      'elevate',
      'employees',
    ])
    const from = await c.get('/api/me?from=elevate')
    expect(from.body.defaultRoute).toBe('/elevate/dashboard')
  })

  test('non-member from=znm → denied with accessDenied, session still valid', async () => {
    const c = await as(E.saeed!)
    const res = await c.get('/api/me?from=znm')
    expect(res.body.defaultRoute).toBe('/znm/login?denied=1')
    expect(res.body.accessDenied.microsite.id).toBe('znm')
    expect((await c.get('/api/me')).status).toBe(200)
  })

  test('sub admin lands on their microsite admin', async () => {
    const c = await as(E.omar!)
    expect((await c.get('/api/me')).body.defaultRoute).toBe('/employees/admin')
  })

  test('wrong password → 401 invalid_credentials in contract shape', async () => {
    const res = await anon()
      .post('/api/auth/sign-in/email')
      .send({ email: E.mona, password: 'wrong-password-1' })
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('invalid_credentials')
  })

  test('disabled user cannot sign in', async () => {
    const res = await anon()
      .post('/api/auth/sign-in/email')
      .send({ email: E.former, password: 'Dct!2026demo' })
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('account_disabled')
  })

  test('mutating request from another origin is refused', async () => {
    const c = await as(E.mona!)
    const res = await c
      .put('/api/me/locale')
      .set('Origin', 'https://evil.example')
      .send({ locale: 'ar' })
    expect(res.status).toBe(403)
  })

  test('seed sanity', () => {
    expect(Object.keys(seed.microsites)).toHaveLength(9)
  })
})
