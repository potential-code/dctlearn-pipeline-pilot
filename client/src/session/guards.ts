import type { Role } from '@shared/roles'
import { redirect } from '@tanstack/react-router'
import { readSession } from './SessionProvider'

/**
 * beforeLoad guard for signed-in areas. No session → /login?next=…; an account whose role is not
 * allowed → its own home. Admins may open every area (the prototype's "view as" links).
 */
export function requireRole(roles: Role[] | 'any') {
  return ({ location }: { location: { href: string } }) => {
    const account = readSession()
    if (!account) throw redirect({ to: '/login', search: { next: location.href } })
    if (roles === 'any' || account.role === 'admin' || roles.includes(account.role)) return
    throw redirect({ href: account.home })
  }
}
