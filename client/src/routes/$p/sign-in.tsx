import { createFileRoute, redirect } from '@tanstack/react-router'

/** Prototype path; the SPEC path is /{p}/login. */
export const Route = createFileRoute('/$p/sign-in')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/$p/login', params: { p: params.p } })
  },
})
