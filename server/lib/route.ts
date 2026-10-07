import { isDeployed, responseValidationEnabled } from '@server/config/env'
import {
  HttpError,
  notFound,
  unauthenticated,
  validationFailed,
  zodFields,
} from '@server/lib/errors'
import { logger } from '@server/lib/logger'
import type { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import { z } from 'zod'
import { registry } from './openapi'

/**
 * `route()` mounts one endpoint and documents it: auth middleware → validation → handler →
 * (dev/test) response check against the documented schema → JSON. Order matters for the
 * contract's acceptance tests: denials (401/403/404) come before validation (422).
 */

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete'

export type RouteContext<P, Q, B> = {
  params: P
  query: Q
  body: B
  /** The signed-in user. Throws 401 if read on a route without auth middleware. */
  viewer: Viewer
  /** The user when signed in, null otherwise (public routes). */
  optionalViewer: Viewer | null
  req: Request
  res: Response
}

type Spec<P extends z.ZodType, Q extends z.ZodType, B extends z.ZodType, R extends z.ZodType> = {
  method: Method
  /** Express path under /api, e.g. `/microsites/:p/dashboard`. */
  path: string
  summary: string
  tags: string[]
  /** The contract's **Auth:** line, copied into the OpenAPI description. */
  auth: string
  middleware?: RequestHandler[]
  params?: P
  query?: Q
  body?: B
  response?: R
  /** Default 200 with a response schema, 204 without. */
  status?: number
  /** The handler writes the response itself (CSV, PDF, redirects, file streams). */
  raw?: boolean
  /** Extra content type for raw responses, for the docs. */
  produces?: string
  handler: (
    ctx: RouteContext<z.infer<P>, z.infer<Q>, z.infer<B>>,
  ) => Promise<z.input<R> | undefined | undefined>
}

const asyncWrap =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next)
  }

export function toOpenApiPath(path: string) {
  return path.replace(/:([A-Za-z0-9_]+)/g, '{$1}').replace(/\*([A-Za-z0-9_]+)/g, '{$1}')
}

export function route<
  P extends z.ZodType = z.ZodType<Record<string, string>>,
  Q extends z.ZodType = z.ZodType<Record<string, unknown>>,
  B extends z.ZodType = z.ZodType<unknown>,
  R extends z.ZodType = z.ZodType<unknown>,
>(router: Router, spec: Spec<P, Q, B, R>) {
  const status = spec.status ?? (spec.response ? 200 : 204)

  const handler = asyncWrap(async (req, res) => {
    let params = req.params as unknown
    if (spec.params) {
      const parsed = spec.params.safeParse(req.params)
      // A malformed id cannot exist: answer like a missing record so ids cannot be probed.
      if (!parsed.success) throw notFound()
      params = parsed.data
    }
    let query = req.query as unknown
    if (spec.query) {
      const parsed = spec.query.safeParse(req.query)
      if (!parsed.success) throw validationFailed(zodFields(parsed.error.issues))
      query = parsed.data
    }
    let body = req.body as unknown
    if (spec.body) {
      const parsed = spec.body.safeParse(req.body ?? {})
      if (!parsed.success) throw validationFailed(zodFields(parsed.error.issues))
      body = parsed.data
    }

    const ctx = {
      params: params as z.infer<P>,
      query: query as z.infer<Q>,
      body: body as z.infer<B>,
      optionalViewer: res.locals.viewer ?? null,
      req,
      res,
      get viewer(): Viewer {
        const viewer = res.locals.viewer
        if (!viewer) throw unauthenticated()
        return viewer
      },
    }
    const result = await spec.handler(ctx)
    if (spec.raw || res.headersSent) return

    if (spec.response && responseValidationEnabled) {
      const checked = spec.response.safeParse(result)
      if (!checked.success) {
        logger.error(
          { path: spec.path, issues: checked.error.issues },
          'Response does not match its schema',
        )
        throw new HttpError(
          500,
          'response_invalid',
          isDeployed
            ? 'Something went wrong'
            : `Response for ${spec.method.toUpperCase()} ${spec.path} does not match the contract: ${JSON.stringify(zodFields(checked.error.issues))}`,
        )
      }
    }
    if (status === 204 || result === undefined) {
      res.status(status === 200 ? 204 : status).end()
      return
    }
    res.status(status).json(result)
  })

  router[spec.method](spec.path, ...(spec.middleware ?? []), handler)

  const responses: Record<string, unknown> = {}
  if (spec.raw) {
    responses[String(status)] = {
      description: 'OK',
      content: { [spec.produces ?? 'application/octet-stream']: { schema: {} } },
    }
  } else if (spec.response) {
    responses[String(status)] = {
      description: 'OK',
      content: { 'application/json': { schema: spec.response } },
    }
  } else {
    responses[String(status)] = { description: 'No content' }
  }
  responses.default = { description: 'Error `{ error: { code, message, fields? } }`' }

  registry.registerPath({
    method: spec.method,
    path: `/api${toOpenApiPath(spec.path)}`,
    summary: spec.summary,
    description: `**Auth:** ${spec.auth}`,
    tags: spec.tags,
    request: {
      ...(spec.params ? { params: spec.params as unknown as z.ZodObject } : {}),
      ...(spec.query ? { query: spec.query as unknown as z.ZodObject } : {}),
      ...(spec.body ? { body: { content: { 'application/json': { schema: spec.body } } } } : {}),
    },
    responses: responses as never,
  })
}

/** Documents a route that is not mounted through `route()` (Better Auth, file streams). */
export function documentRoute(
  method: Method,
  path: string,
  summary: string,
  tags: string[],
  auth: string,
) {
  registry.registerPath({
    method,
    path,
    summary,
    description: `**Auth:** ${auth}`,
    tags,
    responses: { 200: { description: 'OK' }, default: { description: 'Error' } },
  })
}

export const noBody = z.object({}).optional()
