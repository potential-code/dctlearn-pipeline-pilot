import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { features } from '@server/config/env'
import { db } from '@server/db/connection'
import { translationStatus } from '@server/db/schema/platform'
import { faqItems } from '@server/db/schema/public'
import { seedPlatform } from '@server/db/seed/slices/platform.seed'
import { runSchedule } from '@server/jobs/runtime'
import { setTranslationProvider } from '@server/services/i18n/translation.provider'
import {
  MachineTranslationQueued,
  TranslationRow,
  TranslationsPage,
} from '@shared/schemas/translations'
import { asc, eq } from 'drizzle-orm'
import { expectDenied } from '../helpers/denials'
import { anon, as } from '../helpers/http'
import { app, NOT_ADMIN } from './helpers'
import { freshPlatformBase } from './schema-fix'

const ADMIN = 'aisha.admin@dctlearn.example'
let faqIds: string[] = []

beforeEach(async () => {
  const base = await freshPlatformBase()
  await seedPlatform(db, base.courses)
  faqIds = (await db.select().from(faqItems).orderBy(asc(faqItems.sortOrder))).map((f) => f.id)
})
afterEach(() => {
  features.translation = false
  setTranslationProvider(null)
})

async function blankArabic(id: string, field: 'question' | 'answer') {
  const [row] = await db.select().from(faqItems).where(eq(faqItems.id, id))
  await db
    .update(faqItems)
    .set({ [field]: { en: row![field].en, ar: '' } })
    .where(eq(faqItems.id, id))
}

describe('P60 list', () => {
  test('every registered field with English; missing=ar filter; pagination', async () => {
    const a = await as(ADMIN, app)
    const all = TranslationsPage.parse((await a.get('/api/admin/translations?pageSize=100')).body)
    // 9 microsites × (name, subtitle) + 6 page sections × (title, body) + 6 FAQ × 2.
    expect(all.total).toBe(18 + 12 + 12)
    expect(new Set(all.items.map((i) => i.entity))).toEqual(new Set(['page', 'faq', 'microsite']))
    expect(all.items.every((i) => i.status === 'reviewed')).toBe(true)

    const faq = TranslationsPage.parse((await a.get('/api/admin/translations?entity=faq')).body)
    expect(faq.total).toBe(12)
    await blankArabic(faqIds[0]!, 'answer')
    const missing = TranslationsPage.parse(
      (await a.get('/api/admin/translations?entity=faq&missing=ar')).body,
    )
    expect(missing.items).toEqual([
      {
        entity: 'faq',
        id: faqIds[0]!,
        field: 'answer',
        en: 'The learning platform of the Department of Culture and Tourism – Abu Dhabi.',
        ar: '',
        status: 'missing',
      },
    ])
    const page2 = TranslationsPage.parse(
      (await a.get('/api/admin/translations?entity=microsite&page=2&pageSize=10')).body,
    )
    expect(page2.items).toHaveLength(8)
    expect((await a.get('/api/admin/translations?entity=lesson')).status).toBe(422)
    expect((await a.get('/api/admin/translations?missing=en')).status).toBe(422)
    await expectDenied(app, (c) => c.get('/api/admin/translations'), NOT_ADMIN)
  })
})

describe('P60 update', () => {
  test('saves Arabic as reviewed, sanitising rich and plain fields; public FAQ shows it', async () => {
    const a = await as(ADMIN, app)
    await blankArabic(faqIds[0]!, 'answer')
    const res = await a.put('/api/admin/translations').send({
      entity: 'faq',
      id: faqIds[0],
      field: 'answer',
      ar: '<p onclick="x()">منصة <strong>التعلّم</strong></p><script>alert(1)</script>',
    })
    expect(res.status).toBe(200)
    const row = TranslationRow.parse(res.body)
    expect(row.ar).toBe('<p>منصة <strong>التعلّم</strong></p>')
    expect(row.status).toBe('reviewed')
    const faq = await anon(app).get('/api/public/faq')
    expect(faq.body.items[0].answer.ar).toBe('<p>منصة <strong>التعلّم</strong></p>')

    const plain = await a
      .put('/api/admin/translations')
      .send({ entity: 'faq', id: faqIds[1], field: 'question', ar: '<b>من</b> يمكنه التسجيل؟' })
    expect(plain.body.ar).toBe('من يمكنه التسجيل؟')
    const [status] = await db
      .select()
      .from(translationStatus)
      .where(eq(translationStatus.recordId, faqIds[1]!))
    expect(status).toMatchObject({ status: 'reviewed', field: 'question' })
  })

  test('unknown field 422, unknown record 404, empty text 422, non-admins denied', async () => {
    const a = await as(ADMIN, app)
    const body = { entity: 'faq', id: faqIds[0], field: 'answer', ar: 'نص' }
    expect((await a.put('/api/admin/translations').send({ ...body, field: 'slug' })).status).toBe(
      422,
    )
    expect(
      (
        await a
          .put('/api/admin/translations')
          .send({ ...body, id: '00000000-0000-4000-8000-000000000000' })
      ).status,
    ).toBe(404)
    expect((await a.put('/api/admin/translations').send({ ...body, id: 'nope' })).status).toBe(404)
    expect((await a.put('/api/admin/translations').send({ ...body, ar: '  ' })).status).toBe(422)
    expect(
      (await a.put('/api/admin/translations').send({ ...body, ar: '<script>x</script>' })).status,
    ).toBe(422)
    await expectDenied(app, (c) => c.put('/api/admin/translations').send(body), NOT_ADMIN)
  })
})

describe('P60 machine translation', () => {
  test('503 feature_off without a provider', async () => {
    const a = await as(ADMIN, app)
    const res = await a
      .post('/api/admin/translations/machine')
      .send({ entity: 'faq', ids: [faqIds[0]] })
    expect(res.status).toBe(503)
    expect(res.body.error.code).toBe('feature_off')
    expect(
      (await a.post('/api/admin/translations/machine').send({ entity: 'faq', ids: [] })).status,
    ).toBe(422)
    await expectDenied(
      app,
      (c) => c.post('/api/admin/translations/machine').send({ entity: 'faq', ids: [faqIds[0]] }),
      NOT_ADMIN,
    )
  })

  test('queues non-reviewed fields; the 1-minute job translates a batch', async () => {
    features.translation = true
    const sent: string[][] = []
    setTranslationProvider({
      async translate({ texts }) {
        sent.push(texts)
        return texts.map((t) => `ع: ${t}`)
      },
    })
    await blankArabic(faqIds[0]!, 'answer')
    await blankArabic(faqIds[1]!, 'answer')
    const a = await as(ADMIN, app)
    const res = await a
      .post('/api/admin/translations/machine')
      .send({ entity: 'faq', ids: [faqIds[0], faqIds[1], faqIds[2]] })
    expect(res.status).toBe(202)
    // Questions (and FAQ 3) already have reviewed Arabic: only the two blank answers queue.
    expect(MachineTranslationQueued.parse(res.body)).toEqual({ queued: 2 })

    const result = await runSchedule('platform.machine_translation')
    expect(result).toEqual({ translated: 2, failed: 0, skipped: false })
    expect(sent).toHaveLength(1)
    const list = TranslationsPage.parse(
      (await a.get('/api/admin/translations?entity=faq&pageSize=50')).body,
    )
    const machine = list.items.filter((i) => i.status === 'machine')
    expect(machine).toHaveLength(2)
    expect(machine[0]!.ar).toStartWith('ع: ')
    expect(await runSchedule('platform.machine_translation')).toEqual({
      translated: 0,
      failed: 0,
      skipped: false,
    })
  })

  test('3 attempts per item, then dropped from the queue', async () => {
    features.translation = true
    setTranslationProvider({
      async translate() {
        throw new Error('provider down')
      },
    })
    await blankArabic(faqIds[0]!, 'answer')
    const a = await as(ADMIN, app)
    await a.post('/api/admin/translations/machine').send({ entity: 'faq', ids: [faqIds[0]] })
    for (let i = 0; i < 3; i++) await runSchedule('platform.machine_translation')
    const [s] = await db
      .select()
      .from(translationStatus)
      .where(eq(translationStatus.recordId, faqIds[0]!))
    expect(s).toMatchObject({ attempts: 3, queuedAt: null, lastError: 'provider down' })
    expect((await runSchedule('platform.machine_translation')) as object).toMatchObject({
      translated: 0,
    })
  })
})
