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
        path: req.path,
        status: res.statusCode,
        ms: Math.round(performance.now() - start),
        userId: res.locals.viewer?.id,
      },
      'request',
    )
  })
  next()
}
