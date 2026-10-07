import { beforeEach, describe, expect, test } from 'bun:test'
import { db } from '@server/db/connection'
import { sessions, users } from '@server/db/schema/identity'
import { E } from '@server/db/seed/data'
import { rateLimitState } from '@server/middleware/rate-limit.middleware'
import { eq } from 'drizzle-orm'
import { freshBase, sessionsOf, userByEmail } from '../helpers/fixtures'
import { anon, as } from '../helpers/http'

beforeEach(async () => {
  await freshBase()
})

describe('lockout and limits', () => {
  test('5 failed sign-ins lock the account for 15 minutes (even with the right password)', async () => {
    for (let i = 0; i < 5; i++) {
      const r = await anon()
        .post('/api/auth/sign-in/email')
        .send({ email: E.mona, password: 'wrong-password-x' })
      expect(r.status).toBe(401)
    }
    const locked = await anon()
      .post('/api/auth/sign-in/email')
      .send({ email: E.mona, password: 'Dct!2026demo' })
    expect(locked.status).toBe(429)
    expect(locked.body.error.code).toBe('rate_limited')
  })

  test('auth endpoints: 10/min per IP, then 429 with Retry-After', async () => {
    rateLimitState.enabled = true
    try {
      let last = 0
      for (let i = 0; i < 11; i++) {
        const r = await anon()
          .post('/api/auth/sign-in/email')
          .send({ email: `nobody${i}@example.com`, password: 'whatever-123' })
        last = r.status
        if (i === 10) {
          expect(r.status).toBe(429)
          expect(r.headers['retry-after']).toBeTruthy()
          expect(r.body.error.code).toBe('rate_limited')
        }
      }
      expect(last).toBe(429)
    } finally {
      rateLimitState.enabled = false
    }
  })

  test('unknown e-mail and wrong password answer the same', async () => {
    const a = await anon()
      .post('/api/auth/sign-in/email')
      .send({ email: 'ghost@example.com', password: 'whatever-123' })
    const b = await anon()
      .post('/api/auth/sign-in/email')
      .send({ email: E.mona, password: 'whatever-123' })
    expect(a.status).toBe(b.status)
    expect(a.body.error.code).toBe(b.body.error.code)
  })

  test('forget-password alias always answers 200', async () => {
    const r = await anon()
      .post('/api/auth/forget-password')
      .send({ email: 'ghost@example.com', redirectTo: 'http://localhost:5173/reset' })
    expect(r.status).toBe(200)
  })
})

describe('sessions (§9.6)', () => {
  test('disabling a signed-in user takes effect on the next request', async () => {
    const c = await as(E.mona!)
    expect((await c.get('/api/me')).status).toBe(200)
    await db.update(users).set({ status: 'disabled' }).where(eq(users.email, E.mona!))
    const res = await c.get('/api/me')
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('account_disabled')
    expect(await sessionsOf((await userByEmail(E.mona!)).id)).toHaveLength(0)
  })

  test('admin sessions end 12 h after sign-in', async () => {
    const c = await as(E.aisha!)
    const admin = await userByEmail(E.aisha!)
    const [s] = await sessionsOf(admin.id)
    expect(s!.expiresAt.getTime() - s!.createdAt.getTime()).toBeLessThanOrEqual(
      12 * 3600 * 1000 + 5000,
    )
    await db
      .update(sessions)
      .set({ createdAt: new Date(Date.now() - 13 * 3600 * 1000) })
      .where(eq(sessions.id, s!.id))
    expect((await c.get('/api/me')).status).toBe(401)
  })

  test('learner session: 7 days; remember me: 30 days; admins never get 30', async () => {
    await as(E.mona!)
    const mona = await userByEmail(E.mona!)
    const [s] = await sessionsOf(mona.id)
    const days = (s!.expiresAt.getTime() - Date.now()) / 86_400_000
    expect(days).toBeGreaterThan(6.9)
    expect(days).toBeLessThan(7.1)

    const r = await anon()
      .post('/api/auth/sign-in/email')
      .send({ email: E.reem, password: 'Dct!2026demo', rememberMe: true })
    expect(r.status).toBe(200)
    const reem = await userByEmail(E.reem!)
    const [rs] = await sessionsOf(reem.id)
    expect((rs!.expiresAt.getTime() - Date.now()) / 86_400_000).toBeGreaterThan(29)

    await anon()
      .post('/api/auth/sign-in/email')
      .send({ email: E.aisha, password: 'Dct!2026demo', rememberMe: true })
    const admin = await userByEmail(E.aisha!)
    const [as_] = await sessionsOf(admin.id)
    expect((as_!.expiresAt.getTime() - Date.now()) / 3_600_000).toBeLessThanOrEqual(12.01)
  })

  test('unverified e-mail cannot sign in', async () => {
    await db.update(users).set({ emailVerified: false }).where(eq(users.email, E.mona!))
    const r = await anon()
      .post('/api/auth/sign-in/email')
      .send({ email: E.mona, password: 'Dct!2026demo' })
    expect(r.status).toBe(403)
    expect(r.body.error.code).toBe('email_not_verified')
  })
})

describe('CSRF / CORS / headers', () => {
  test('mutation without Origin is refused; CORS reflects only allowed origins', async () => {
    const c = await as(E.mona!)
    const noOrigin = await c.put('/api/me/locale').unset('Origin').send({ locale: 'ar' })
    expect(noOrigin.status).toBe(403)
    const allowed = await anon().get('/api/health')
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173')
    const evil = await anon().get('/api/health').set('Origin', 'https://evil.example')
    expect(evil.headers['access-control-allow-origin']).toBeUndefined()
  })

  test('unknown route is a JSON 404; body over 1 MB is 413', async () => {
    const nf = await anon().get('/api/nope')
    expect(nf.status).toBe(404)
    expect(nf.body.error.code).toBe('not_found')
    const c = await as(E.mona!)
    const big = await c.put('/api/me/profile').send({ position: 'x'.repeat(1_100_000) })
    expect(big.status).toBe(413)
  })
})
