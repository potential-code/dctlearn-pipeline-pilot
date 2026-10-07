import { ensureCertificatePdf } from '@server/services/learning/certificate.service'
import { recalcCourse } from '@server/services/learning/progress.service'
import { unpackPackage } from '@server/services/learning/scorm.service'
import { z } from 'zod'
import { defineJob } from './runtime'

/** Learning jobs (contract §9.3 / §9.5). Import from jobs/index.ts at merge time. */

/** Certificate PDF on course completion — idempotent per certificate (enrolment). */
defineJob(
  'learning.certificate_pdf',
  async ({ certificateId }) => {
    await ensureCertificatePdf(certificateId)
  },
  { maxAttempts: 3, schema: z.object({ certificateId: z.uuid() }) },
)

/** SCORM unpack on upload — one attempt; failures are recorded on the package. */
defineJob(
  'learning.scorm_unpack',
  async ({ packageId }) => {
    await unpackPackage(packageId)
  },
  { maxAttempts: 1, schema: z.object({ packageId: z.uuid() }) },
)

/** §9.5 progress recalculation after structural edits of a published course. */
defineJob(
  'learning.recalc_course',
  async ({ courseId }) => {
    await recalcCourse(courseId)
  },
  { maxAttempts: 3, schema: z.object({ courseId: z.uuid() }) },
)
