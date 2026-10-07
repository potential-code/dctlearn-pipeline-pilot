import { env } from '@server/config/env'
import { errorHandler, notFoundHandler } from '@server/middleware/error.middleware'
import { requestLogger } from '@server/middleware/logger.middleware'
import { globalLimiter } from '@server/middleware/rate-limit.middleware'
import { requestId } from '@server/middleware/request-id.middleware'
import { corsPolicy, originCheck, securityHeaders } from '@server/middleware/security.middleware'
import { attachViewer } from '@server/middleware/viewer.middleware'
import { authRouter } from '@server/routes/auth.routes'
import { apiRouters } from '@server/routes/index'
import express, { type Router } from 'express'
import '@server/jobs/index'
import '@server/registrations/index'

/**
 * The Express app without a port: index.ts listens, tests use supertest. Order matters:
 * Better Auth reads the raw body, so it is mounted before `express.json`.
 */
export function buildApp(extraRouters: Router[] = []) {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', env.TRUST_PROXY)
  app.set('query parser', 'extended')

  app.use(requestId)
  if (env.LOG_LEVEL !== 'silent') app.use(requestLogger)
  app.use(securityHeaders)
  app.use('/api', corsPolicy)
  app.use('/api', originCheck)
  app.use('/api', authRouter)
  app.use(express.json({ limit: '1mb' }))
  app.use('/api', attachViewer)
  app.use('/api', globalLimiter)
  for (const router of [...apiRouters, ...extraRouters]) app.use('/api', router)
  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}

export const app = buildApp()
