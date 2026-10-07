import { courses } from '@server/db/schema/catalog'
import { courseBlocks, courseModules, courseUnits } from '@server/db/schema/learning'
import { externalCertificatesOf } from '@server/services/achievements/external-certs.service'
import { actionPlanReaderImpl } from '@server/services/learning/action-plan.service'
import { coursesTab } from '@server/services/learning/hub-courses.service'
import { completeCourseInTx } from '@server/services/learning/progress.service'
import { setActionPlanReader } from '@server/services/seams/action-plan.seam'
import { setCompleteCourse } from '@server/services/seams/course-completion.seam'
import { registerHubTab } from '@server/services/seams/hub.registry'
import { registerTranslatable } from '@server/services/seams/translatable.registry'
import { registerUserDetailSection } from '@server/services/seams/user-detail.registry'
import { CoursesTabQuery, CoursesTabResponse } from '@shared/schemas/learning'

/**
 * Learning + achievements registrations (import once from registrations/index.ts):
 * - P52 `courses` hub tab
 * - ActionPlanReader for the competition area (save hook fired via `runActionPlanSaved`)
 * - Course completion seam (idempotent: enrolment, certificate once, course points once)
 * - P60 translatables: course (title, description, overview), module + unit titles, and block
 *   payloads (entity `block`, field `payload`; the `{ en, ar }` JSON paths per block type are
 *   `BLOCK_I18N_PATHS` in services/learning/block-payloads.ts, rich paths `html`/`transcript`)
 * - P47 user detail section `externalCertificates`
 */

registerHubTab('courses', {
  query: CoursesTabQuery,
  response: CoursesTabResponse,
  handler: ({ viewer, microsite, query }) =>
    coursesTab(viewer, microsite, CoursesTabQuery.parse(query ?? {})),
})

setActionPlanReader(actionPlanReaderImpl)

setCompleteCourse(async (tx, input) => {
  await completeCourseInTx(tx, input)
})

registerTranslatable({
  entity: 'course',
  table: courses,
  id: courses.id,
  fields: { title: courses.title, description: courses.description, overview: courses.overview },
  richFields: ['description', 'overview'],
})
registerTranslatable({
  entity: 'module',
  table: courseModules,
  id: courseModules.id,
  fields: { title: courseModules.title },
})
registerTranslatable({
  entity: 'unit',
  table: courseUnits,
  id: courseUnits.id,
  fields: { title: courseUnits.title },
})
registerTranslatable({
  entity: 'block',
  table: courseBlocks,
  id: courseBlocks.id,
  fields: { payload: courseBlocks.payload },
  richFields: ['payload'],
})

registerUserDetailSection((userId) => externalCertificatesOf(userId))
