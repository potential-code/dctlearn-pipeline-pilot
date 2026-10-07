import { isDeployed } from '@server/config/env'
import { errorBody, HttpError, zodFields } from '@server/lib/errors'
import { logger } from '@server/lib/logger'
import type { ErrorRequestHandler, RequestHandler } from 'express'
import { MulterError } from 'multer'
import { ZodError } from 'zod'

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json(errorBody('not_found', `No route for ${req.method} ${req.path}`))
}

function pgCode(error: unknown): string | undefined {
  const e = error as { code?: unknown; cause?: { code?: unknown } }
  if (typeof e?.code === 'string') return e.code
  if (typeof e?.cause?.code === 'string') return e.cause.code
  return undefined
}

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof HttpError) {
    if (error.headers) for (const [k, v] of Object.entries(error.headers)) res.setHeader(k, v)
    res.status(error.status).json(errorBody(error.code, error.message, error.fields))
    return
  }
  if (error instanceof ZodError) {
    res
      .status(422)
      .json(errorBody('validation_failed', 'Check the highlighted fields', zodFields(error.issues)))
    return
  }
  if (error instanceof MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json(errorBody('payload_too_large', 'The file is too large'))
      return
    }
    res.status(422).json(errorBody('validation_failed', error.message, { file: error.message }))
    return
  }
  const type = (error as { type?: string })?.type
  if (type === 'entity.too.large') {
    res.status(413).json(errorBody('payload_too_large', 'The request body is too large'))
    return
  }
  if (type === 'entity.parse.failed') {
    res.status(400).json(errorBody('bad_request', 'The request body is not valid JSON'))
    return
  }
  // Unique violation that slipped past a service check (race safety net, contract §9.4).
  if (pgCode(error) === '23505') {
    res.status(409).json(errorBody('conflict', 'This already exists'))
    return
  }
  logger.error({ err: error, requestId: res.locals.requestId, path: req.path }, 'Unhandled error')
  res
    .status(500)
    .json(
      errorBody(
        'internal_error',
        isDeployed ? 'Something went wrong' : String((error as Error)?.message ?? error),
      ),
    )
}
