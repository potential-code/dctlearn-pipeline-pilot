import type { RouteContext } from '@server/lib/route'
import * as admin from '@server/services/mentoring/admin.service'

/** P48 mentor pool (role admin). Thin: no SQL. */

type Ctx<P = unknown, Q = unknown, B = unknown> = RouteContext<P, Q, B>
// biome-ignore lint/suspicious/noExplicitAny: bodies and queries are validated by the route's schema
type Any = any
type Id = { id: string }

export const list = ({ viewer, query }: Ctx<unknown, Any>) => admin.listMentors(viewer, query)
export const invite = ({ viewer, body }: Ctx<unknown, unknown, Any>) =>
  admin.inviteMentors(viewer, body)
export const update = ({ viewer, params, body }: Ctx<Id, unknown, Any>) =>
  admin.updateMentor(viewer, params.id, body)
export const mentees = ({ params }: Ctx<Id>) => admin.mentorMentees(params.id)
