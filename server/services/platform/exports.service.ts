import { db } from '@server/db/connection'
import { files } from '@server/db/schema/files'
import { progressExports } from '@server/db/schema/platform'
import { recordAudit } from '@server/lib/audit'
import { now } from '@server/lib/clock'
import { notFound } from '@server/lib/errors'
import { logger } from '@server/lib/logger'
import { paged, pageWindow } from '@server/lib/pagination'
import { storage } from '@server/lib/storage'
import { PROGRESS_HEADERS, progressRows } from '@server/services/analytics/progress.service'
import { gulfDate, gulfHour } from '@server/services/analytics/range'
import { storeGenerated } from '@server/services/files.service'
import { toCsv } from '@server/utils/csv'
import { and, count, desc, eq, inArray, lt } from 'drizzle-orm'

/**
 * Nightly progress export (contract §9.3): 02:00 Gulf time, 3 attempts, kept 30 days, admin
 * download. The schedule checks hourly and enqueues one run per Gulf day once it is past 02:00;
 * the job itself is idempotent per day (unique `kind + for_date`).
 */
export const EXPORT_HOUR_GULF = 2
export const KEEP_DAYS = 30

/** The date the schedule should export for now, or null before 02:00 Gulf time. */
export function dueExportDate(at: Date) {
  return gulfHour(at) >= EXPORT_HOUR_GULF ? gulfDate(at) : null
}

export async function exportExists(forDate: string) {
  const [row] = await db
    .select({ id: progressExports.id })
    .from(progressExports)
    .where(and(eq(progressExports.kind, 'nightly'), eq(progressExports.forDate, forDate)))
  return Boolean(row)
}

export async function buildNightlyExport(forDate: string) {
  if (await exportExists(forDate)) return { created: false }
  const rows = await progressRows({})
  const bytes = new TextEncoder().encode(toCsv(PROGRESS_HEADERS, rows))
  const file = await storeGenerated(bytes, {
    category: 'exports',
    contentType: 'text/csv',
    ext: '.csv',
    ownerId: null,
    name: `progress-${forDate}.csv`,
  })
  const inserted = await db
    .insert(progressExports)
    .values({
      kind: 'nightly',
      forDate,
      fileId: file.id,
      rows: rows.length,
      expiresAt: new Date(now().getTime() + KEEP_DAYS * 86_400_000),
    })
    .onConflictDoNothing()
    .returning({ id: progressExports.id })
  if (inserted.length === 0) {
    // Lost a race with another runner: drop our copy.
    await storage().delete(file.key)
    await db.delete(files).where(eq(files.id, file.id))
    return { created: false }
  }
  return { created: true, rows: rows.length }
}

/** Deletes exports past their 30 days (rows, files and stored bytes). */
export async function purgeExpiredExports() {
  const expired = await db
    .select({ id: progressExports.id, fileId: progressExports.fileId, key: files.key })
    .from(progressExports)
    .innerJoin(files, eq(files.id, progressExports.fileId))
    .where(lt(progressExports.expiresAt, now()))
  if (expired.length === 0) return 0
  await db.delete(progressExports).where(
    inArray(
      progressExports.id,
      expired.map((e) => e.id),
    ),
  )
  await db.delete(files).where(
    inArray(
      files.id,
      expired.map((e) => e.fileId),
    ),
  )
  for (const e of expired)
    await storage()
      .delete(e.key)
      .catch((err) => logger.warn({ err, key: e.key }, 'Could not delete expired export'))
  return expired.length
}

export async function listExports(q: { page: number; pageSize: number }) {
  const [total] = await db.select({ n: count() }).from(progressExports)
  const { limit, offset } = pageWindow(q)
  const rows = await db
    .select({ e: progressExports, size: files.size })
    .from(progressExports)
    .innerJoin(files, eq(files.id, progressExports.fileId))
    .orderBy(desc(progressExports.forDate))
    .limit(limit)
    .offset(offset)
  return paged(
    rows.map(({ e, size }) => ({
      id: e.id,
      kind: 'nightly' as const,
      forDate: e.forDate,
      rows: e.rows,
      size,
      createdAt: e.createdAt.toISOString(),
      expiresAt: e.expiresAt.toISOString(),
      downloadUrl: `/api/admin/exports/${e.id}`,
    })),
    total?.n ?? 0,
    q,
  )
}

/** Admin download of a stored export. Audit: yes (it contains every learner's progress). */
export async function downloadExport(id: string, viewer: Viewer) {
  const [row] = await db
    .select({ e: progressExports, f: files })
    .from(progressExports)
    .innerJoin(files, eq(files.id, progressExports.fileId))
    .where(eq(progressExports.id, id))
  if (!row) throw notFound()
  const bytes = await storage().get(row.f.key)
  if (!bytes) throw notFound()
  await recordAudit(db, {
    actorId: viewer.id,
    action: 'export.download',
    target: { type: 'export', id, label: row.f.originalName },
    ip: viewer.ip,
  })
  return { bytes, name: row.f.originalName, contentType: row.f.contentType }
}
