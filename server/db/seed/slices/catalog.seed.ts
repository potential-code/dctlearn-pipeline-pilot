import type { DbOrTx } from '@server/db/connection'
import { courses } from '@server/db/schema/catalog'
import { COURSES, courseSlug } from '../data'

export type SeededCourses = Record<string, { id: string; slug: string }>

/** SEED §2 course records with card fields (content structure is the learning area's slice). */
export async function seedCourses(
  tx: DbOrTx,
  images: Record<string, string> = {},
): Promise<SeededCourses> {
  const out: SeededCourses = {}
  for (const c of COURSES) {
    const [row] = await tx
      .insert(courses)
      .values({
        slug: courseSlug(c.key),
        title: c.title,
        description: { en: `${c.title.en} — course overview.`, ar: `${c.title.ar} — نظرة عامة.` },
        imageUrl: images[c.key] ?? '',
        categories: c.categories,
        level: c.level,
        durationMin: c.minutes,
        status: 'published',
        certificateEnabled: c.cert === 'yes',
        externalCertificate: c.cert === 'external',
        comingSoon: c.comingSoon ?? false,
        isCertProgramme: c.isCertProgramme ?? false,
        legacyId: c.key,
        publishedAt: new Date('2026-01-15T00:00:00Z'),
      })
      .returning()
    out[c.key] = { id: row!.id, slug: row!.slug }
  }
  return out
}
