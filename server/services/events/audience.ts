import { type DbOrTx, db } from '@server/db/connection'
import { microsites } from '@server/db/schema/microsites'
import { validationFailed } from '@server/lib/errors'
import { inArray } from 'drizzle-orm'

/**
 * Content audiences are microsites, addressed by their public id (slug) in the API and by uuid
 * in the database. Shared by events, forms and AI embeds.
 */
export async function micrositeIdsForSlugs(slugs: string[], field: string, tx: DbOrTx = db) {
  const wanted = [...new Set(slugs)]
  if (wanted.length === 0) return []
  const rows = await tx
    .select({ id: microsites.id, slug: microsites.slug })
    .from(microsites)
    .where(inArray(microsites.slug, wanted))
  if (rows.length !== wanted.length) throw validationFailed({ [field]: 'Unknown microsite' })
  return rows.map((r) => r.id)
}

/** uuid → slug for the given ids (unknown ids are skipped). */
export async function slugsById(ids: string[], tx: DbOrTx = db) {
  if (ids.length === 0) return new Map<string, string>()
  const rows = await tx
    .select({ id: microsites.id, slug: microsites.slug })
    .from(microsites)
    .where(inArray(microsites.id, [...new Set(ids)]))
  return new Map(rows.map((r) => [r.id, r.slug]))
}
