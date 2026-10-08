export type ShellNavItem = {
  link: boolean
  group: boolean
  key: string
  label: string
  d: string
  href: string
  cnt: string | false
  cls: string
  cur: string
}
export type ShellVals = {
  nav: ShellNavItem[]
  crumbs: { label: string; href: string; last: boolean }[]
  hasSite: boolean
  siteLabel: string
  siteName: string
  siteColor: string
  userName: string
  initials: string
  userSub: string
  roleLabel: string
  navLabel: string
  langLabel: string
  langAria: string
  notifAria: string
  meProfile: string
  meOut: string
  meAria: string
  menuAria: string
  notifHref: string
  profileHref: string
}
export function shellHelper(
  ar: boolean,
  role: string,
  active: string,
  site: string,
  crumbs: { label: string; href?: string }[],
): ShellVals
