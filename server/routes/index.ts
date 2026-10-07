import type { Router } from 'express'
import { achievementsRouter } from './achievements.routes'
import { adminCoursesRouter } from './admin-courses.routes'
import { adminMentorsRouter } from './admin-mentors.routes'
import { adminUsersRouter } from './admin-users.routes'
import { aiRouter } from './ai.routes'
import { analyticsRouter } from './analytics.routes'
import { competitionRouter } from './competition.routes'
import { competitionAdminRouter } from './competition-admin.routes'
import { dataRightsRouter } from './data-rights.routes'
import { docsRouter } from './docs.routes'
import { eventsRouter } from './events.routes'
import { filesRouter } from './files.routes'
import { formsRouter } from './forms.routes'
import { healthRouter } from './health.routes'
import { judgeRouter } from './judge.routes'
import { learningRouter } from './learning.routes'
import { meRouter } from './me.routes'
import { mentorRouter } from './mentor.routes'
import { mentoringRouter } from './mentoring.routes'
import { micrositesRouter } from './microsites.routes'
import { platformRouter } from './platform.routes'
import { publicRouter } from './public.routes'
import { publicAuthRouter } from './public-auth.routes'
import { resourcesRouter } from './resources.routes'
import { scormRouter } from './scorm.routes'
import { translationsRouter } from './translations.routes'
import { webhooksRouter } from './webhooks.routes'

/** Every API router, mounted under /api in this order. */
export const apiRouters: Router[] = [
  healthRouter,
  filesRouter,
  docsRouter,
  publicAuthRouter,
  publicRouter,
  meRouter,
  micrositesRouter,
  adminUsersRouter,
  eventsRouter,
  resourcesRouter,
  formsRouter,
  aiRouter,
  competitionRouter,
  judgeRouter,
  competitionAdminRouter,
  analyticsRouter,
  translationsRouter,
  platformRouter,
  dataRightsRouter,
  mentoringRouter,
  mentorRouter,
  adminMentorsRouter,
  webhooksRouter,
  learningRouter,
  adminCoursesRouter,
  achievementsRouter,
  scormRouter,
]
