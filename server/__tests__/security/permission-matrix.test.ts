import { beforeAll, describe, expect, test } from 'bun:test'
import { app } from '@server/app'
import { E } from '@server/db/seed/data'
import { registry } from '@server/lib/openapi'
import { freshBase } from '../helpers/fixtures'
import { anon, as, type Client } from '../helpers/http'

/**
 * Contract §0.3 / §9.12 (2) across EVERY documented endpoint: walks the OpenAPI registry that
 * `route()` fills, so a new endpoint is covered automatically.
 *  - anything not `public` answers 401 to a signed-out caller (never 200);
 *  - /api/admin/* answers 403 to a learner, a mentor, a judge and a sub admin;
 *  - /api/mentor/* and /api/judge/* answer 403 to a learner.
 */

type Op = { method: 'get' | 'post' | 'put' | 'patch' | 'delete'; path: string; auth: string }

const ops: Op[] = []
for (const def of registry.definitions) {
  if (def.type !== 'route') continue
  const r = def.route as { method: Op['method']; path: string; description?: string }
  ops.push({
    method: r.method,
    path: r.path,
    auth: (r.description ?? '').replace('**Auth:** ', ''),
  })
}

const UUID = '00000000-0000-4000-8000-000000000000'
function concrete(path: string) {
  return path
    .replace('{p}', 'employees')
    .replace(/\{tab\}/, 'courses')
    .replace(/\{(token)\}/, 'x'.repeat(40))
    .replace(/\{(key)\}/, 'culture-bot')
    .replace(/\{(serial)\}/, 'NOPE-0000')
    .replace(/\{(page)\}/, 'students')
    .replace(/\{[^}]+\}/g, UUID)
}

function send(c: Client, op: Op) {
  const url = concrete(op.path)
  const req = c[op.method](url)
  return op.method === 'get' || op.method === 'delete' ? req : req.send({})
}

const isPublic = (op: Op) =>
  /^public\b/i.test(op.auth) ||
  /else public/.test(op.auth) ||
  /^signed URL/.test(op.auth) ||
  op.path.startsWith('/api/auth/')
/** Server-to-server routes authenticated by signature, not session. */
const isWebhook = (op: Op) => op.path.startsWith('/api/webhooks/')

beforeAll(async () => {
  await freshBase()
})

describe('permission matrix over every documented endpoint', () => {
  test('the registry is populated (all areas mounted)', () => {
    expect(ops.length).toBeGreaterThan(150)
  })

  test('signed out: every non-public endpoint is 401', async () => {
    const c = anon(app)
    const wrong: string[] = []
    for (const op of ops.filter((o) => !isPublic(o) && !isWebhook(o))) {
      const res = await send(c, op)
      if (res.status !== 401) wrong.push(`${op.method.toUpperCase()} ${op.path} → ${res.status}`)
    }
    expect(wrong).toEqual([])
  })

  test('webhooks without a valid signature are refused', async () => {
    for (const op of ops.filter(isWebhook)) {
      const res = await send(anon(app), op)
      expect([401, 403, 404]).toContain(res.status)
    }
  })

  for (const who of ['saeed', 'hessa', 'noura', 'omar'] as const) {
    test(`/api/admin/* is 403 for ${who}`, async () => {
      const c = await as(E[who]!, app)
      const wrong: string[] = []
      for (const op of ops.filter((o) => o.path.startsWith('/api/admin/'))) {
        const res = await send(c, op)
        if (res.status !== 403) wrong.push(`${op.method.toUpperCase()} ${op.path} → ${res.status}`)
      }
      expect(wrong).toEqual([])
    })
  }

  test('/api/mentor/* and /api/judge/* are 403 for a learner', async () => {
    const c = await as(E.saeed!, app)
    const wrong: string[] = []
    for (const op of ops.filter(
      (o) => o.path.startsWith('/api/mentor/') || o.path.startsWith('/api/judge/'),
    )) {
      const res = await send(c, op)
      if (res.status !== 403) wrong.push(`${op.method.toUpperCase()} ${op.path} → ${res.status}`)
    }
    expect(wrong).toEqual([])
  })

  test('sub admin of another microsite: /microsites/{p}/admin/* is 403', async () => {
    const c = await as(E.khalid!, app)
    const wrong: string[] = []
    for (const op of ops.filter((o) => o.path.startsWith('/api/microsites/{p}/admin/'))) {
      const res = await send(c, op)
      if (res.status !== 403) wrong.push(`${op.method.toUpperCase()} ${op.path} → ${res.status}`)
    }
    expect(wrong).toEqual([])
  })

  test('no endpoint answers 500 to a learner probing it', async () => {
    const c = await as(E.mona!, app)
    const wrong: string[] = []
    for (const op of ops.filter((o) => !isWebhook(o) && !o.path.startsWith('/api/auth/'))) {
      const res = await send(c, op)
      if (res.status >= 500)
        wrong.push(
          `${op.method.toUpperCase()} ${op.path} → ${res.status} ${JSON.stringify(res.body).slice(0, 160)}`,
        )
    }
    expect(wrong).toEqual([])
  })
})
