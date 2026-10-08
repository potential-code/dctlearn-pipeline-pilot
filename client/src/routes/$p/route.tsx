import { createFileRoute, notFound, Outlet, redirect } from '@tanstack/react-router'
import { isLandingOnly, isMicrosite } from '@/mock/microsites'

/**
 * Microsite scope /{p}/…: unknown slugs are not found; landing-only microsites (Ruwaad, CSMD)
 * have only their landing page, so every other path redirects there (SPEC §2.2).
 */
export const Route = createFileRoute('/$p')({
  beforeLoad: ({ params, location }) => {
    if (!isMicrosite(params.p)) throw notFound()
    if (isLandingOnly(params.p) && location.pathname.replace(/\/$/, '') !== `/${params.p}`) {
      throw redirect({ to: '/$p', params: { p: params.p } })
    }
  },
  component: Outlet,
})
