import { env } from '@server/config/env'
import { db } from '@server/db/connection'
import { route } from '@server/lib/route'
import { sql } from 'drizzle-orm'
import { Router } from 'express'
import { z } from 'zod'

export const healthRouter = Router()

route(healthRouter, {
  method: 'get',
  path: '/health',
  summary: 'Health check',
  tags: ['System'],
  auth: 'public',
  response: z.strictObject({
    status: z.enum(['ok', 'degraded']),
    db: z.enum(['ok', 'down']),
    version: z.string(),
  }),
  handler: async ({ res }) => {
    const dbOk = await db
      .execute(sql`select 1`)
      .then(() => true)
      .catch(() => false)
    if (!dbOk) res.status(503)
    return {
      status: dbOk ? 'ok' : 'degraded',
      db: dbOk ? 'ok' : 'down',
      version: env.APP_VERSION,
    } as const
  },
})
