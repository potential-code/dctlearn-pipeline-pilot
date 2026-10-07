import { beforeEach, describe, expect, test } from 'bun:test'
import { db } from '@server/db/connection'
import { auditLog } from '@server/db/schema/identity'
import { resources } from '@server/db/schema/resources'
import { E } from '@server/db/seed/data'
import { DashboardResponse, SubAdminDashboard } from '@shared/schemas/microsites'
import {
  AdminResourcesPage,
  HubResourcesPage,
  SubResource,
  SubResourcesPage,
} from '@shared/schemas/resources'
import { eq, like } from 'drizzle-orm'
import { expectDenied } from '../helpers/denials'
import { as } from '../helpers/http'
import { lastMailTo } from '../helpers/mail'
import { app, freshContent, hub, pdfBytes } from './helpers'

let seeded: Awaited<ReturnType<typeof freshContent>>
beforeEach(async () => {
  seeded = await freshContent()
})

const link = { title: { en: 'Floor plan', ar: 'مخطط' }, url: 'https://znm.example/floor-plan' }
const audits = (prefix: string) =>
  db
    .select()
    .from(auditLog)
    .where(like(auditLog.action, `${prefix}%`))

describe('P53 sub-admin resources', () => {
  test('list own microsite only; PDF links are signed', async () => {
    const k = await as(E.khalid!, app)
    const res = await k.get('/api/microsites/znm/admin/resources')
    expect(res.status).toBe(200)
    SubResourcesPage.parse(res.body)
    expect(res.body.total).toBe(2)
    const pdf = res.body.items.find((r: { type: string }) => r.type === 'pdf')
    expect(pdf.url).toMatch(/^\/api\/files\/[0-9a-f-]{36}\?exp=\d+&uid=.+&sig=/)
    expect((await k.get('/api/microsites/znm/admin/resources?status=pending')).body.total).toBe(1)

    await expectDenied(app, (c) => c.get('/api/microsites/znm/admin/resources'), {
      signedOut: null,
      learner: E.yousef!,
      otherSubAdmin: E.omar!,
      mentor: E.hessa!,
      judge: E.noura!,
    })
  })

  test('add https link → pending, admins told, audited; http / nothing → 422', async () => {
    const k = await as(E.khalid!, app)
    const res = await k.post('/api/microsites/znm/admin/resources').send(link)
    expect(res.status).toBe(201)
    SubResource.parse(res.body)
    expect(res.body).toMatchObject({ status: 'pending', type: 'link', url: link.url })
    const mail = await lastMailTo(E.aisha!, 'admin-resource-pending')
    expect(mail?.text).toContain('Floor plan')
    expect(await audits('resource.create')).toHaveLength(1)

    for (const body of [
      { ...link, url: 'http://znm.example/x' },
      { ...link, url: 'javascript:alert(1)' },
      { title: link.title },
      { url: link.url },
      { ...link, imageUrl: 'http://img.example/a.png' },
    ]) {
      const r = await k.post('/api/microsites/znm/admin/resources').send(body)
      expect(r.status).toBe(422)
    }
    await expectDenied(app, (c) => c.post('/api/microsites/znm/admin/resources').send(link), {
      signedOut: null,
      learner: E.yousef!,
      otherSubAdmin: E.omar!,
    })
  })

  test('upload a PDF (checked by content)', async () => {
    const k = await as(E.khalid!, app)
    const res = await k
      .post('/api/microsites/znm/admin/resources')
      .field('title[en]', 'Evacuation plan')
      .field('title[ar]', '')
      .attach('file', await pdfBytes(), { filename: 'plan.pdf', contentType: 'application/pdf' })
    expect(res.status).toBe(201)
    expect(res.body.type).toBe('pdf')
    expect(res.body.url).toContain('/api/files/')

    const fake = await k
      .post('/api/microsites/znm/admin/resources')
      .field('title[en]', 'Not a pdf')
      .attach('file', Buffer.from('<html>hi</html>'), {
        filename: 'x.pdf',
        contentType: 'application/pdf',
      })
    expect(fake.status).toBe(422)
    const both = await k
      .post('/api/microsites/znm/admin/resources')
      .field('title[en]', 'Both')
      .field('url', 'https://znm.example/x')
      .attach('file', await pdfBytes(), { filename: 'plan.pdf', contentType: 'application/pdf' })
    expect(both.status).toBe(422)
  })

  test("another microsite's resource is 404; soft delete", async () => {
    const k = await as(E.khalid!, app)
    const { sharepoint, ticketingFaq } = seeded.content.resources
    expect(
      (await k.put(`/api/microsites/znm/admin/resources/${sharepoint}`).send(link)).status,
    ).toBe(404)
    expect((await k.delete(`/api/microsites/znm/admin/resources/${sharepoint}`)).status).toBe(404)

    expect((await k.delete(`/api/microsites/znm/admin/resources/${ticketingFaq}`)).status).toBe(204)
    const [row] = await db.select().from(resources).where(eq(resources.id, ticketingFaq))
    expect(row?.deletedAt).not.toBeNull()
    expect((await k.get('/api/microsites/znm/admin/resources')).body.total).toBe(1)
    expect((await k.delete(`/api/microsites/znm/admin/resources/${ticketingFaq}`)).status).toBe(404)
    const a = await as(E.aisha!, app)
    expect((await a.post(`/api/admin/resources/${ticketingFaq}/approve`)).status).toBe(404)
    expect(await audits('resource.delete')).toHaveLength(1)
  })

  test('P35 pendingResources KPI', async () => {
    const k = await as(E.khalid!, app)
    const res = await k.get('/api/microsites/znm/admin/dashboard')
    expect(res.status).toBe(200)
    SubAdminDashboard.parse(res.body)
    expect(res.body.kpis.pendingResources).toBe(1)
  })
})

describe('P54 admin verification and §9.1 transitions', () => {
  test('list pending (default) with microsite and submitter', async () => {
    const a = await as(E.aisha!, app)
    const res = await a.get('/api/admin/resources')
    expect(res.status).toBe(200)
    AdminResourcesPage.parse(res.body)
    expect(res.body.total).toBe(1)
    expect(res.body.items[0].microsite.id).toBe('znm')
    expect(res.body.items[0].submittedBy.email).toBe(E.khalid)
    expect((await a.get('/api/admin/resources?status=rejected')).body.total).toBe(1)
    expect((await a.get('/api/admin/resources?status=nope')).status).toBe(422)
    await expectDenied(app, (c) => c.get('/api/admin/resources'), {
      signedOut: null,
      learner: E.saeed!,
      subAdmin: E.khalid!,
      mentor: E.hessa!,
    })
  })

  test('pending → approved → (edit) pending → rejected → (edit) pending', async () => {
    const a = await as(E.aisha!, app)
    const k = await as(E.khalid!, app)
    const id = seeded.content.resources.ticketingFaq

    expect((await a.post(`/api/admin/resources/${id}/approve`)).status).toBe(200)
    expect((await lastMailTo(E.khalid!, 'resource-approved'))?.text).toContain('Ticketing FAQ')
    expect((await a.post(`/api/admin/resources/${id}/approve`)).status).toBe(409)
    expect((await a.post(`/api/admin/resources/${id}/reject`).send({ note: 'x' })).status).toBe(409)
    expect((await hub(E.yousef!, 'znm', 'resources')).body.total).toBe(2)

    // approved → pending on edit; learners no longer see it
    const edited = await k
      .put(`/api/microsites/znm/admin/resources/${id}`)
      .send({ title: { en: 'Ticketing FAQ v2', ar: '' } })
    expect(edited.status).toBe(200)
    expect(edited.body).toMatchObject({
      status: 'pending',
      url: 'https://znm.example/ticketing-faq',
    })
    expect((await hub(E.yousef!, 'znm', 'resources')).body.total).toBe(1)

    expect((await a.post(`/api/admin/resources/${id}/reject`).send({})).status).toBe(422)
    const rejected = await a.post(`/api/admin/resources/${id}/reject`).send({ note: 'Broken link' })
    expect(rejected.status).toBe(200)
    expect((await lastMailTo(E.khalid!, 'resource-rejected'))?.text).toContain('Broken link')
    const list = await k.get('/api/microsites/znm/admin/resources?status=rejected')
    expect(list.body.items[0].reviewNote).toBe('Broken link')

    // rejected → pending on resubmit; note cleared
    const again = await k
      .put(`/api/microsites/znm/admin/resources/${id}`)
      .send({ title: { en: 'Ticketing FAQ v3', ar: '' }, url: 'https://znm.example/faq' })
    expect(again.body.status).toBe('pending')
    expect(again.body.reviewNote).toBeUndefined()

    expect((await audits('resource.approve')).length).toBe(1)
    expect((await audits('resource.reject')).length).toBe(1)
    expect((await audits('resource.update')).length).toBe(2)

    await expectDenied(app, (c) => c.post(`/api/admin/resources/${id}/approve`), {
      signedOut: null,
      learner: E.yousef!,
      subAdmin: E.khalid!,
    })
  })
})

describe('Learners: P52 resources tab, P14 resources', () => {
  test('approved only, own microsite, type filter', async () => {
    const znm = await hub(E.yousef!, 'znm', 'resources')
    expect(znm.status).toBe(200)
    HubResourcesPage.parse(znm.body)
    expect(znm.body.items.map((r: { title: { en: string } }) => r.title.en)).toEqual([
      'ZNM Visitor Code of Conduct',
    ])
    expect(znm.body.items[0].type).toBe('pdf')
    expect((await hub(E.yousef!, 'znm', 'resources', 'type=link')).body.total).toBe(0)
    const museo = await hub(E.elise!, 'museopro', 'resources')
    expect(museo.body.items[0].url).toStartWith('https://icom.museum/')
    // employees has no resources tab
    expect((await hub(E.mona!, 'employees', 'resources')).status).toBe(404)

    const dash = await (await as(E.yousef!, app)).get('/api/microsites/znm/dashboard')
    expect(dash.status).toBe(200)
    DashboardResponse.parse(dash.body)
    expect(dash.body.resources).toHaveLength(1)
    expect(dash.body.resources[0].title.en).toBe('ZNM Visitor Code of Conduct')

    await expectDenied(app, (c) => c.get('/api/microsites/znm/hub/resources'), {
      signedOut: null,
      otherLearner: E.elise!,
      mentor: E.hessa!,
    })
  })
})
