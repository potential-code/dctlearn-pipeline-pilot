import { logger } from '@server/lib/logger'
import type { RequestHandler } from 'express'

/** One JSON line per request. No query strings (they can carry tokens), no bodies. */
export const requestLogger: RequestHandler = (req, res, next) => {
  const start = performance.now()
  res.on('finish', () => {
    logger.info(
      {
        requestId: res.locals.requestId,
        method: req.method,
        // Path segments that look like tokens are masked (invitation / reset links).
        path: req.originalUrl.split('?')[0]!.replace(/\/[A-Za-z0-9_-]{20,}(?=\/|$)/g, '/:token'),
        status: res.statusCode,
        ms: Math.round(performance.now() - start),
        userId: res.locals.viewer?.id,
      },
      'request',
    )
  })
  next()
}
