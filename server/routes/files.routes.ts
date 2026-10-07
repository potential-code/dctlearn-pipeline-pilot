import * as files from '@server/controllers/files.controller'
import { route } from '@server/lib/route'
import { Router } from 'express'
import { z } from 'zod'

export const filesRouter = Router()

const params = z.object({ id: z.uuid() })

route(filesRouter, {
  method: 'get',
  path: '/files/public/:id',
  summary: 'Public file (brand and course imagery)',
  tags: ['Files'],
  auth: 'public',
  params,
  raw: true,
  handler: async ({ req, res }) => files.servePublic(req, res),
})

route(filesRouter, {
  method: 'get',
  path: '/files/:id',
  summary: 'Private file through a signed, user-bound, 5-minute URL',
  tags: ['Files'],
  auth: 'signed URL (exp, uid, sig) for the same user',
  params,
  raw: true,
  handler: async ({ req, res }) => files.serveSigned(req, res),
})
