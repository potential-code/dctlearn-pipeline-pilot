import { apiReference } from '@scalar/express-api-reference'
import { isDeployed } from '@server/config/env'
import { buildOpenApiDocument } from '@server/lib/openapi'
import { requireRole } from '@server/middleware/auth.middleware'
import { type RequestHandler, Router } from 'express'

/** OpenAPI JSON + Scalar UI. Open in development; admin-only when deployed. */
export const docsRouter = Router()

const guard: RequestHandler[] = isDeployed ? requireRole('admin') : []

docsRouter.get('/docs/openapi.json', ...guard, (_req, res) => {
  res.json(buildOpenApiDocument())
})

docsRouter.use(
  '/docs',
  ...guard,
  (_req, res, next) => {
    // Scalar needs its own script and styles; relax the API's CSP for this page only.
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'",
    )
    next()
  },
  apiReference({
    url: '/api/docs/openapi.json',
    pageTitle: 'DCT Learn API',
  }) as unknown as RequestHandler,
)
