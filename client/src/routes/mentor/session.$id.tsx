import { createFileRoute, redirect } from '@tanstack/react-router'

/** Prototype path for the mentor's view of a session; the SPEC path is /mentoring/session/{id}. */
export const Route = createFileRoute('/mentor/session/$id')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/mentoring/session/$bookingId', params: { bookingId: params.id } })
  },
})
