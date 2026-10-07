import type { RouteContext } from '@server/lib/route'
import * as bookings from '@server/services/mentoring/bookings.service'
import * as mentor from '@server/services/mentoring/mentor.service'

/** Mentor area (P30, P31): own data only. Thin: no SQL. */

type Ctx<P = unknown, Q = unknown, B = unknown> = RouteContext<P, Q, B>
// biome-ignore lint/suspicious/noExplicitAny: bodies and queries are validated by the route's schema
type Any = any
type Id = { id: string }

export const dashboard = ({ viewer }: Ctx) => mentor.mentorDashboard(viewer)
export const growLogs = ({ viewer, query }: Ctx<unknown, Any>) => mentor.listGrowLogs(viewer, query)
export const createGrowLog = ({ viewer, body }: Ctx<unknown, unknown, Any>) =>
  mentor.createGrowLog(viewer, body)
export const profile = ({ viewer }: Ctx) => mentor.getMentorProfile(viewer)
export const saveProfile = ({ viewer, body }: Ctx<unknown, unknown, Any>) =>
  mentor.updateMentorProfile(viewer, body)
export const accept = ({ viewer, params }: Ctx<Id>) => mentor.acceptApplication(viewer, params.id)
export const decline = ({ viewer, params, body }: Ctx<Id, unknown, { reason?: string }>) =>
  mentor.declineApplication(viewer, params.id, body.reason)
export const availability = ({ viewer }: Ctx) => mentor.getAvailability(viewer)
export const saveAvailability = ({ viewer, body }: Ctx<unknown, unknown, Any>) =>
  mentor.saveAvailability(viewer, body)
export const bookingsList = ({ viewer, query }: Ctx<unknown, Any>) =>
  mentor.mentorBookingsList(viewer, query)
export const confirm = ({ viewer, params }: Ctx<Id>) => bookings.confirmBooking(viewer, params.id)
export const noShow = ({ viewer, params }: Ctx<Id>) => bookings.markNoShow(viewer, params.id)
export const feedback = ({ viewer, params, body }: Ctx<Id, unknown, Any>) =>
  bookings.mentorFeedback(viewer, params.id, body)
