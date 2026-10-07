import { createHmac, timingSafeEqual } from 'node:crypto'
import { env, features } from '@server/config/env'
import { featureOff } from '@server/lib/errors'

/**
 * Zoom Video SDK. Stub until DCT confirms Zoom (decision 2026-10-07): with no keys every call
 * answers 503 `feature_off`. With keys, signs a Video SDK JWT (HS256) for one session.
 */
export interface VideoProvider {
  readonly enabled: boolean
  sessionToken(input: {
    sessionName: string
    userName: string
    role: 0 | 1
    ttlSeconds: number
  }): Promise<{
    sdkKey: string
    signature: string
    sessionName: string
    userName: string
    expiresAt: string
  }>
  verifyWebhook(
    rawBody: string,
    signature: string | undefined,
    timestamp: string | undefined,
  ): boolean
}

function b64url(input: string | Buffer) {
  return Buffer.from(input).toString('base64url')
}

export const zoomProvider: VideoProvider = {
  get enabled() {
    return features.zoom
  },
  async sessionToken({ sessionName, userName, role, ttlSeconds }) {
    if (!features.zoom || !env.ZOOM_SDK_KEY || !env.ZOOM_SDK_SECRET)
      throw featureOff(503, 'Video sessions are not configured')
    const iat = Math.floor(Date.now() / 1000) - 30
    const exp = iat + ttlSeconds
    const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payload = b64url(
      JSON.stringify({
        app_key: env.ZOOM_SDK_KEY,
        tpc: sessionName,
        role_type: role,
        version: 1,
        iat,
        exp,
      }),
    )
    const signature = `${header}.${payload}.${createHmac('sha256', env.ZOOM_SDK_SECRET).update(`${header}.${payload}`).digest('base64url')}`
    return {
      sdkKey: env.ZOOM_SDK_KEY,
      signature,
      sessionName,
      userName,
      expiresAt: new Date(exp * 1000).toISOString(),
    }
  },
  verifyWebhook(rawBody, signature, timestamp) {
    if (!env.ZOOM_WEBHOOK_SECRET || !signature || !timestamp) return false
    const expected = `v0=${createHmac('sha256', env.ZOOM_WEBHOOK_SECRET).update(`v0:${timestamp}:${rawBody}`).digest('hex')}`
    const a = Buffer.from(expected)
    const b = Buffer.from(signature)
    return a.length === b.length && timingSafeEqual(a, b)
  },
}

let provider: VideoProvider = zoomProvider
export function videoProvider() {
  return provider
}
export function setVideoProvider(next: VideoProvider) {
  provider = next
}
