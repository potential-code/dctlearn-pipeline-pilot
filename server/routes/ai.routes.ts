import * as ctl from '@server/controllers/ai.controller'
import { route } from '@server/lib/route'
import { requireAuth, requireRole } from '@server/middleware/auth.middleware'
import { requireFeature, requireMember } from '@server/middleware/microsite.middleware'
import { publicFormLimiter } from '@server/middleware/rate-limit.middleware'
import {
  AdminAiEmbed,
  AdminAiEmbedsPage,
  AdminAiQuery,
  AiEmbed,
  AiEmbedCreate,
  AiEmbedInput,
  AiSession,
  EmbedKeyParam,
  MicrositeAi,
  VoiceIntakeInput,
  VoiceIntakeResponse,
} from '@shared/schemas/ai'
import { micrositeParam } from '@shared/schemas/common'
import { Router } from 'express'

/** P23–P27 AI coaches, tools and voice hiring; P61 admin AI embeds. */
export const aiRouter = Router()

const tags = ['AI']

route(aiRouter, {
  method: 'get',
  path: '/microsites/:p/ai',
  summary: 'P23 AI coaches and tools of the microsite',
  tags,
  auth: 'member(p) · AI on for p (404 feature_off)',
  middleware: [...requireMember, requireFeature('ai')],
  params: micrositeParam,
  response: MicrositeAi,
  handler: ctl.micrositeAi,
})
route(aiRouter, {
  method: 'get',
  path: '/ai/embeds/:key',
  summary: 'P24–P27 One AI embed',
  tags,
  auth: 'member(p) of a linked microsite when requiresLogin, else public',
  params: EmbedKeyParam,
  response: AiEmbed,
  handler: ctl.embed,
})
route(aiRouter, {
  method: 'post',
  path: '/ai/embeds/:key/session',
  summary: 'P24–P26 Signed short-lived token (user id + locale)',
  tags,
  auth: 'signed-in · member(p) of a linked microsite when requiresLogin',
  middleware: [requireAuth],
  params: EmbedKeyParam,
  response: AiSession,
  handler: ctl.session,
})
route(aiRouter, {
  method: 'post',
  path: '/ai/voice-hiring/intake',
  summary: 'P27 Voice-hiring pre-screening → voice session token',
  tags,
  auth: 'public · rate 5/min/IP · consent: true required · Audit: no (PII not logged)',
  middleware: [publicFormLimiter],
  body: VoiceIntakeInput,
  response: VoiceIntakeResponse,
  status: 201,
  handler: ctl.voiceIntake,
})

const adminTags = ['Admin · AI embeds']
const admin = requireRole('admin')

route(aiRouter, {
  method: 'get',
  path: '/admin/ai-embeds',
  summary: 'P61 AI embeds',
  tags: adminTags,
  auth: 'role(admin)',
  middleware: admin,
  query: AdminAiQuery,
  response: AdminAiEmbedsPage,
  handler: ctl.list,
})
route(aiRouter, {
  method: 'post',
  path: '/admin/ai-embeds',
  summary: 'P61 Create AI embed',
  tags: adminTags,
  auth: 'role(admin) · https script/iframe from an allow-listed host · Audit: yes',
  middleware: admin,
  body: AiEmbedCreate,
  response: AdminAiEmbed,
  status: 201,
  handler: ctl.create,
})
route(aiRouter, {
  method: 'put',
  path: '/admin/ai-embeds/:key',
  summary: 'P61 Update AI embed',
  tags: adminTags,
  auth: 'role(admin) · https script/iframe from an allow-listed host · Audit: yes',
  middleware: admin,
  params: EmbedKeyParam,
  body: AiEmbedInput,
  response: AdminAiEmbed,
  handler: ctl.update,
})
route(aiRouter, {
  method: 'delete',
  path: '/admin/ai-embeds/:key',
  summary: 'P61 Delete AI embed (soft delete)',
  tags: adminTags,
  auth: 'role(admin) · Audit: yes',
  middleware: admin,
  params: EmbedKeyParam,
  handler: ctl.remove,
})
