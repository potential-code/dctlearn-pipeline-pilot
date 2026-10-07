import { db } from '@server/db/connection'
import { files } from '@server/db/schema/files'
import { dataRequests, sessions, verifications } from '@server/db/schema/identity'
import { csvImports } from '@server/db/schema/imports'
import { now } from '@server/lib/clock'
import { logger } from '@server/lib/logger'
import { storage } from '@server/lib/storage'
import { and, eq, inArray, lt, ne } from 'drizzle-orm'
import { EXPORT_CATEGORY, EXPORT_TTL_MS } from './data-rights.service'
import { purgeExpiredExports } from './exports.service'

/**
 * Daily cleanup (contract §9.3: expired tokens, orphan uploads > 24 h, signed-URL cache).
 *
 * Deliberately conservative about files: the `files` table has no reference counts and many
 * areas point at it (course images, certificates, resources, …), so the only files removed are
 * ones that are orphaned by construction:
 * - category `tmp` older than 24 h (scratch uploads that were never attached);
 * - personal data exports (`data-export`) older than their 24 h link lifetime;
 * - nightly progress exports past their 30 days.
 * Signed URLs are stateless HMACs (nothing cached server-side), so there is nothing to purge.
 */
export const ORPHAN_AGE_MS = 24 * 3_600_000
export const TMP_CATEGORY = 'tmp'

async function deleteFiles(rows: { id: string; key: string }[]) {
  if (rows.length === 0) return 0
  await db.delete(files).where(
    inArray(
      files.id,
      rows.map((r) => r.id),
    ),
  )
  for (const r of rows)
    await storage()
      .delete(r.key)
      .catch((err) => logger.warn({ err, key: r.key }, 'Could not delete stored file'))
  return rows.length
}

export async function runCleanup() {
  const at = now()
  const verificationsRemoved = (
    await db
      .delete(verifications)
      .where(lt(verifications.expiresAt, at))
      .returning({ id: verifications.id })
  ).length
  const sessionsRemoved = (
    await db.delete(sessions).where(lt(sessions.expiresAt, at)).returning({ id: sessions.id })
  ).length
  // Import previews hold the uploaded rows (names, e-mails): drop them once expired.
  const importsRemoved = (
    await db
      .delete(csvImports)
      .where(and(lt(csvImports.expiresAt, at), ne(csvImports.status, 'confirmed')))
      .returning({ id: csvImports.id })
  ).length

  const cutoff = new Date(at.getTime() - ORPHAN_AGE_MS)
  const tmp = await db
    .select({ id: files.id, key: files.key })
    .from(files)
    .where(and(eq(files.category, TMP_CATEGORY), lt(files.createdAt, cutoff)))
  const tmpRemoved = await deleteFiles(tmp)

  const exportCutoff = new Date(at.getTime() - EXPORT_TTL_MS)
  const staleExports = await db
    .select({ id: files.id, key: files.key })
    .from(files)
    .where(and(eq(files.category, EXPORT_CATEGORY), lt(files.createdAt, exportCutoff)))
  if (staleExports.length)
    await db
      .update(dataRequests)
      .set({ fileKey: null })
      .where(
        inArray(
          dataRequests.fileKey,
          staleExports.map((f) => f.id),
        ),
      )
  const dataExportsRemoved = await deleteFiles(staleExports)

  const progressExportsRemoved = await purgeExpiredExports()
  return {
    verificationsRemoved,
    sessionsRemoved,
    importsRemoved,
    tmpRemoved,
    dataExportsRemoved,
    progressExportsRemoved,
  }
}
