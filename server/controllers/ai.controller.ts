import type { RouteContext } from '@server/lib/route'
import { requireAuth, viewerOf } from '@server/middleware/auth.middleware'
import { micrositeOf } from '@server/middleware/microsite.middleware'
import * as embeds from '@server/services/ai/embeds.service'
import { submitVoiceIntake } from '@server/services/ai/voice-intake.service'
import type { AdminAiQuery, AiEmbedInput, VoiceIntakeInput } from '@shared/schemas/ai'
import type { Request, Response } from 'express'
import type { z } from 'zod'

type Ctx<P = unknown, Q = unknown, B = unknown> = RouteContext<P, Q, B>
type Key = { key: string }

/** Runs the `signed-in` middleware on demand (embeds that require login). */
const signIn = (req: Request, res: Response) => () =>
  new Promise<Viewer>((resolve, reject) => {
    requireAuth(req, res, (err?: unknown) => (err ? reject(err) : resolve(viewerOf(res))))
  })

/* learner / public */
export const micrositeAi = ({ viewer, res }: Ctx) => embeds.micrositeAi(micrositeOf(res), viewer)
export const embed = ({ params, optionalViewer, req, res }: Ctx<Key>) =>
  embeds.getEmbed(params.key, optionalViewer, signIn(req, res))
export const session = ({ params, viewer }: Ctx<Key>) =>
  embeds.createEmbedSession(params.key, viewer)
export const voiceIntake = ({ body }: Ctx<unknown, unknown, VoiceIntakeInput>) =>
  submitVoiceIntake(body)

/* P61 admin */
export const list = ({ viewer, query }: Ctx<unknown, z.infer<typeof AdminAiQuery>>) =>
  embeds.listAdminEmbeds(query, viewer)
export const create = ({ viewer, body }: Ctx<unknown, unknown, AiEmbedInput & { key: string }>) =>
  embeds.createEmbed(body, viewer)
export const update = ({ viewer, params, body }: Ctx<Key, unknown, AiEmbedInput>) =>
  embeds.updateEmbed(params.key, body, viewer)
export const remove = async ({ viewer, params }: Ctx<Key>) => {
  await embeds.deleteEmbed(params.key, viewer)
}
