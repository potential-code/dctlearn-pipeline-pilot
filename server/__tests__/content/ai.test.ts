import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { db } from '@server/db/connection'
import { voiceIntakes } from '@server/db/schema/ai'
import { auditLog } from '@server/db/schema/identity'
import { microsites } from '@server/db/schema/microsites'
import { E } from '@server/db/seed/data'
import { setNow } from '@server/lib/clock'
import { rateLimitState, resetRateLimits } from '@server/middleware/rate-limit.middleware'
import { embedHostPolicy } from '@server/services/ai/embeds.service'
import { verifyEmbedSession } from '@server/services/ai/session-token'
import {
  purgeOldVoiceIntakes,
  setVoiceIntakeProvider,
} from '@server/services/ai/voice-intake.service'
import {
  AdminAiEmbed,
  AdminAiEmbedsPage,
  AiEmbed,
  AiSession,
  HubAiResponse,
  MicrositeAi,
} from '@shared/schemas/ai'
import { eq, like } from 'drizzle-orm'
import { expectDenied } from '../helpers/denials'
import { userByEmail } from '../helpers/fixtures'
import { anon, as } from '../helpers/http'
import { app, freshContent, hub } from './helpers'

beforeEach(async () => {
  await freshContent()
  embedHostPolicy.hosts = ['ai.potential.com']
})
afterEach(() => {
  rateLimitState.enabled = false
  setVoiceIntakeProvider(null)
})

const aiOff = (slug: string) =>
  db.update(microsites).set({ aiEnabled: false }).where(eq(microsites.slug, slug))

describe('P23 microsite AI and P52 ai tabs', () => {
  test('coaches and tools of the microsite; AI off → 404 feature_off', async () => {
    const s = await as(E.saeed!, app)
    const res = await s.get('/api/microsites/employees/ai')
    expect(res.status).toBe(200)
    MicrositeAi.parse(res.body)
    expect(res.body.coaches.map((e: { key: string }) => e.key)).toEqual([
      'career-coach',
      'culture-bot',
    ])
    expect(res.body.tools.map((e: { key: string }) => e.key)).toEqual(['lesson-planner'])
    const elevate = await s.get('/api/microsites/elevate/ai')
    expect(elevate.body.coaches.map((e: { key: string }) => e.key)).toEqual(['career-coach'])

    const coaches = await hub(E.saeed!, 'employees', 'ai_coaches')
    expect(coaches.status).toBe(200)
    HubAiResponse.parse(coaches.body)
    expect(coaches.body.items[1]).toMatchObject({
      key: 'culture-bot',
      url: '/ai/coach/culture-bot',
    })
    const tools = await hub(E.saeed!, 'employees', 'ai_tools')
    expect(tools.body.items).toEqual([
      expect.objectContaining({ key: 'lesson-planner', url: '/ai/tool/lesson-planner' }),
    ])

    await aiOff('employees')
    const off = await s.get('/api/microsites/employees/ai')
    expect(off.status).toBe(404)
    expect(off.body.error.code).toBe('feature_off')
    const offTab = await hub(E.saeed!, 'employees', 'ai_coaches')
    expect(offTab.status).toBe(404)

    await expectDenied(app, (c) => c.get('/api/microsites/elevate/ai'), {
      signedOut: null,
      otherLearner: E.mona!,
      mentor: E.hessa!,
      otherSubAdmin: E.omar!,
    })
  })
})

describe('P24–P27 embeds and session tokens', () => {
  test('public embed is public; login embeds need a member of a linked microsite', async () => {
    const voice = await anon(app).get('/api/ai/embeds/voice-hiring')
    expect(voice.status).toBe(200)
    AiEmbed.parse(voice.body)
    expect(voice.body.requiresLogin).toBe(false)

    const bot = await (await as(E.saeed!, app)).get('/api/ai/embeds/culture-bot')
    expect(bot.status).toBe(200)
    AiEmbed.parse(bot.body)
    expect(JSON.stringify(bot.body)).not.toMatch(/secret|apiKey|providerKey|bearer/i)
    expect((await (await as(E.omar!, app)).get('/api/ai/embeds/culture-bot')).status).toBe(200)
    expect((await (await as(E.aisha!, app)).get('/api/ai/embeds/culture-bot')).status).toBe(200)
    expect((await anon(app).get('/api/ai/embeds/nope')).status).toBe(404)

    await expectDenied(app, (c) => c.get('/api/ai/embeds/culture-bot'), {
      signedOut: null,
      otherLearner: E.yousef!,
      otherSubAdmin: E.khalid!,
      mentor: E.hessa!,
      judge: E.noura!,
    })

    // career-coach is linked to employees and elevate; with AI off on both → feature_off
    await aiOff('employees')
    await aiOff('elevate')
    const off = await (await as(E.saeed!, app)).get('/api/ai/embeds/career-coach')
    expect(off.status).toBe(404)
    expect(off.body.error.code).toBe('feature_off')
  })

  test('session token: signed, user id + locale only, short-lived', async () => {
    const s = await as(E.saeed!, app)
    const res = await s.post('/api/ai/embeds/culture-bot/session')
    expect(res.status).toBe(200)
    AiSession.parse(res.body)
    const saeed = await userByEmail(E.saeed!)
    const payload = verifyEmbedSession(res.body.token, 'culture-bot')
    expect(payload).toEqual({
      sub: saeed.id,
      locale: 'en',
      aud: 'culture-bot',
      exp: expect.any(Number),
    })
    expect(new Date(res.body.expiresAt).getTime()).toBe(payload!.exp * 1000)
    expect(verifyEmbedSession(res.body.token, 'career-coach')).toBeNull()
    expect(verifyEmbedSession(`${res.body.token}x`, 'culture-bot')).toBeNull()
    const [v, , sig] = res.body.token.split('.')
    const forged = Buffer.from(JSON.stringify({ ...payload, sub: 'someone-else' })).toString(
      'base64url',
    )
    expect(verifyEmbedSession(`${v}.${forged}.${sig}`, 'culture-bot')).toBeNull()
    setNow('2026-10-06T09:11:00Z')
    expect(verifyEmbedSession(res.body.token, 'culture-bot')).toBeNull()

    // public embed: any signed-in user gets a token
    expect(
      (await (await as(E.hessa!, app)).post('/api/ai/embeds/voice-hiring/session')).status,
    ).toBe(200)
    await expectDenied(app, (c) => c.post('/api/ai/embeds/culture-bot/session'), {
      signedOut: null,
      otherLearner: E.yousef!,
      mentor: E.hessa!,
    })
  })
})

describe('P27 voice-hiring intake', () => {
  const intake = (over: Record<string, unknown> = {}) => ({
    firstName: 'Fatma',
    lastName: 'Al Ketbi',
    email: 'Fatma.K@example.com',
    phone: '+971 50 123 4567',
    university: 'UAE University',
    major: 'Museum Studies',
    graduationYear: 2025,
    alAinResident: true,
    familyBook: true,
    availability: 'Immediately',
    noticePeriod: 'None',
    yearsExperience: 1,
    consent: true,
    ...over,
  })

  test('provider not configured → 503 feature_off; consent and fields validated first', async () => {
    const off = await anon(app).post('/api/ai/voice-hiring/intake').send(intake())
    expect(off.status).toBe(503)
    expect(off.body.error.code).toBe('feature_off')
    for (const body of [
      intake({ consent: false }),
      intake({ consent: undefined }),
      intake({ email: 'nope' }),
      intake({ firstName: '' }),
      intake({ alAinResident: 'yes' }),
    ]) {
      const r = await anon(app).post('/api/ai/voice-hiring/intake').send(body)
      expect(r.status).toBe(422)
    }
    expect(await db.select().from(voiceIntakes)).toHaveLength(0)
  })

  test('configured provider → 201 sessionToken; stored, never audited; retention purge', async () => {
    let received: Record<string, unknown> | null = null
    setVoiceIntakeProvider(async (applicant) => {
      received = applicant
      return { sessionToken: 'voice-session-1', providerSessionId: 'p-1' }
    })
    const res = await anon(app).post('/api/ai/voice-hiring/intake').send(intake())
    expect(res.status).toBe(201)
    expect(res.body).toEqual({ sessionToken: 'voice-session-1' })
    expect(received!).toMatchObject({ email: 'fatma.k@example.com', consentAt: expect.any(String) })
    expect(received!).not.toHaveProperty('consent')
    const rows = await db.select().from(voiceIntakes)
    expect(rows).toHaveLength(1)
    expect(await db.select().from(auditLog)).toHaveLength(0)

    setVoiceIntakeProvider(async () => {
      throw new Error('down')
    })
    expect((await anon(app).post('/api/ai/voice-hiring/intake').send(intake())).status).toBe(503)

    await db
      .update(voiceIntakes)
      .set({ createdAt: new Date('2025-09-01T00:00:00Z') })
      .where(eq(voiceIntakes.id, rows[0]!.id))
    expect(await purgeOldVoiceIntakes()).toBe(1)
    expect(await db.select().from(voiceIntakes)).toHaveLength(0)
  })

  test('rate limited to 5/min per IP', async () => {
    rateLimitState.enabled = true
    await resetRateLimits()
    const statuses: number[] = []
    for (let i = 0; i < 6; i++) {
      const r = await anon(app).post('/api/ai/voice-hiring/intake').send(intake())
      statuses.push(r.status)
    }
    expect(statuses.slice(0, 5)).toEqual([503, 503, 503, 503, 503])
    expect(statuses[5]).toBe(429)
  })
})

describe('P61 admin AI embeds', () => {
  const embed = (over: Record<string, unknown> = {}) => ({
    key: 'job-writer',
    name: { en: 'Job description writer', ar: '' },
    description: { en: 'Drafts job descriptions', ar: '' },
    kind: 'iframe',
    providerId: 'tool_jobs',
    color: '#3B2F92',
    iframeUrl: 'https://ai.potential.com/tools/jobs',
    microsites: ['employees'],
    requiresLogin: true,
    ...over,
  })
  const nonAdmins = {
    signedOut: null,
    learner: E.saeed!,
    subAdmin: E.omar!,
    mentor: E.hessa!,
  }

  test('CRUD with allow-listed https hosts, audited, soft delete frees the key', async () => {
    const a = await as(E.aisha!, app)
    const list = await a.get('/api/admin/ai-embeds')
    expect(list.status).toBe(200)
    AdminAiEmbedsPage.parse(list.body)
    expect(list.body.total).toBe(4)
    expect(
      list.body.items.find((e: { key: string }) => e.key === 'career-coach').microsites,
    ).toEqual(['elevate', 'employees'])

    const created = await a.post('/api/admin/ai-embeds').send(embed())
    expect(created.status).toBe(201)
    AdminAiEmbed.parse(created.body)
    expect((await a.post('/api/admin/ai-embeds').send(embed())).status).toBe(409)

    for (const body of [
      embed({ key: 'x1', iframeUrl: 'https://evil.example/tool' }),
      embed({ key: 'x2', iframeUrl: 'http://ai.potential.com/tool' }),
      embed({ key: 'x3', kind: 'chat', iframeUrl: undefined, scriptUrl: 'https://cdn.evil/x.js' }),
      embed({ key: 'x4', iframeUrl: undefined }),
      embed({ key: 'Bad Key' }),
      embed({ key: 'x5', color: 'red' }),
      embed({ key: 'x6', microsites: ['nope'] }),
    ]) {
      expect((await a.post('/api/admin/ai-embeds').send(body)).status).toBe(422)
    }

    const { key: _k, ...rest } = embed({ microsites: ['employees', 'elevate'], color: '#000000' })
    const updated = await a.put('/api/admin/ai-embeds/job-writer').send(rest)
    expect(updated.status).toBe(200)
    expect(updated.body).toMatchObject({ color: '#000000', microsites: ['elevate', 'employees'] })

    expect((await a.delete('/api/admin/ai-embeds/job-writer')).status).toBe(204)
    expect((await a.delete('/api/admin/ai-embeds/job-writer')).status).toBe(404)
    expect((await a.put('/api/admin/ai-embeds/job-writer').send(rest)).status).toBe(404)
    expect((await (await as(E.saeed!, app)).get('/api/ai/embeds/job-writer')).status).toBe(404)
    expect((await a.post('/api/admin/ai-embeds').send(embed())).status).toBe(201)

    const audits = await db.select().from(auditLog).where(like(auditLog.action, 'ai_embed.%'))
    expect(audits.map((x) => x.action).sort()).toEqual([
      'ai_embed.create',
      'ai_embed.create',
      'ai_embed.delete',
      'ai_embed.update',
    ])

    await expectDenied(app, (c) => c.get('/api/admin/ai-embeds'), nonAdmins)
    await expectDenied(
      app,
      (c) => c.post('/api/admin/ai-embeds').send(embed({ key: 'y' })),
      nonAdmins,
    )
    await expectDenied(app, (c) => c.delete('/api/admin/ai-embeds/culture-bot'), nonAdmins)
  })
})
