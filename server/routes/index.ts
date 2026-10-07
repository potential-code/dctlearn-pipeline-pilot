import type { Router } from 'express'
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
import { meRouter } from './me.routes'
import { micrositesRouter } from './microsites.routes'
import { platformRouter } from './platform.routes'
import { publicRouter } from './public.routes'
import { publicAuthRouter } from './public-auth.routes'
import { resourcesRouter } from './resources.routes'
import { translationsRouter } from './translations.routes'

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
]
