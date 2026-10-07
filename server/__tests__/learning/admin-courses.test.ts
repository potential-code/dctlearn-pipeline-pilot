import { beforeAll, describe, expect, test } from 'bun:test'
import { db } from '@server/db/connection'
import { enrolments } from '@server/db/schema/catalog'
import { auditLog } from '@server/db/schema/identity'
import { scormPackages } from '@server/db/schema/learning'
import { E } from '@server/db/seed/data'
import { drainJobs } from '@server/jobs/runtime'
import {
  AdminCourseDetail,
  AdminCoursesPage,
  CourseStatusResponse,
  UploadResponse,
} from '@shared/schemas/learning'
import { and, eq } from 'drizzle-orm'
import { strToU8, zipSync } from 'fflate'
import { expectDenied } from '../helpers/denials'
import { userByEmail } from '../helpers/fixtures'
import { anon, as } from '../helpers/http'
import { app, freshLearning, type LearningSeed, PNG_BYTES } from './helpers'

let seed: LearningSeed
beforeAll(async () => {
  seed = await freshLearning()
}, 120_000)

const deniedNonAdmins = { signedOut: null, learner: E.saeed!, subAdmin: E.omar!, judge: E.noura! }
const manifest = (href: string) =>
  `<?xml version="1.0"?><manifest identifier="m"><metadata><schemaversion>1.2</schemaversion></metadata><resources><resource identifier="r1" type="webcontent" adlcp:scormtype="sco" href="${href}"><file href="${href}"/></resource></resources></manifest>`
const zip = (files: Record<string, string>) =>
  Buffer.from(zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, strToU8(v)]))))

describe('P46 catalog', () => {
  test('list with counts, q / status / microsite filters; admin only', async () => {
    const a = await as(E.aisha!, app)
    const res = await a.get('/api/admin/courses?pageSize=100')
    expect(res.status).toBe(200)
    AdminCoursesPage.parse(res.body)
    expect(res.body.total).toBe(23)
    const c01 = res.body.items.find((c: { slug: string }) => c.slug === seed.courses.C01!.slug)
    // employees members (Saeed, Mona, Reem, Hamad, Former) + znm (Yousef) — Reem counted once.
    expect(c01).toMatchObject({ units: 4, enrolled: 6, completed: 3, status: 'published' })
    expect(c01.microsites.sort()).toEqual(['employees', 'znm'])
    const q = await a.get('/api/admin/courses?q=museum')
    expect(q.body.items.map((c: { title: { en: string } }) => c.title.en)).toContain('Museum 101')
    expect((await a.get('/api/admin/courses?microsite=znm')).body.total).toBe(6)
    expect((await a.get('/api/admin/courses?status=draft')).body.total).toBe(0)
    expect((await a.get('/api/admin/courses?status=bogus')).status).toBe(422)
    await expectDenied(app, (c) => c.get('/api/admin/courses'), deniedNonAdmins)
  })

  test('C01 detail is the full §2.1 tree', async () => {
    const res = await (await as(E.aisha!, app)).get(`/api/admin/courses/${seed.courses.C01!.id}`)
    const d = AdminCourseDetail.parse(res.body)
    expect(d.modules).toHaveLength(2)
    expect(d.modules.flatMap((m) => m.units)).toHaveLength(4)
    expect(d.modules[1]!.units[1]!.blocks.map((b) => b.type)).toEqual([
      'text',
      'action_plan',
      'resources',
    ])
    expect(d.assessments.map((a) => a.type).sort()).toEqual(['quiz_blocking', 'survey'])
    expect(d.course.pointsConfig).toEqual({ unit: 10, module: 0, course: 50, assessmentPass: 20 })
    expect(d.certificateSettings?.signatureName).toBe('Aisha Al Marzouqi')
    expect(
      (await (await as(E.aisha!, app)).get(`/api/admin/courses/${crypto.randomUUID()}`)).status,
    ).toBe(404)
  })
})

describe('P59 course editor', () => {
  let id: string
  test('create draft (slug from title), explicit duplicate slug 409, invalid 422', async () => {
    const a = await as(E.aisha!, app)
    const body = {
      title: { en: 'Visitor Care Basics', ar: 'أساسيات رعاية الزوار' },
      description: { en: '<p onclick="x()">Hi</p><script>alert(1)</script>', ar: '' },
      level: 'beginner',
      durationMin: 30,
      categories: ['Visitor Experience'],
      imageUrl: '',
      certificateEnabled: true,
      sequential: true,
    }
    const res = await a.post('/api/admin/courses').send(body)
    expect(res.status).toBe(201)
    id = res.body.id
    const d = AdminCourseDetail.parse((await a.get(`/api/admin/courses/${id}`)).body)
    expect(d.course).toMatchObject({ slug: 'visitor-care-basics', status: 'draft' })
    expect(d.course.description.en).toBe('<p>Hi</p>')
    expect(
      (await a.post('/api/admin/courses').send({ ...body, slug: seed.courses.C01!.slug })).status,
    ).toBe(409)
    expect(
      (await a.post('/api/admin/courses').send({ ...body, title: { en: '', ar: '' } })).status,
    ).toBe(422)
    expect(
      (await a.post('/api/admin/courses').send({ ...body, imageUrl: 'http://insecure' })).status,
    ).toBe(422)
    await expectDenied(app, (c) => c.post('/api/admin/courses').send(body), deniedNonAdmins)
  })

  test('publish needs a unit with content (409), then publish / archive per §9.1 with audit', async () => {
    const a = await as(E.aisha!, app)
    expect((await a.post(`/api/admin/courses/${id}/publish`)).status).toBe(409)
    const m = await a
      .post(`/api/admin/courses/${id}/modules`)
      .send({ title: { en: 'Basics', ar: '' } })
    expect(m.status).toBe(201)
    const u = await a
      .post(`/api/admin/courses/${id}/modules/${m.body.id}/units`)
      .send({ title: { en: 'Greeting visitors', ar: '' }, durationMin: 5 })
    expect(u.status).toBe(201)
    expect((await a.post(`/api/admin/courses/${id}/publish`)).status).toBe(409)
    const bad = await a
      .post(`/api/admin/courses/${id}/units/${u.body.id}/blocks`)
      .send({ type: 'image', payload: { url: 'https://x.example/a.png' } })
    expect(bad.status).toBe(422)
    expect(bad.body.error.fields['payload.alt']).toBeString()
    const b = await a.post(`/api/admin/courses/${id}/units/${u.body.id}/blocks`).send({
      type: 'text',
      payload: {
        html: {
          en: '<h2>Welcome</h2><img src="javascript:alert(1)"><a href="https://dct.gov.ae">DCT</a>',
          ar: '',
        },
      },
    })
    expect(b.status).toBe(201)
    const d = AdminCourseDetail.parse((await a.get(`/api/admin/courses/${id}`)).body)
    const html = (d.modules[0]!.units[0]!.blocks[0]!.payload.html as { en: string }).en
    expect(html).not.toContain('javascript')
    expect(html).toContain('rel="noopener noreferrer"')

    const pub = await a.post(`/api/admin/courses/${id}/publish`)
    expect(pub.status).toBe(200)
    CourseStatusResponse.parse(pub.body)
    expect((await a.post(`/api/admin/courses/${id}/publish`)).status).toBe(409)
    expect((await a.post(`/api/admin/courses/${id}/archive`)).body.status).toBe('archived')
    expect((await a.post(`/api/admin/courses/${id}/archive`)).status).toBe(409)
    expect((await a.post(`/api/admin/courses/${id}/publish`)).status).toBe(409)
    const audit = await db.select().from(auditLog).where(eq(auditLog.targetId, id))
    expect(audit.map((x) => x.action)).toEqual(
      expect.arrayContaining(['course.publish', 'course.archive']),
    )
    await expectDenied(app, (c) => c.post(`/api/admin/courses/${id}/archive`), deniedNonAdmins)
  })

  test('ifMatch: stale updatedAt → 409, current → 200', async () => {
    const a = await as(E.aisha!, app)
    const cid = seed.courses.C02!.id
    const d = AdminCourseDetail.parse((await a.get(`/api/admin/courses/${cid}`)).body)
    const ok = await a
      .put(`/api/admin/courses/${cid}`)
      .send({ durationMin: 65, ifMatch: d.course.updatedAt })
    expect(ok.status).toBe(200)
    expect(ok.body.course.durationMin).toBe(65)
    const stale = await a
      .put(`/api/admin/courses/${cid}`)
      .send({ durationMin: 70, ifMatch: d.course.updatedAt })
    expect(stale.status).toBe(409)
    expect(stale.body.error.code).toBe('conflict')
    expect((await a.put(`/api/admin/courses/${cid}`).send({ level: 'expert' })).status).toBe(422)
  })

  test('reorder modules / units / blocks; wrong set 422', async () => {
    const a = await as(E.aisha!, app)
    const cid = seed.courses.C04!.id
    const d = AdminCourseDetail.parse((await a.get(`/api/admin/courses/${cid}`)).body)
    const mids = d.modules.map((m) => m.id)
    expect(
      (await a.put(`/api/admin/courses/${cid}/modules/reorder`).send({ ids: [mids[0]] })).status,
    ).toBe(422)
    const r = await a
      .put(`/api/admin/courses/${cid}/modules/reorder`)
      .send({ ids: [...mids].reverse() })
    expect(r.status).toBe(200)
    expect(AdminCourseDetail.parse(r.body).modules.map((m) => m.id)).toEqual([...mids].reverse())
    const m0 = d.modules[0]!
    const uids = m0.units.map((u) => u.id)
    const ru = await a
      .put(`/api/admin/courses/${cid}/modules/${m0.id}/units/reorder`)
      .send({ ids: [...uids].reverse() })
    expect(ru.status).toBe(200)
    const unit = m0.units[0]!
    const bids = unit.blocks.map((b) => b.id)
    const rb = await a
      .put(`/api/admin/courses/${cid}/units/${unit.id}/blocks/reorder`)
      .send({ ids: [...bids].reverse() })
    const blocks = AdminCourseDetail.parse(rb.body)
      .modules.flatMap((m) => m.units)
      .find((u) => u.id === unit.id)!.blocks
    expect(blocks.map((b) => b.id)).toEqual([...bids].reverse())
  })

  test('card and certificate settings', async () => {
    const a = await as(E.aisha!, app)
    const cid = seed.courses.C05!.id
    const card = await a.put(`/api/admin/courses/${cid}/card`).send({
      imageUrl: 'https://cdn.example/c05.jpg',
      categories: ['Tourism Management'],
      level: 'advanced',
      durationMin: 90,
      comingSoon: true,
      isCertProgramme: false,
      overview: { en: '<p>Overview</p><iframe src="https://x"></iframe>', ar: '' },
    })
    expect(card.status).toBe(200)
    const d = AdminCourseDetail.parse(card.body)
    expect(d.card).toMatchObject({
      level: 'advanced',
      comingSoon: true,
      overview: { en: '<p>Overview</p>' },
    })
    const cert = await a.put(`/api/admin/courses/${cid}/certificate`).send({
      backgroundUrl: '',
      logoUrl: '',
      signatureName: 'Aisha',
      signatureTitle: 'Lead',
    })
    expect(AdminCourseDetail.parse(cert.body).certificateSettings?.signatureName).toBe('Aisha')
  })

  test('§9.5: removing a unit of a published course recalculates progress in a job; completed stay completed', async () => {
    const a = await as(E.aisha!, app)
    const c01 = seed.learning.content.C01!
    expect(
      (await a.delete(`/api/admin/courses/${seed.courses.C01!.id}/units/${c01.units[1]}`)).status,
    ).toBe(204)
    await drainJobs()
    const mona = await userByEmail(E.mona!)
    const saeed = await userByEmail(E.saeed!)
    const row = async (uid: string) =>
      (
        await db
          .select()
          .from(enrolments)
          .where(and(eq(enrolments.userId, uid), eq(enrolments.courseId, seed.courses.C01!.id)))
      )[0]!
    expect((await row(mona.id)).progressPct).toBe(33.3)
    expect(await row(saeed.id)).toMatchObject({ state: 'completed', progressPct: 100 })
    const view = await (await as(E.mona!, app)).get(
      `/api/microsites/employees/courses/${seed.courses.C01!.slug}`,
    )
    expect(view.body.modules[0].units).toHaveLength(1)
    // Adding a unit: Saeed stays completed.
    const m = c01.modules[1]!
    await a
      .post(`/api/admin/courses/${seed.courses.C01!.id}/modules/${m}/units`)
      .send({ title: { en: 'New', ar: '' } })
    await drainJobs()
    expect(await row(saeed.id)).toMatchObject({ state: 'completed' })
  })

  test('module / unit / block / assessment / question CRUD; foreign ids 404; invalid 422', async () => {
    const a = await as(E.aisha!, app)
    const cid = seed.courses.C06!.id
    const other = seed.courses.C07!.id
    const d = AdminCourseDetail.parse((await a.get(`/api/admin/courses/${cid}`)).body)
    const mod = d.modules[0]!
    const unit = mod.units[0]!
    const block = unit.blocks[0]!

    const renamed = await a
      .put(`/api/admin/courses/${cid}/modules/${mod.id}`)
      .send({ title: { en: 'Renamed', ar: '' } })
    expect(AdminCourseDetail.parse(renamed.body).modules[0]!.title.en).toBe('Renamed')
    expect(
      (
        await a
          .put(`/api/admin/courses/${other}/modules/${mod.id}`)
          .send({ title: { en: 'x', ar: '' } })
      ).status,
    ).toBe(404)
    const moved = await a
      .put(`/api/admin/courses/${cid}/units/${unit.id}`)
      .send({ title: { en: 'Moved', ar: '' }, moduleId: d.modules[1]!.id })
    const movedUnit = AdminCourseDetail.parse(moved.body).modules[1]!.units.find(
      (u) => u.id === unit.id,
    )
    expect(movedUnit?.title.en).toBe('Moved')
    const upd = await a
      .put(`/api/admin/courses/${cid}/blocks/${block.id}`)
      .send({ payload: { html: { en: '<b>bold</b><script>x</script>', ar: '' } }, required: false })
    const updated = AdminCourseDetail.parse(upd.body)
      .modules.flatMap((m) => m.units)
      .flatMap((u) => u.blocks)
      .find((b) => b.id === block.id)!
    expect(updated).toMatchObject({ required: false, payload: { html: { en: '<b>bold</b>' } } })
    expect((await a.delete(`/api/admin/courses/${cid}/blocks/${block.id}`)).status).toBe(204)
    expect((await a.delete(`/api/admin/courses/${cid}/blocks/${block.id}`)).status).toBe(404)

    const as1 = await a.post(`/api/admin/courses/${cid}/assessments`).send({
      title: { en: 'Curation check', ar: '' },
      type: 'quiz_non_blocking',
      passMark: 60,
      attemptsAllowed: 3,
      unitId: unit.id,
    })
    expect(as1.status).toBe(201)
    expect(
      (
        await a.post(`/api/admin/courses/${cid}/assessments`).send({
          title: { en: 'x', ar: '' },
          type: 'quiz_non_blocking',
          passMark: 60,
          attemptsAllowed: 3,
          unitId: seed.learning.content.C07!.units[0],
        })
      ).status,
    ).toBe(422)
    const qUrl = `/api/admin/courses/${cid}/assessments/${as1.body.id}/questions`
    const noKey = await a.post(qUrl).send({
      text: { en: 'Pick one', ar: '' },
      type: 'multiple_choice',
      options: [
        { text: { en: 'A', ar: '' }, correct: false },
        { text: { en: 'B', ar: '' }, correct: false },
      ],
    })
    expect(noKey.status).toBe(422)
    const q = await a.post(qUrl).send({
      text: { en: 'Order these', ar: '' },
      type: 'sorting',
      options: [
        { text: { en: 'First', ar: '' }, correct: false },
        { text: { en: 'Second', ar: '' }, correct: false },
      ],
    })
    expect(q.status).toBe(201)
    const put = await a
      .put(`/api/admin/courses/${cid}/assessments/${as1.body.id}`)
      .send({ passMark: 75, timeLimitMin: 10 })
    const assessment = AdminCourseDetail.parse(put.body).assessments.find(
      (x) => x.id === as1.body.id,
    )!
    expect(assessment).toMatchObject({ passMark: 75, timeLimitMin: 10, version: 1 })
    expect(assessment.questions).toHaveLength(1)
    expect((await a.delete(`${qUrl}/${q.body.id}`)).status).toBe(204)
    expect((await a.delete(`/api/admin/courses/${cid}/assessments/${as1.body.id}`)).status).toBe(
      204,
    )
    expect((await a.delete(`/api/admin/courses/${cid}/units/${unit.id}`)).status).toBe(204)
    expect((await a.delete(`/api/admin/courses/${cid}/modules/${mod.id}`)).status).toBe(204)
    const after = AdminCourseDetail.parse((await a.get(`/api/admin/courses/${cid}`)).body)
    expect(after.modules).toHaveLength(1)
    expect(after.assessments).toHaveLength(0)
    await expectDenied(
      app,
      (c) => c.delete(`/api/admin/courses/${cid}/modules/${after.modules[0]!.id}`),
      deniedNonAdmins,
    )
  })
})

describe('P59 uploads and SCORM', () => {
  test('image upload → public URL; unknown type 422; admin only', async () => {
    const a = await as(E.aisha!, app)
    const res = await a
      .post('/api/admin/uploads')
      .attach('file', PNG_BYTES, { filename: 'card.png', contentType: 'image/png' })
    expect(res.status).toBe(200)
    UploadResponse.parse(res.body)
    expect(res.body.url).toBe(`/api/files/public/${res.body.fileId}`)
    const txt = await a
      .post('/api/admin/uploads')
      .attach('file', Buffer.from('hello'), { filename: 'a.txt', contentType: 'text/plain' })
    expect(txt.status).toBe(422)
    expect((await a.post('/api/admin/uploads')).status).toBe(422)
    await expectDenied(
      app,
      (c) =>
        c
          .post('/api/admin/uploads')
          .attach('file', PNG_BYTES, { filename: 'a.png', contentType: 'image/png' }),
      deniedNonAdmins,
    )
  })

  test('SCORM zip-slip and missing manifest are rejected', async () => {
    const a = await as(E.aisha!, app)
    const slip = zip({
      'imsmanifest.xml': manifest('index.html'),
      'index.html': 'ok',
      '../../evil.js': 'pwn',
    })
    const r1 = await a
      .post('/api/admin/uploads')
      .attach('file', slip, { filename: 'p.zip', contentType: 'application/zip' })
    expect(r1.status).toBe(422)
    expect(r1.body.error.fields.file).toContain('Unsafe path')
    const abs = zip({
      'imsmanifest.xml': manifest('index.html'),
      'index.html': 'ok',
      '/etc/passwd': 'x',
    })
    expect(
      (
        await a
          .post('/api/admin/uploads')
          .attach('file', abs, { filename: 'p.zip', contentType: 'application/zip' })
      ).status,
    ).toBe(422)
    const noManifest = zip({ 'index.html': 'ok' })
    expect(
      (
        await a
          .post('/api/admin/uploads')
          .attach('file', noManifest, { filename: 'p.zip', contentType: 'application/zip' })
      ).status,
    ).toBe(422)
    const badLaunch = zip({ 'imsmanifest.xml': manifest('missing.html'), 'index.html': 'ok' })
    expect(
      (
        await a
          .post('/api/admin/uploads')
          .attach('file', badLaunch, { filename: 'p.zip', contentType: 'application/zip' })
      ).status,
    ).toBe(422)
    expect(await db.select().from(scormPackages)).toHaveLength(1) // only the seed package
  })

  test('valid package: unpacked by the job, used in a block, served behind course access', async () => {
    const a = await as(E.aisha!, app)
    const pkg = zip({
      'imsmanifest.xml': manifest('content/index.html'),
      'content/index.html': '<html>SCO</html>',
      'content/app.js': 'var x=1',
    })
    const up = await a
      .post('/api/admin/uploads')
      .attach('file', pkg, { filename: 'sco.zip', contentType: 'application/zip' })
    expect(up.status).toBe(200)
    const pkgId = up.body.fileId
    expect(
      (await db.select().from(scormPackages).where(eq(scormPackages.id, pkgId)))[0]!.status,
    ).toBe('pending')
    await drainJobs()
    const [row] = await db.select().from(scormPackages).where(eq(scormPackages.id, pkgId))
    expect(row).toMatchObject({
      status: 'ready',
      version: '1.2',
      launchPath: 'content/index.html',
      fileCount: 3,
    })

    const c01 = seed.learning.content.C01!
    const blk = await a
      .post(`/api/admin/courses/${seed.courses.C01!.id}/units/${c01.units[0]}/blocks`)
      .send({ type: 'scorm', payload: { packageId: pkgId }, required: false })
    expect(blk.status).toBe(201)
    expect(
      (
        await a
          .post(`/api/admin/courses/${seed.courses.C01!.id}/units/${c01.units[0]}/blocks`)
          .send({ type: 'scorm', payload: { packageId: crypto.randomUUID() } })
      ).status,
    ).toBe(422)

    const mona = await as(E.mona!, app)
    const file = await mona.get(`/api/scorm/${pkgId}/content/index.html`)
    expect(file.status).toBe(200)
    expect(file.headers['content-type']).toContain('text/html')
    expect(file.text).toContain('SCO')
    expect(file.headers['content-security-policy']).toContain("frame-ancestors 'self'")
    expect(
      (await mona.get(`/api/scorm/${pkgId}/content/app.js`)).headers['content-type'],
    ).toContain('javascript')
    expect((await mona.get(`/api/scorm/${pkgId}/content/nope.html`)).status).toBe(404)
    expect((await mona.get(`/api/scorm/${pkgId}/..%2F..%2Fimsmanifest.xml`)).status).toBe(404)
    expect(
      (await (await as(E.elise!, app)).get(`/api/scorm/${pkgId}/content/index.html`)).status,
    ).toBe(404)
    expect((await anon(app).get(`/api/scorm/${pkgId}/content/index.html`)).status).toBe(401)
    expect((await a.get(`/api/scorm/${pkgId}/content/index.html`)).status).toBe(200)
  })
})
