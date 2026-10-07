import { beforeEach, describe, expect, test } from 'bun:test'
import { db } from '@server/db/connection'
import { forms } from '@server/db/schema/forms'
import { auditLog } from '@server/db/schema/identity'
import { E } from '@server/db/seed/data'
import { storeUpload } from '@server/services/files.service'
import { AdminForm, AdminFormsPage, EntriesPage, LearnerForm } from '@shared/schemas/forms'
import { DashboardResponse } from '@shared/schemas/microsites'
import { eq } from 'drizzle-orm'
import { expectDenied } from '../helpers/denials'
import { userByEmail } from '../helpers/fixtures'
import { as } from '../helpers/http'
import { app, freshContent, pdfBytes } from './helpers'

let seeded: Awaited<ReturnType<typeof freshContent>>
beforeEach(async () => {
  seeded = await freshContent()
})

const survey = (over: Record<string, unknown> = {}) => ({
  title: { en: 'Workshop feedback', ar: 'ملاحظات الورشة' },
  kind: 'survey',
  microsites: ['employees'],
  status: 'published',
  fields: [
    {
      key: 'score',
      label: { en: 'Score', ar: '' },
      type: 'select',
      required: true,
      options: [
        { value: 'good', label: { en: 'Good', ar: '' } },
        { value: 'bad', label: { en: 'Bad', ar: '' } },
      ],
    },
    { key: 'note', label: { en: 'Note', ar: '' }, type: 'text', required: false, maxLength: 100 },
    { key: 'cv', label: { en: 'CV', ar: '' }, type: 'file', required: false },
  ],
  ...over,
})

const nonAdmins = {
  signedOut: null,
  learner: E.saeed!,
  subAdmin: E.omar!,
  mentor: E.hessa!,
  judge: E.noura!,
}

describe('P56 admin forms', () => {
  test('list, create, update, validation of the field list', async () => {
    const a = await as(E.aisha!, app)
    const list = await a.get('/api/admin/forms')
    expect(list.status).toBe(200)
    AdminFormsPage.parse(list.body)
    expect(list.body.total).toBe(2)
    expect((await a.get('/api/admin/forms?kind=registration')).body.items[0].microsites).toEqual([
      'elevate',
    ])

    const created = await a.post('/api/admin/forms').send(survey())
    expect(created.status).toBe(201)
    AdminForm.parse(created.body)
    expect(created.body.microsites).toEqual(['employees'])

    const updated = await a
      .put(`/api/admin/forms/${created.body.id}`)
      .send(survey({ microsites: ['employees', 'znm'], status: 'closed' }))
    expect(updated.status).toBe(200)
    expect(updated.body).toMatchObject({ status: 'closed', microsites: ['employees', 'znm'] })

    const dupKey = survey({
      fields: [
        { key: 'a', label: { en: 'A', ar: '' }, type: 'text', required: true },
        { key: 'a', label: { en: 'B', ar: '' }, type: 'text', required: true },
      ],
    })
    const noOptions = survey({
      fields: [{ key: 'a', label: { en: 'A', ar: '' }, type: 'radio', required: true }],
    })
    for (const body of [
      dupKey,
      noOptions,
      survey({ kind: 'quiz' }),
      survey({ fields: [] }),
      survey({ microsites: ['nowhere'] }),
    ]) {
      expect((await a.post('/api/admin/forms').send(body)).status).toBe(422)
    }
    expect(
      (await a.put('/api/admin/forms/00000000-0000-4000-8000-000000000000').send(survey())).status,
    ).toBe(404)
    await expectDenied(app, (c) => c.get('/api/admin/forms'), nonAdmins)
    await expectDenied(app, (c) => c.post('/api/admin/forms').send(survey()), nonAdmins)
  })

  test('entries list and CSV (audited, formula-safe)', async () => {
    const a = await as(E.aisha!, app)
    const created = await a.post('/api/admin/forms').send(survey())
    const m = await as(E.mona!, app)
    await m
      .post(`/api/forms/${created.body.id}/entries`)
      .send({ answers: { score: 'good', note: '=HYPERLINK("http://x")' } })

    const entries = await a.get(`/api/admin/forms/${created.body.id}/entries`)
    expect(entries.status).toBe(200)
    EntriesPage.parse(entries.body)
    expect(entries.body.items[0].user.email).toBe(E.mona)

    const csv = await a.get(`/api/admin/forms/${created.body.id}/entries.csv`)
    expect(csv.status).toBe(200)
    expect(csv.headers['content-type']).toContain('text/csv')
    const lines = csv.text.replace(/^﻿/, '').trim().split('\r\n')
    expect(lines[0]).toBe('entryId,submittedAt,name,email,microsite,score,note,cv')
    expect(lines[1]).toContain(`Mona Al Ameri,${E.mona},employees,good,"'=HYPERLINK(""http://x"")"`)
    const audit = await db.select().from(auditLog).where(eq(auditLog.action, 'form.entries_export'))
    expect(audit).toHaveLength(1)

    await expectDenied(app, (c) => c.get(`/api/admin/forms/${created.body.id}/entries`), nonAdmins)
    await expectDenied(
      app,
      (c) => c.get(`/api/admin/forms/${created.body.id}/entries.csv`),
      nonAdmins,
    )
  })

  test('soft delete hides the form from learners and lists', async () => {
    const a = await as(E.aisha!, app)
    const id = seeded.content.forms.onboardingPulse
    expect((await (await as(E.mona!, app)).get(`/api/forms/${id}`)).status).toBe(200)
    expect((await a.delete(`/api/admin/forms/${id}`)).status).toBe(204)
    const [row] = await db.select().from(forms).where(eq(forms.id, id))
    expect(row?.deletedAt).not.toBeNull()
    expect((await a.get('/api/admin/forms')).body.total).toBe(1)
    expect((await (await as(E.mona!, app)).get(`/api/forms/${id}`)).status).toBe(404)
    expect((await a.delete(`/api/admin/forms/${id}`)).status).toBe(404)
    await expectDenied(app, (c) => c.delete(`/api/admin/forms/${id}`), nonAdmins)
  })
})

describe('Learner forms', () => {
  test('mentee registration form with myEntry; non-members and drafts 404', async () => {
    const id = seeded.content.forms.menteeRegistration
    const s = await as(E.saeed!, app)
    const res = await s.get(`/api/forms/${id}`)
    expect(res.status).toBe(200)
    LearnerForm.parse(res.body)
    expect(res.body.fields.map((f: { key: string }) => f.key)).toEqual([
      'goals',
      'yearsAtDct',
      'preferredAreas',
      'language',
    ])
    expect(res.body.myEntry.answers.yearsAtDct).toBe('3-5')
    // one entry only
    expect(
      (
        await s.post(`/api/forms/${id}/entries`).send({
          answers: { goals: 'x', yearsAtDct: '0-2', preferredAreas: ['research'], language: 'en' },
        })
      ).status,
    ).toBe(409)

    // not a member of elevate → 404 (cannot probe ids)
    expect((await (await as(E.mona!, app)).get(`/api/forms/${id}`)).status).toBe(404)
    expect((await (await as(E.hessa!, app)).get(`/api/forms/${id}`)).status).toBe(404)
    expect((await s.get('/api/forms/00000000-0000-4000-8000-000000000000')).status).toBe(404)
    expect((await s.get('/api/forms/not-a-uuid')).status).toBe(404)

    await db.update(forms).set({ status: 'draft' }).where(eq(forms.id, id))
    expect((await s.get(`/api/forms/${id}`)).status).toBe(404)
    await expectDenied(app, (c) => c.get(`/api/forms/${id}`), { signedOut: null })
  })

  test('submit: validation, sanitised text, one entry rule, own files only', async () => {
    const a = await as(E.aisha!, app)
    const created = await a.post('/api/admin/forms').send(survey())
    const id = created.body.id
    const m = await as(E.mona!, app)

    for (const answers of [
      {},
      { score: 'excellent' },
      { score: 'good', note: 'x'.repeat(101) },
      { score: 'good', note: 42 },
      { score: 'good', cv: 'not-a-file' },
    ]) {
      const r = await m.post(`/api/forms/${id}/entries`).send({ answers })
      expect(r.status).toBe(422)
      expect(r.body.error.fields).toBeObject()
    }
    expect((await m.post(`/api/forms/${id}/entries`).send({})).status).toBe(422)

    // a file uploaded by someone else cannot be attached
    const reem = await userByEmail(E.reem!)
    const othersFile = await storeUpload({
      bytes: new Uint8Array(await pdfBytes()),
      declaredMime: 'application/pdf',
      originalName: 'cv.pdf',
      category: 'pdf',
      ownerId: reem.id,
    })
    expect(
      (
        await m
          .post(`/api/forms/${id}/entries`)
          .send({ answers: { score: 'good', cv: othersFile.id } })
      ).status,
    ).toBe(422)

    const ok = await m
      .post(`/api/forms/${id}/entries`)
      .send({ answers: { score: 'good', note: '<b>Great</b><script>alert(1)</script>' } })
    expect(ok.status).toBe(201)
    expect(ok.body.id).toBeString()
    const mine = await m.get(`/api/forms/${id}`)
    expect(mine.body.myEntry.answers).toEqual({ score: 'good', note: 'Great' })
    expect(
      (await m.post(`/api/forms/${id}/entries`).send({ answers: { score: 'bad' } })).status,
    ).toBe(409)

    // znm learner cannot submit to an employees form
    expect(
      (
        await (
          await as(E.yousef!, app)
        )
          .post(`/api/forms/${id}/entries`)
          .send({ answers: { score: 'good' } })
      ).status,
    ).toBe(404)
  })

  test('P14 surveys: pending dashboard forms disappear once answered', async () => {
    const m = await as(E.mona!, app)
    const dash = await m.get('/api/microsites/employees/dashboard')
    expect(dash.status).toBe(200)
    DashboardResponse.parse(dash.body)
    expect(dash.body.surveys).toEqual([
      {
        formId: seeded.content.forms.onboardingPulse,
        title: { en: 'Onboarding pulse survey', ar: 'استبيان التهيئة' },
        dueAt: '2026-10-20T20:00:00.000Z',
      },
    ])
    await m
      .post(`/api/forms/${seeded.content.forms.onboardingPulse}/entries`)
      .send({ answers: { rating: '5' } })
    expect((await m.get('/api/microsites/employees/dashboard')).body.surveys).toEqual([])
  })
})
