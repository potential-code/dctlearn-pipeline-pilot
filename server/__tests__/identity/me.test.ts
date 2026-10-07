import { beforeAll, describe, expect, test } from 'bun:test'
import { E } from '@server/db/seed/data'
import { MeResponse, MyMicrositesResponse, ProfileResponse } from '@shared/schemas/identity'
import { freshBase, sessionsOf, userByEmail } from '../helpers/fixtures'
import { anon, as } from '../helpers/http'

beforeAll(freshBase)

const PNG = Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000', 'hex')

describe('P06 /api/me and P13 hub picker', () => {
  test('shapes match the contract exactly', async () => {
    const c = await as(E.saeed!)
    const me = await c.get('/api/me')
    MeResponse.parse(me.body)
    expect(me.body.user.email).toBe(E.saeed)
    const hubs = await c.get('/api/me/microsites')
    expect(hubs.status).toBe(200)
    MyMicrositesResponse.parse(hubs.body)
    expect(hubs.body.items.map((i: { id: string }) => i.id).sort()).toEqual([
      'elevate',
      'employees',
    ])
    const emp = hubs.body.items.find((i: { id: string }) => i.id === 'employees')
    expect(emp.features).toEqual(['courses', 'workshops', 'mentors', 'ai_coaches', 'ai_tools'])
  })

  test('signed out → 401', async () => {
    expect((await anon().get('/api/me/microsites')).status).toBe(401)
  })
})

describe('P15 profile', () => {
  test('update editable fields; read-only and role/status are ignored', async () => {
    const c = await as(E.mona!)
    const res = await c.put('/api/me/profile').send({
      firstName: 'Mona',
      lastName: 'Al Ameri',
      position: 'Section Head',
      preferredLanguage: 'ar',
      mobile: '+971 50 000 0000',
      employeeId: 'HACK',
      role: 'admin',
      status: 'active',
    })
    expect(res.status).toBe(200)
    ProfileResponse.parse(res.body)
    expect(res.body.profile.position).toBe('Section Head')
    expect(res.body.user.locale).toBe('ar')
    expect(res.body.user.role).toBe('learner')
    expect(res.body.readOnly.employeeId).toBeUndefined()
  })

  test('empty update is a no-op, not an error', async () => {
    const c = await as(E.mona!)
    const res = await c.put('/api/me/profile').send({})
    expect(res.status).toBe(200)
    expect((await c.put('/api/me/profile').send({ preferredLanguage: 'en' })).status).toBe(200)
  })

  test('invalid linkedin url → 422 with field', async () => {
    const c = await as(E.mona!)
    const res = await c.put('/api/me/profile').send({ linkedinUrl: 'http://insecure.example' })
    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('validation_failed')
    expect(res.body.error.fields.linkedinUrl).toBeString()
  })

  test('locale + tour seen', async () => {
    const c = await as(E.mona!)
    expect((await c.put('/api/me/locale').send({ locale: 'en' })).status).toBe(204)
    expect((await c.post('/api/me/tour-seen')).status).toBe(204)
  })

  test('photo: real PNG accepted, text pretending to be PNG refused', async () => {
    const c = await as(E.mona!)
    const ok = await c
      .post('/api/me/photo')
      .attach('file', PNG, { filename: 'me.png', contentType: 'image/png' })
    expect(ok.status).toBe(200)
    expect(ok.body.imageUrl).toStartWith('/api/files/')
    const file = await c.get(ok.body.imageUrl)
    expect(file.status).toBe(200)
    expect(file.headers['content-type']).toBe('image/png')
    // The signed URL is bound to Mona: someone else gets 404.
    const other = await as(E.reem!)
    expect((await other.get(ok.body.imageUrl)).status).toBe(404)
    const bad = await c
      .post('/api/me/photo')
      .attach('file', Buffer.from('<script>alert(1)</script>'), {
        filename: 'x.png',
        contentType: 'image/png',
      })
    expect(bad.status).toBe(422)
  })

  test('password change needs the current password and ends other sessions', async () => {
    const first = await as(E.yousef!)
    const second = await as(E.yousef!)
    const wrong = await second
      .post('/api/me/password')
      .send({ currentPassword: 'nope-nope-nope', newPassword: 'NewPassw0rd!x' })
    expect(wrong.status).toBe(422)
    expect(wrong.body.error.fields.currentPassword).toBeString()
    const ok = await second
      .post('/api/me/password')
      .send({ currentPassword: 'Dct!2026demo', newPassword: 'NewPassw0rd!x' })
    expect(ok.status).toBe(204)
    expect((await first.get('/api/me')).status).toBe(401)
    expect((await second.get('/api/me')).status).toBe(200)
  })

  test('revoke-all logs out everywhere', async () => {
    const c = await as(E.reem!)
    await as(E.reem!)
    expect((await c.post('/api/me/sessions/revoke-all')).status).toBe(204)
    const user = await userByEmail(E.reem!)
    expect(await sessionsOf(user.id)).toHaveLength(0)
  })
})
