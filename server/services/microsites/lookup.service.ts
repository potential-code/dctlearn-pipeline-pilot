import { type DbOrTx, db } from '@server/db/connection'
import { type Microsite, microsites } from '@server/db/schema/microsites'
import { urlForStored } from '@server/services/files.service'
import type { MicrositeRef } from '@shared/schemas/common'
import { eq, inArray } from 'drizzle-orm'

export async function findMicrositeBySlug(
  slug: string,
  tx: DbOrTx = db,
): Promise<Microsite | null> {
  const [row] = await tx.select().from(microsites).where(eq(microsites.slug, slug))
  return row ?? null
}

export async function findMicrositeById(id: string, tx: DbOrTx = db): Promise<Microsite | null> {
  const [row] = await tx.select().from(microsites).where(eq(microsites.id, id))
  return row ?? null
}

export async function findMicrositesByIds(ids: string[], tx: DbOrTx = db) {
  if (ids.length === 0) return []
  return tx.select().from(microsites).where(inArray(microsites.id, ids))
}

/** §0.2 MicrositeRef. `id` is the public slug. */
export async function toMicrositeRef(
  m: Microsite,
  viewerId: string | null = null,
): Promise<MicrositeRef> {
  return {
    id: m.slug,
    name: m.name,
    accentColor: m.accentColor,
    logoUrl: await urlForStored(m.logoUrl, viewerId),
    heroUrl: await urlForStored(m.heroUrl, viewerId),
  }
}

export function emailMatchesDomainRule(email: string, rule: string | null | undefined) {
  if (!rule) return true
  const domains = rule
    .split(/[,\s]+/)
    .map((d) => d.trim().toLowerCase().replace(/^@/, ''))
    .filter(Boolean)
  const domain = email.toLowerCase().split('@')[1] ?? ''
  return domains.includes(domain)
}
