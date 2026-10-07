import { db } from '@server/db/connection'
import { courses } from '@server/db/schema/catalog'
import { microsites } from '@server/db/schema/microsites'
import { faqItems, pageSections, siteSettings } from '@server/db/schema/public'
import { toCourseCard } from '@server/services/catalog/course-card.service'
import { urlForStored } from '@server/services/files.service'
import { toMicrositeRef } from '@server/services/microsites/lookup.service'
import type { I18n } from '@shared/schemas/common'
import { and, asc, eq, inArray, isNull } from 'drizzle-orm'

/** P01–P04 public content. */

type HomeSettings = {
  hero: { title: I18n; subtitle: I18n; imageUrl: string }
  affiliates: { name: string; url: string; imageUrl: string; newTab: boolean }[]
  featuredCourseIds: string[]
}

const DEFAULT_HOME: HomeSettings = {
  hero: { title: { en: 'DCT Learn', ar: 'DCT Learn' }, subtitle: { en: '', ar: '' }, imageUrl: '' },
  affiliates: [],
  featuredCourseIds: [],
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, key))
  return (row?.value as T) ?? fallback
}

export async function getHome() {
  const home = await getSetting<HomeSettings>('home', DEFAULT_HOME)
  const live = await db
    .select()
    .from(microsites)
    .where(eq(microsites.status, 'live'))
    .orderBy(asc(microsites.landingOnly), asc(microsites.sortOrder))
  const featuredIds = home.featuredCourseIds.slice(0, 6)
  const featuredRows = featuredIds.length
    ? await db
        .select()
        .from(courses)
        .where(and(inArray(courses.id, featuredIds), eq(courses.status, 'published')))
    : []
  const featured = await Promise.all(
    featuredIds
      .map((id) => featuredRows.find((c) => c.id === id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .map(async (course) => {
        const { state: _state, ...card } = await toCourseCard(
          { course, isMandatory: false, track: null, enrolment: null },
          null,
        )
        return card
      }),
  )
  return {
    hero: { ...home.hero, imageUrl: await urlForStored(home.hero.imageUrl, null) },
    microsites: await Promise.all(
      live.map(async (m) => ({
        ...(await toMicrositeRef(m)),
        landingUrl: `/${m.slug}`,
        signInMode: m.signInMode as 'open' | 'invite_only' | 'landing_only',
      })),
    ),
    affiliates: await Promise.all(
      home.affiliates.map(async (a) => ({ ...a, imageUrl: await urlForStored(a.imageUrl, null) })),
    ),
    featured,
  }
}

export async function getPage(page: 'professionals' | 'students') {
  const rows = await db
    .select()
    .from(pageSections)
    .where(eq(pageSections.page, page))
    .orderBy(asc(pageSections.sortOrder))
  return {
    sections: await Promise.all(
      rows.map(async (s) => {
        const imageUrl = await urlForStored(s.imageUrl, null)
        return {
          key: s.key,
          title: s.title,
          body: s.body,
          ...(imageUrl ? { imageUrl } : {}),
          ...(s.cta ? { cta: s.cta } : {}),
        }
      }),
    ),
  }
}

export async function getFaq() {
  const rows = await db
    .select()
    .from(faqItems)
    .where(isNull(faqItems.deletedAt))
    .orderBy(asc(faqItems.sortOrder))
  return {
    items: rows.map((f) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
      order: f.sortOrder,
    })),
  }
}
