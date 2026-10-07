import type { Router } from 'express'
import { adminUsersRouter } from './admin-users.routes'
import { docsRouter } from './docs.routes'
import { filesRouter } from './files.routes'
import { healthRouter } from './health.routes'
import { meRouter } from './me.routes'
import { micrositesRouter } from './microsites.routes'
import { publicRouter } from './public.routes'
import { publicAuthRouter } from './public-auth.routes'

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
]
