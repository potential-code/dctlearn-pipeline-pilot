import { env } from '@server/config/env'
import { clientIp } from '@server/lib/client-ip'
import { rateLimited } from '@server/lib/errors'
import type { Request, RequestHandler } from 'express'
import { MemoryStore, rateLimit, type Store } from 'express-rate-limit'
import { Redis } from 'ioredis'
import { type RedisReply, RedisStore } from 'rate-limit-redis'

/**
 * Rate limits of contract §0: auth 10/min/IP · public forms 5/min/IP · invitations, imports,
 * uploads 30/min/user · everything else 120/min (user, or IP when signed out). 429 + Retry-After.
 * Redis-backed when REDIS_URL is set (shared across replicas), memory otherwise.
 */

export const rateLimitState = { enabled: env.RATE_LIMIT_ENABLED }

const redis = env.REDIS_URL
  ? new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 2 })
  : null
const memoryStores: MemoryStore[] = []

function makeStore(prefix: string): Store {
  if (redis) {
    return new RedisStore({
      prefix: `rl:${prefix}:`,
      sendCommand: (command: string, ...args: string[]) =>
        redis.call(command, ...args) as Promise<RedisReply>,
    })
  }
  const store = new MemoryStore()
  memoryStores.push(store)
  return store
}

/** Tests: start every case with empty buckets. */
export async function resetRateLimits() {
  for (const store of memoryStores) await store.resetAll?.()
}

function limiter(
  prefix: string,
  limit: number,
  key: (req: Request, viewer: Viewer | null) => string,
): RequestHandler {
  return rateLimit({
    windowMs: 60_000,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    store: makeStore(prefix),
    skip: () => !rateLimitState.enabled,
    keyGenerator: (req, res) => key(req, res.locals.viewer ?? null),
    handler: (_req, _res, next, options) => next(rateLimited(Math.ceil(options.windowMs / 1000))),
    validate: { trustProxy: false, xForwardedForHeader: false, ip: false },
  })
}

const byIp = (req: Request) => clientIp(req)
const byUserOrIp = (req: Request, viewer: Viewer | null) =>
  viewer ? `u:${viewer.id}` : `ip:${clientIp(req)}`

export const authLimiter = limiter('auth', 10, byIp)
export const publicFormLimiter = limiter('form', 5, byIp)
export const userWriteLimiter = limiter('write', 30, byUserOrIp)
export const globalLimiter = limiter('global', 120, byUserOrIp)
