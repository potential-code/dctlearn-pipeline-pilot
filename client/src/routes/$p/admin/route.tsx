// client: hand-edited (sub admins are limited to their own microsite's admin)
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { requireRole } from '@/session/guards'
import { readSession } from '@/session/SessionProvider'

const guard = requireRole(['sub_admin'])

export const Route = createFileRoute('/$p/admin')({
  beforeLoad: (ctx) => {
    guard(ctx)
    // Platform admins may open every microsite's admin; a sub admin only the one they manage.
    const account = readSession()
    const own = account?.role === 'sub_admin' ? account.site : undefined
    if (own && ctx.params.p !== own) {
      const rest = ctx.location.pathname.replace(/^\/[^/]+\/admin/, '')
      throw redirect({ href: `/${own}/admin${rest}`, replace: true })
    }
  },
  component: Outlet,
})
