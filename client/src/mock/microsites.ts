/** The nine microsites from docs/SEED.md. */
export const MICROSITES = [
  { slug: 'employees', accent: '#EE3E43', signIn: 'invite_only', landingOnly: false },
  { slug: 'elevate', accent: '#CD3151', signIn: 'invite_only', landingOnly: false },
  { slug: 'znm', accent: '#3B2F92', signIn: 'invite_only', landingOnly: false },
  { slug: 'zu', accent: '#F7C337', signIn: 'invite_only', landingOnly: false },
  { slug: 'museopro', accent: '#E35E3C', signIn: 'invite_only', landingOnly: false },
  { slug: 'nibras', accent: '#2FC4DB', signIn: 'invite_only', landingOnly: false },
  { slug: 'chkforum', accent: '#6D7782', signIn: 'open', landingOnly: false },
  { slug: 'ruwaad', accent: '#F77860', signIn: 'landing_only', landingOnly: true },
  { slug: 'csmd', accent: '#E3DCD3', signIn: 'landing_only', landingOnly: true },
] as const

export function isMicrosite(slug: string): boolean {
  return MICROSITES.some((m) => m.slug === slug)
}

export function isLandingOnly(slug: string): boolean {
  return MICROSITES.some((m) => m.slug === slug && m.landingOnly)
}
