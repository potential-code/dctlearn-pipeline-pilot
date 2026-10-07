import type { Router } from 'express'
import { adminUsersRouter } from './admin-users.routes'
import { aiRouter } from './ai.routes'
import { docsRouter } from './docs.routes'
import { eventsRouter } from './events.routes'
import { filesRouter } from './files.routes'
import { formsRouter } from './forms.routes'
import { healthRouter } from './health.routes'
import { meRouter } from './me.routes'
import { micrositesRouter } from './microsites.routes'
import { publicRouter } from './public.routes'
import { publicAuthRouter } from './public-auth.routes'
import { resourcesRouter } from './resources.routes'

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
]
