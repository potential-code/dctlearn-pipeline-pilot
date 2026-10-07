import type { RouteContext } from '@server/lib/route'
import * as svc from '@server/services/events/events.service'
import type { PaginationInput } from '@shared/schemas/common'
import type { AdminEventsQuery, EventInput } from '@shared/schemas/events'
import type { z } from 'zod'

type Ctx<P = unknown, Q = unknown, B = unknown> = RouteContext<P, Q, B>
type Id = { id: string }

export const list = ({ viewer, query }: Ctx<unknown, z.infer<typeof AdminEventsQuery>>) =>
  svc.listAdminEvents(query, viewer)
export const create = ({ viewer, body }: Ctx<unknown, unknown, EventInput>) =>
  svc.createEvent(body, viewer)
export const update = ({ viewer, params, body }: Ctx<Id, unknown, EventInput>) =>
  svc.updateEvent(params.id, body, viewer)
export const remove = async ({ viewer, params }: Ctx<Id>) => {
  await svc.deleteEvent(params.id, viewer)
}
export const cancel = ({ viewer, params, body }: Ctx<Id, unknown, { reason: string }>) =>
  svc.cancelEvent(params.id, body.reason, viewer)
export const recording = ({
  viewer,
  params,
  body,
}: Ctx<Id, unknown, { url: string; publish: boolean }>) => svc.setRecording(params.id, body, viewer)
export const participants = ({ viewer, params, query }: Ctx<Id, PaginationInput>) =>
  svc.listParticipants(params.id, query, viewer)
