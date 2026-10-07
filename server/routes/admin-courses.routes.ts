import { MB } from '@server/config/upload-policies'
import * as ctl from '@server/controllers/admin-courses.controller'
import { route } from '@server/lib/route'
import { requireRole } from '@server/middleware/auth.middleware'
import { userWriteLimiter } from '@server/middleware/rate-limit.middleware'
import { uploadSingle } from '@server/middleware/upload.middleware'
import { Created, idParam, uuid } from '@shared/schemas/common'
import {
  AdminCourseDetail,
  AdminCoursesPage,
  AdminCoursesQuery,
  AssessmentInput,
  AssessmentUpdate,
  BlockCreate,
  BlockUpdate,
  CardInput,
  CertificateSettingsInput,
  CourseCreate,
  CourseStatusResponse,
  CourseUpdate,
  ModuleInput,
  PointsConfigInput,
  QuestionInput,
  QuestionParams,
  ReorderInput,
  UnitInput,
  UnitUpdate,
  UploadResponse,
} from '@shared/schemas/learning'
import { Router } from 'express'
import { z } from 'zod'

/**
 * P46 Catalog · P59 Course editor · P58 course points (role admin).
 * Reorder routes are mounted before `/:mid`, `/:uid`… so "reorder" is never read as an id.
 */
export const adminCoursesRouter = Router()

const tags = ['Admin · Courses']
const admin = requireRole('admin')
const auth = 'role(admin) · Sanitise: rich-text block payloads'
const mParams = z.object({ id: uuid, mid: uuid })
const uParams = z.object({ id: uuid, uid: uuid })
const bParams = z.object({ id: uuid, bid: uuid })
const aParams = z.object({ id: uuid, aid: uuid })

route(adminCoursesRouter, {
  method: 'get',
  path: '/admin/courses',
  summary: 'P46 Courses',
  tags,
  auth: 'role(admin)',
  middleware: admin,
  query: AdminCoursesQuery,
  response: AdminCoursesPage,
  handler: ctl.list,
})
route(adminCoursesRouter, {
  method: 'post',
  path: '/admin/courses',
  summary: 'P46 Create course (draft)',
  tags,
  auth,
  middleware: admin,
  body: CourseCreate,
  response: Created,
  status: 201,
  handler: ctl.create,
})
route(adminCoursesRouter, {
  method: 'get',
  path: '/admin/courses/:id',
  summary: 'P59 Course tree (modules, units, blocks, assessments, card, certificate)',
  tags,
  auth: 'role(admin)',
  middleware: admin,
  params: idParam,
  response: AdminCourseDetail,
  handler: ctl.detail,
})
route(adminCoursesRouter, {
  method: 'put',
  path: '/admin/courses/:id',
  summary: 'P59 Update course (ifMatch = updatedAt)',
  tags,
  auth: `${auth} · ifMatch · Audit: yes`,
  middleware: admin,
  params: idParam,
  body: CourseUpdate,
  response: AdminCourseDetail,
  handler: ctl.update,
})
route(adminCoursesRouter, {
  method: 'post',
  path: '/admin/courses/:id/publish',
  summary: 'P59 Publish (§9.1: needs ≥ 1 unit with content)',
  tags,
  auth: 'role(admin) · Audit: yes',
  middleware: admin,
  params: idParam,
  response: CourseStatusResponse,
  handler: ctl.publish,
})
route(adminCoursesRouter, {
  method: 'post',
  path: '/admin/courses/:id/archive',
  summary: 'P59 Archive (learners keep progress and certificates)',
  tags,
  auth: 'role(admin) · Audit: yes',
  middleware: admin,
  params: idParam,
  response: CourseStatusResponse,
  handler: ctl.archive,
})

/* modules */
route(adminCoursesRouter, {
  method: 'post',
  path: '/admin/courses/:id/modules',
  summary: 'P59 Add module',
  tags,
  auth,
  middleware: admin,
  params: idParam,
  body: ModuleInput,
  response: Created,
  status: 201,
  handler: ctl.createModule,
})
route(adminCoursesRouter, {
  method: 'put',
  path: '/admin/courses/:id/modules/reorder',
  summary: 'P59 Reorder modules',
  tags,
  auth,
  middleware: admin,
  params: idParam,
  body: ReorderInput,
  response: AdminCourseDetail,
  handler: ctl.reorderModules,
})
route(adminCoursesRouter, {
  method: 'put',
  path: '/admin/courses/:id/modules/:mid',
  summary: 'P59 Rename module',
  tags,
  auth,
  middleware: admin,
  params: mParams,
  body: ModuleInput,
  response: AdminCourseDetail,
  handler: ctl.updateModule,
})
route(adminCoursesRouter, {
  method: 'delete',
  path: '/admin/courses/:id/modules/:mid',
  summary: 'P59 Remove module (progress kept, ignored)',
  tags,
  auth,
  middleware: admin,
  params: mParams,
  handler: ctl.deleteModule,
})

/* units */
route(adminCoursesRouter, {
  method: 'post',
  path: '/admin/courses/:id/modules/:mid/units',
  summary: 'P59 Add unit',
  tags,
  auth,
  middleware: admin,
  params: mParams,
  body: UnitInput,
  response: Created,
  status: 201,
  handler: ctl.createUnit,
})
route(adminCoursesRouter, {
  method: 'put',
  path: '/admin/courses/:id/modules/:mid/units/reorder',
  summary: 'P59 Reorder units of a module',
  tags,
  auth,
  middleware: admin,
  params: mParams,
  body: ReorderInput,
  response: AdminCourseDetail,
  handler: ctl.reorderUnits,
})
route(adminCoursesRouter, {
  method: 'put',
  path: '/admin/courses/:id/units/:uid',
  summary: 'P59 Update unit (title, duration, move to module)',
  tags,
  auth,
  middleware: admin,
  params: uParams,
  body: UnitUpdate,
  response: AdminCourseDetail,
  handler: ctl.updateUnit,
})
route(adminCoursesRouter, {
  method: 'delete',
  path: '/admin/courses/:id/units/:uid',
  summary: 'P59 Remove unit (progress kept, ignored)',
  tags,
  auth,
  middleware: admin,
  params: uParams,
  handler: ctl.deleteUnit,
})

/* blocks */
route(adminCoursesRouter, {
  method: 'post',
  path: '/admin/courses/:id/units/:uid/blocks',
  summary: 'P59 Add block { type, payload, required }',
  tags,
  auth,
  middleware: admin,
  params: uParams,
  body: BlockCreate,
  response: Created,
  status: 201,
  handler: ctl.createBlock,
})
route(adminCoursesRouter, {
  method: 'put',
  path: '/admin/courses/:id/units/:uid/blocks/reorder',
  summary: 'P59 Reorder blocks of a unit',
  tags,
  auth,
  middleware: admin,
  params: uParams,
  body: ReorderInput,
  response: AdminCourseDetail,
  handler: ctl.reorderBlocks,
})
route(adminCoursesRouter, {
  method: 'put',
  path: '/admin/courses/:id/blocks/:bid',
  summary: 'P59 Update block',
  tags,
  auth,
  middleware: admin,
  params: bParams,
  body: BlockUpdate,
  response: AdminCourseDetail,
  handler: ctl.updateBlock,
})
route(adminCoursesRouter, {
  method: 'delete',
  path: '/admin/courses/:id/blocks/:bid',
  summary: 'P59 Remove block',
  tags,
  auth,
  middleware: admin,
  params: bParams,
  handler: ctl.deleteBlock,
})

/* assessments */
route(adminCoursesRouter, {
  method: 'post',
  path: '/admin/courses/:id/assessments',
  summary: 'P59 Add assessment',
  tags,
  auth,
  middleware: admin,
  params: idParam,
  body: AssessmentInput,
  response: Created,
  status: 201,
  handler: ctl.createAssessment,
})
route(adminCoursesRouter, {
  method: 'put',
  path: '/admin/courses/:id/assessments/:aid',
  summary: 'P59 Update assessment (new version when attempts exist, §9.5)',
  tags,
  auth,
  middleware: admin,
  params: aParams,
  body: AssessmentUpdate,
  response: AdminCourseDetail,
  handler: ctl.updateAssessment,
})
route(adminCoursesRouter, {
  method: 'delete',
  path: '/admin/courses/:id/assessments/:aid',
  summary: 'P59 Remove assessment',
  tags,
  auth,
  middleware: admin,
  params: aParams,
  handler: ctl.deleteAssessment,
})
route(adminCoursesRouter, {
  method: 'post',
  path: '/admin/courses/:id/assessments/:aid/questions',
  summary: 'P59 Add question',
  tags,
  auth,
  middleware: admin,
  params: aParams,
  body: QuestionInput,
  response: Created,
  status: 201,
  handler: ctl.createQuestion,
})
route(adminCoursesRouter, {
  method: 'put',
  path: '/admin/courses/:id/assessments/:aid/questions/:qid',
  summary: 'P59 Update question (returns its id in the current version)',
  tags,
  auth,
  middleware: admin,
  params: QuestionParams,
  body: QuestionInput,
  response: Created,
  handler: ctl.updateQuestion,
})
route(adminCoursesRouter, {
  method: 'delete',
  path: '/admin/courses/:id/assessments/:aid/questions/:qid',
  summary: 'P59 Remove question',
  tags,
  auth,
  middleware: admin,
  params: QuestionParams,
  handler: ctl.deleteQuestion,
})

/* card, certificate, points */
route(adminCoursesRouter, {
  method: 'put',
  path: '/admin/courses/:id/card',
  summary: 'P59 Course card',
  tags,
  auth,
  middleware: admin,
  params: idParam,
  body: CardInput,
  response: AdminCourseDetail,
  handler: ctl.card,
})
route(adminCoursesRouter, {
  method: 'put',
  path: '/admin/courses/:id/certificate',
  summary: 'P59 Certificate settings',
  tags,
  auth: 'role(admin)',
  middleware: admin,
  params: idParam,
  body: CertificateSettingsInput,
  response: AdminCourseDetail,
  handler: ctl.certificate,
})
route(adminCoursesRouter, {
  method: 'put',
  path: '/admin/courses/:id/points',
  summary: 'P58 Course points (unit, module, course, assessmentPass)',
  tags: ['Admin · Achievements'],
  auth: 'role(admin) · Audit: yes',
  middleware: admin,
  params: idParam,
  body: PointsConfigInput,
  response: z.strictObject({
    unit: z.number().int(),
    module: z.number().int(),
    course: z.number().int(),
    assessmentPass: z.number().int(),
  }),
  handler: ctl.points,
})

/* uploads */
route(adminCoursesRouter, {
  method: 'post',
  path: '/admin/uploads',
  summary: 'P59 Upload (image, PDF, audio, SCORM zip → unpacked by a job)',
  tags,
  auth: 'role(admin) · type by content · SCORM zip-slip + manifest checked · rate 30/min/user',
  middleware: [...admin, userWriteLimiter, uploadSingle('file', 200 * MB)],
  response: UploadResponse,
  handler: ctl.upload,
})
