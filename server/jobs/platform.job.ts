import { now } from '@server/lib/clock'
import { refreshReportCache } from '@server/services/analytics/report-cache.service'
import { runMachineTranslationBatch } from '@server/services/i18n/translations.service'
import { runCleanup } from '@server/services/platform/cleanup.service'
import { buildDataExport, DATA_EXPORT_JOB } from '@server/services/platform/data-rights.service'
import {
  buildNightlyExport,
  dueExportDate,
  exportExists,
  purgeExpiredExports,
} from '@server/services/platform/exports.service'
import { z } from 'zod'
import { defineJob, defineSchedule, enqueue } from './runtime'

/** Platform jobs and schedules (contract §9.3, §9.7). */

export const PROGRESS_EXPORT_JOB = 'platform.progress_export'

defineJob(
  DATA_EXPORT_JOB,
  async ({ requestId }) => {
    await buildDataExport(requestId)
  },
  { maxAttempts: 3, schema: z.object({ requestId: z.uuid() }) },
)

defineJob(
  PROGRESS_EXPORT_JOB,
  async ({ forDate }) => {
    await buildNightlyExport(forDate)
    await purgeExpiredExports()
  },
  { maxAttempts: 3, schema: z.object({ forDate: z.iso.date() }) },
)

/** Daily: expired tokens and sessions, expired import previews, orphaned files. */
defineSchedule('platform.cleanup', 24 * 3600, runCleanup)

/**
 * Nightly progress export at 02:00 Gulf time. The runner only knows intervals, so this checks
 * hourly and enqueues one run per Gulf day once it is past 02:00 (dedupe key per day).
 */
defineSchedule('platform.nightly_progress_export', 3600, async () => {
  const forDate = dueExportDate(now())
  if (!forDate || (await exportExists(forDate))) return { enqueued: false }
  await enqueue(PROGRESS_EXPORT_JOB, { forDate }, { dedupeKey: `progress-export:${forDate}` })
  return { enqueued: true, forDate }
})

/** Every 15 minutes: P45/P55 aggregates for every range, platform-wide and per microsite. */
defineSchedule('platform.report_cache', 15 * 60, refreshReportCache)

/** Every minute, batch 20, only when a translation provider is configured. */
defineSchedule('platform.machine_translation', 60, () => runMachineTranslationBatch())
