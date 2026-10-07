import type { DbOrTx } from '@server/db/connection'
import { micrositeCourses } from '@server/db/schema/catalog'
import {
  type LandingDoc,
  landingTemplates,
  micrositeLandings,
  microsites,
} from '@server/db/schema/microsites'
import { joinMicrosite } from '@server/services/microsites/membership.service'
import { MICROSITES, PEOPLE } from '../data'
import type { SeededCourses } from './catalog.seed'
import type { SeededUsers } from './identity.seed'

const TAB_LABELS: Record<string, { en: string; ar: string }> = {
  courses: { en: 'Courses', ar: 'الدورات' },
  workshops: { en: 'Workshops', ar: 'ورش العمل' },
  mentors: { en: 'Mentors', ar: 'المرشدون' },
  ai_coaches: { en: 'AI Coaches', ar: 'مدربو الذكاء الاصطناعي' },
  ai_tools: { en: 'AI Tools', ar: 'أدوات الذكاء الاصطناعي' },
  resources: { en: 'Resources', ar: 'الموارد' },
}

export type SeededMicrosites = Record<string, { id: string; slug: string }>

export const LANDING_TEMPLATES = [
  { id: 'standard', name: 'Standard', previewUrl: '', sections: ['hero', 'cta', 'section'] },
  { id: 'partners', name: 'Partners', previewUrl: '', sections: ['hero', 'cta', 'partners'] },
  {
    id: 'interest',
    name: 'Register interest',
    previewUrl: '',
    sections: ['hero', 'register_interest'],
  },
]

export function seedLanding(
  slug: string,
  heading: LandingDoc['hero']['heading'],
  subheading: LandingDoc['hero']['subheading'],
  heroUrl: string,
): LandingDoc {
  const partners = slug === 'museopro' || slug === 'elevate'
  return {
    hero: { heading, subheading, imageUrl: heroUrl },
    cta: {
      signedOut: { label: { en: 'Sign in', ar: 'تسجيل الدخول' }, url: `/${slug}/login` },
      signedIn: { label: { en: 'Go to dashboard', ar: 'لوحة التحكم' }, url: `/${slug}/dashboard` },
    },
    ...(slug === 'elevate'
      ? {
          popup: {
            kind: 'image_text' as const,
            text: { en: 'Mentee registration is open', ar: 'التسجيل للمتدربين مفتوح' },
            cta: { label: { en: 'Register', ar: 'سجّل' }, url: '/elevate/login' },
          },
        }
      : {}),
    section: partners
      ? {
          kind: 'partners',
          partnersTitle: { en: 'Our partners', ar: 'شركاؤنا' },
          partners: [
            { name: 'DCT Abu Dhabi', imageUrl: '', url: 'https://dct.gov.ae' },
            { name: 'France Muséums', imageUrl: '', url: 'https://www.francemuseums.fr' },
            {
              name: 'Réunion des Musées Nationaux',
              imageUrl: '',
              url: 'https://www.grandpalais.fr',
            },
            { name: 'Institut national du patrimoine', imageUrl: '', url: 'https://www.inp.fr' },
          ],
        }
      : slug === 'znm'
        ? {
            kind: 'social',
            social: {
              title: { en: 'Follow us', ar: 'تابعونا' },
              logoUrl: '',
              logoBg: '#3B2F92',
              instagram: 'https://instagram.com/zayednationalmuseum',
              x: 'https://x.com/zayednationalmuseum',
            },
          }
        : { kind: 'none' },
  }
}

/** SEED §1 microsites, landings (published), course lists, sub admins and memberships. */
export async function seedMicrosites(
  tx: DbOrTx,
  users: SeededUsers,
  seededCourses: SeededCourses,
  assets: Record<string, string> = {},
): Promise<SeededMicrosites> {
  await tx.insert(landingTemplates).values(LANDING_TEMPLATES).onConflictDoNothing()
  const byEmail = Object.fromEntries(Object.values(users).map((u) => [u.email, u.id]))
  const out: SeededMicrosites = {}
  let order = 0
  for (const m of MICROSITES) {
    const heroUrl = assets[m.hero] ?? ''
    const [row] = await tx
      .insert(microsites)
      .values({
        slug: m.slug,
        name: m.name,
        subtitle: m.subtitle,
        templateId: m.landingOnly ? 'interest' : 'standard',
        logoUrl: assets['logos/dct-learn.png'] ?? '',
        accentColor: m.accent,
        heroUrl,
        subAdminId: m.subAdmin ? byEmail[m.subAdmin] : null,
        signInMode: m.signInMode,
        emailDomainRule: m.emailDomainRule ?? null,
        status: 'live',
        landingOnly: m.landingOnly,
        tabs: m.tabs.map((x) => ({
          key: x.key,
          enabled: true,
          label: x.label ?? TAB_LABELS[x.key]!,
        })),
        defaultFilter: m.defaultFilter ?? null,
        mentoringEnabled: m.mentoring,
        competitionEnabled: m.competition,
        sortOrder: order++,
      })
      .returning()
    const id = row!.id
    out[m.slug] = { id, slug: m.slug }
    const doc = seedLanding(m.slug, m.landing.heading, m.landing.subheading, heroUrl)
    await tx.insert(micrositeLandings).values({
      micrositeId: id,
      draft: doc,
      published: doc,
      publishedAt: new Date('2026-09-01T08:00:00Z'),
    })
    let sort = 0
    for (const key of m.courses) {
      const course = seededCourses[key]
      if (!course) continue
      await tx.insert(micrositeCourses).values({
        micrositeId: id,
        courseId: course.id,
        isMandatory: m.mandatory.includes(key),
        track:
          m.slug === 'nibras'
            ? (
                { C18: 'Aware', C19: 'Aware', C20: 'Practitioner', C21: 'Builder' } as Record<
                  string,
                  string
                >
              )[key]
            : null,
        sortOrder: sort++,
      })
    }
  }
  for (const p of PEOPLE) {
    for (const slug of p.microsites ?? []) {
      const user = users[p.key]
      const m = out[slug]
      if (user && m) await joinMicrosite(tx, user.id, m.id, 'seed')
    }
  }
  return out
}
