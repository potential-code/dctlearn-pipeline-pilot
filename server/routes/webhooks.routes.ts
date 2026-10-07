import { zoomWebhook } from '@server/controllers/mentoring.controller'
import { route } from '@server/lib/route'
import { Router } from 'express'
import { z } from 'zod'

/** Server-to-server callbacks (exempt from the browser origin check; HMAC instead). */
export const webhooksRouter = Router()

const ZoomAck = z.union([
  z.strictObject({ ok: z.literal(true) }),
  z.strictObject({ plainToken: z.string(), encryptedToken: z.string() }),
])

route(webhooksRouter, {
  method: 'post',
  path: '/webhooks/zoom',
  summary: 'Zoom Video SDK webhook — URL validation and session attendance',
  tags: ['Webhooks'],
  auth: 'public · HMAC `x-zm-signature` (401 when invalid or Zoom not configured)',
  response: ZoomAck,
  handler: zoomWebhook,
})
