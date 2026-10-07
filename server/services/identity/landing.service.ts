import type { Microsite } from '@server/db/schema/microsites'

/**
 * P06 landing rule (contract): one set of accounts; a microsite login is the same login.
 * 1. mentor / judge / admin → /mentor · /judge · /admin; sub admin → /{their p}/admin.
 * 2. from={p} and member of p → /{p}/dashboard.
 * 3. from={p} and not a member → /{p}/login?denied=1 (session stays valid).
 * 4. no from: one membership → /{p}/dashboard; several or none → /platforms.
 */
export function defaultRoute(input: {
  role: string
  memberSlugs: string[]
  subAdminSlugs: string[]
  from?: Pick<Microsite, 'slug'> | null
}): { route: string; denied: boolean } {
  const { role, memberSlugs, subAdminSlugs, from } = input
  if (role === 'mentor') return { route: '/mentor', denied: false }
  if (role === 'judge') return { route: '/judge', denied: false }
  if (role === 'admin') return { route: '/admin', denied: false }
  if (role === 'sub_admin') {
    if (from && subAdminSlugs.includes(from.slug))
      return { route: `/${from.slug}/admin`, denied: false }
    const first = subAdminSlugs[0]
    return { route: first ? `/${first}/admin` : '/platforms', denied: false }
  }
  if (from) {
    if (memberSlugs.includes(from.slug)) return { route: `/${from.slug}/dashboard`, denied: false }
    return { route: `/${from.slug}/login?denied=1`, denied: true }
  }
  if (memberSlugs.length === 1) return { route: `/${memberSlugs[0]}/dashboard`, denied: false }
  return { route: '/platforms', denied: false }
}
