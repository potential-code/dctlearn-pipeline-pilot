import { app as defaultApp } from '@server/app'
import type { Express } from 'express'
import request from 'supertest'

export const ORIGIN = 'http://localhost:5173'
export const PASSWORD = 'Dct!2026demo'

/** A cookie-carrying client. Every request sends the allowed Origin (CSRF check). */
export type Client = ReturnType<typeof makeClient>

function makeClient(app: Express, cookie: string[] = []) {
  const jar = { cookie }
  const withHeaders = (r: request.Test) => {
    r.set('Origin', ORIGIN)
    if (jar.cookie.length) r.set('Cookie', jar.cookie.join('; '))
    return r.on('response', (res: { headers: Record<string, string | string[] | undefined> }) => {
      const set = res.headers['set-cookie']
      if (!set) return
      for (const c of Array.isArray(set) ? set : [set]) {
        const pair = c.split(';')[0] ?? ''
        const name = pair.split('=')[0]
        jar.cookie = jar.cookie.filter((x) => !x.startsWith(`${name}=`))
        if (!/max-age=0/i.test(c)) jar.cookie.push(pair)
      }
    })
  }
  const agent = request(app)
  return {
    jar,
    get: (url: string) => withHeaders(agent.get(url)),
    post: (url: string) => withHeaders(agent.post(url)),
    put: (url: string) => withHeaders(agent.put(url)),
    patch: (url: string) => withHeaders(agent.patch(url)),
    delete: (url: string) => withHeaders(agent.delete(url)),
  }
}

/** Signed-out client. */
export function anon(app: Express = defaultApp) {
  return makeClient(app)
}

/** Signs in through the real Better Auth route and returns a client with the session cookie. */
export async function as(email: string, app: Express = defaultApp, password = PASSWORD) {
  const client = makeClient(app)
  const res = await client.post('/api/auth/sign-in/email').send({ email, password })
  if (res.status !== 200)
    throw new Error(`Sign-in as ${email} failed: ${res.status} ${JSON.stringify(res.body)}`)
  return client
}
