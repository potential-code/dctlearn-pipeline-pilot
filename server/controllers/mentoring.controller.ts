import type { RouteContext } from '@server/lib/route'
import { micrositeOf } from '@server/middleware/microsite.middleware'
import * as bookings from '@server/services/mentoring/bookings.service'
import * as learner from '@server/services/mentoring/learner.service'

/** Learner mentoring (P17–P22), shared booking actions and the Zoom webhook. Thin: no SQL. */

type Ctx<P = unknown, Q = unknown, B = unknown> = RouteContext<P, Q, B>
// biome-ignore lint/suspicious/noExplicitAny: bodies and queries are validated by the route's schema
type Any = any
type BookingId = { id: string }
type MentorId = { mentorId: string }

export const mentors = ({ viewer, res, query }: Ctx<unknown, Any>) =>
  learner.mentorsTab(viewer, micrositeOf(res), query)
export const mentorDetail = ({ viewer, params }: Ctx<MentorId>) =>
  learner.mentorDetail(viewer, params.mentorId)
export const slots = ({ viewer, params, query }: Ctx<MentorId, Any>) =>
  learner.mentorSlots(viewer, params.mentorId, query)

export const registration = ({ viewer, res }: Ctx) =>
  learner.getRegistration(viewer, micrositeOf(res))
export const register = ({ viewer, res, body }: Ctx<unknown, unknown, Any>) =>
  learner.submitRegistration(viewer, micrositeOf(res), body.answers)
export const match = ({ viewer, res }: Ctx) => learner.suggestMatches(viewer, micrositeOf(res))
export const choose = ({ viewer, res, body }: Ctx<unknown, unknown, { mentorId: string }>) =>
  learner.chooseMentor(viewer, micrositeOf(res), body.mentorId)

export const book = ({ viewer, body }: Ctx<unknown, unknown, Any>) =>
  bookings.createBooking(viewer, body)
export const myBookings = ({ viewer, query }: Ctx<unknown, Any>) =>
  learner.myBookings(viewer, query)
export const myGrowLogs = ({ viewer, query }: Ctx<unknown, Any>) =>
  learner.myGrowLogs(viewer, query)
export const cancel = ({ viewer, params, body }: Ctx<BookingId, unknown, { reason?: string }>) =>
  bookings.cancelBooking(viewer, params.id, body.reason)
export const session = ({ viewer, params }: Ctx<BookingId>) =>
  bookings.sessionState(viewer, params.id)
export const sessionToken = ({ viewer, params }: Ctx<BookingId>) =>
  bookings.sessionToken(viewer, params.id)
export const feedback = ({ viewer, params, body }: Ctx<BookingId, unknown, Any>) =>
  bookings.menteeFeedback(viewer, params.id, body)

/** Zoom signs the raw body; Express already parsed JSON, so use the raw bytes when kept. */
export const zoomWebhook = ({ req }: Ctx) => {
  const raw = (req as { rawBody?: Buffer | string }).rawBody
  const rawBody = raw ? raw.toString() : JSON.stringify(req.body ?? {})
  return bookings.handleZoomWebhook(
    rawBody,
    req.body ?? {},
    req.header('x-zm-signature') ?? undefined,
    req.header('x-zm-request-timestamp') ?? undefined,
  )
}
