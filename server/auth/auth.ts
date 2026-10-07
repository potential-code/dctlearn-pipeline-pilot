import { breachCheckEnabled, env, isDeployed, isTest } from '@server/config/env'
import { db } from '@server/db/connection'
import { accounts, sessions, users, verifications } from '@server/db/schema/identity'
import { queueEmail } from '@server/jobs/email.job'
import { isLockedOut, recordLoginAttempt } from '@server/services/auth/lockout.service'
import { PRIVILEGED_ROLES, type Role } from '@shared/roles'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { haveIBeenPwned } from 'better-auth/plugins'
import { eq } from 'drizzle-orm'
import { CLIENT_IP_HEADER, INTERNAL_HEADER, INTERNAL_VALUE, REMEMBER_HEADER } from './internal'
import { assertSignUpAllowed, onSignUpBefore, onUserCreated } from './signup-hooks'

/**
 * One account system for the whole platform (SPEC §2): `/login` and `/{p}/login` are the same
 * Better Auth routes. Sessions per contract §9.6; lockout 5 failures / 15 min; disabled and
 * unverified users refused.
 */

export const SESSION_DAYS = 7
export const REMEMBER_DAYS = 30
export const PRIVILEGED_HOURS = 12
const DAY = 24 * 60 * 60

export function isPrivileged(role: string) {
  return PRIVILEGED_ROLES.includes(role as Role)
}

function sendInBackground(p: Promise<unknown>) {
  p.catch(() => {})
}

export const auth = betterAuth({
  appName: 'DCT Learn',
  baseURL: env.BETTER_AUTH_URL,
  basePath: '/api/auth',
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: env.CORS_ORIGINS,
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
    schema: { users, sessions, accounts, verifications },
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: DAY,
    sendResetPassword: async ({ user, url }) => {
      sendInBackground(queueEmail(user.email, 'set-password', { name: user.name, url }))
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: false,
    expiresIn: DAY,
    sendVerificationEmail: async ({ user, url }) => {
      sendInBackground(queueEmail(user.email, 'verify-email', { name: user.name, url }))
    },
  },

  user: {
    additionalFields: {
      role: { type: 'string', input: false, defaultValue: 'learner' },
      status: { type: 'string', input: false, defaultValue: 'active' },
      locale: { type: 'string', input: false, defaultValue: 'en' },
    },
  },

  session: {
    expiresIn: SESSION_DAYS * DAY,
    updateAge: DAY,
    // Off on purpose: every request re-reads session and user, so role/status changes apply at once.
    cookieCache: { enabled: false },
    additionalFields: {
      rememberMe: { type: 'boolean', input: false, defaultValue: false },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => onSignUpBefore(user, ctx),
        after: async (user, ctx) => onUserCreated(user, ctx),
      },
    },
    session: {
      create: {
        before: async (session, ctx) => {
          const [user] = await db
            .select({ role: users.role, status: users.status })
            .from(users)
            .where(eq(users.id, session.userId))
          if (!user || user.status === 'disabled') {
            throw new APIError('FORBIDDEN', {
              code: 'ACCOUNT_DISABLED',
              message: 'This account is disabled',
            })
          }
          const created = new Date()
          const remember = ctx?.headers?.get(REMEMBER_HEADER) === '1' && !isPrivileged(user.role)
          const ttlSeconds = isPrivileged(user.role)
            ? PRIVILEGED_HOURS * 3600
            : (remember ? REMEMBER_DAYS : SESSION_DAYS) * DAY
          return {
            data: {
              ...session,
              rememberMe: remember,
              expiresAt: new Date(created.getTime() + ttlSeconds * 1000),
            },
          }
        },
        after: async (session) => {
          await db
            .update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, session.userId))
        },
      },
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === '/sign-in/email') {
        const email = String((ctx.body as { email?: unknown })?.email ?? '')
        if (email && (await isLockedOut(email))) {
          throw new APIError('TOO_MANY_REQUESTS', {
            code: 'RATE_LIMITED',
            message: `Too many failed attempts. Try again in ${env.AUTH_LOCKOUT_WINDOW_MINUTES} minutes.`,
          })
        }
      }
      if (ctx.path === '/sign-up/email') {
        const internal = ctx.headers?.get(INTERNAL_HEADER) === INTERNAL_VALUE
        await assertSignUpAllowed(ctx.body as Record<string, unknown>, internal)
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== '/sign-in/email') return
      const email = String((ctx.body as { email?: unknown })?.email ?? '')
      if (!email) return
      const ok = Boolean(ctx.context.newSession)
      await recordLoginAttempt(email, ok, {
        ipAddress: ctx.headers?.get(CLIENT_IP_HEADER),
        userAgent: ctx.headers?.get('user-agent'),
      })
    }),
  },

  logger: { disabled: isTest },

  plugins: breachCheckEnabled ? [haveIBeenPwned()] : [],

  // Our own Express limiter (10/min/IP on credential routes) sits in front; Better Auth's is a
  // second brake when deployed.
  rateLimit: { enabled: isDeployed && !isTest, window: 60, max: 100 },

  advanced: {
    useSecureCookies: isDeployed,
    defaultCookieAttributes: { httpOnly: true, sameSite: 'lax', secure: isDeployed },
    ipAddress: { ipAddressHeaders: [CLIENT_IP_HEADER] },
    database: { generateId: 'uuid' },
  },
})

export type Auth = typeof auth
