import { expect } from 'bun:test'
import type { Express } from 'express'
import type request from 'supertest'
import { anon, as, type Client } from './http'

/**
 * Contract §9.12 (2): every role not allowed gets 401/403/404. `who` maps a label to an e-mail
 * (or `null` for signed out); `expect` is the status per label (default 403, signed out 401).
 */
export async function expectDenied(
  app: Express,
  send: (client: Client) => request.Test,
  who: Record<string, string | null>,
  statuses: Record<string, number> = {},
) {
  for (const [label, email] of Object.entries(who)) {
    const client = email ? await as(email, app) : anon(app)
    const res = await send(client)
    const expected = statuses[label] ?? (email ? 403 : 401)
    if (res.status !== expected) {
      throw new Error(
        `${label}: expected ${expected}, got ${res.status} ${JSON.stringify(res.body)}`,
      )
    }
    expect(res.body.error?.code).toBeString()
  }
}
