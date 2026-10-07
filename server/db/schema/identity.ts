import { createdAt, id, timestamps, tstz } from '@server/db/columns'
import { sql } from 'drizzle-orm'
import { boolean, index, inet, jsonb, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

/**
 * Identity tables. Better Auth owns `users`, `sessions`, `accounts`, `verifications`
 * (`usePlural`, `generateId: 'uuid'`), so every area can FK to `users.id` as a uuid.
 */

export const users = pgTable(
  'users',
  {
    id: id(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image: text('image'),
    /** learner · mentor · judge · sub_admin · admin. Never client-settable. */
    role: text('role').default('learner').notNull(),
    /** active · disabled · invited. Never client-settable. */
    status: text('status').default('active').notNull(),
    locale: text('locale').default('en').notNull(),
    timezone: text('timezone').default('Asia/Dubai').notNull(),
    lastLoginAt: tstz('last_login_at'),
    mustSetPassword: boolean('must_set_password').default(false).notNull(),
    tourSeen: boolean('tour_seen').default(false).notNull(),
    legacyId: text('legacy_id'),
    anonymisedAt: tstz('anonymised_at'),
    deleteRequestedAt: tstz('delete_requested_at'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('users_email_uq').on(t.email),
    index('users_role_idx').on(t.role),
    index('users_name_search_idx').using(
      'gin',
      sql`to_tsvector('simple', ${t.name} || ' ' || ${t.email})`,
    ),
  ],
)

export const sessions = pgTable(
  'sessions',
  {
    id: id(),
    expiresAt: tstz('expires_at').notNull(),
    token: text('token').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    /** Set at sign-in: 30-day sliding window instead of 7 (never for admin roles). */
    rememberMe: boolean('remember_me').default(false).notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ...timestamps(),
  },
  (t) => [uniqueIndex('sessions_token_uq').on(t.token), index('sessions_user_idx').on(t.userId)],
)

export const accounts = pgTable(
  'accounts',
  {
    id: id(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: tstz('access_token_expires_at'),
    refreshTokenExpiresAt: tstz('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    ...timestamps(),
  },
  (t) => [index('accounts_user_idx').on(t.userId)],
)

export const verifications = pgTable(
  'verifications',
  {
    id: id(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: tstz('expires_at').notNull(),
    ...timestamps(),
  },
  (t) => [index('verifications_identifier_idx').on(t.identifier)],
)

/** P15 profile. Imported HR fields (employee id, sector, hire date) are read-only for the user. */
export const userProfiles = pgTable('user_profiles', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  firstName: text('first_name').default('').notNull(),
  lastName: text('last_name').default('').notNull(),
  country: text('country').default('').notNull(),
  position: text('position').default('').notNull(),
  department: text('department').default('').notNull(),
  employmentType: text('employment_type').default('').notNull(),
  seniorityLevel: text('seniority_level').default('').notNull(),
  linkedinUrl: text('linkedin_url').default('').notNull(),
  mobile: text('mobile').default('').notNull(),
  employeeId: text('employee_id'),
  sector: text('sector'),
  hireDate: text('hire_date'),
  /** P08 extras. */
  level: text('level'),
  timeAtDct: text('time_at_dct'),
  ...timestamps(),
})

/** DB-backed lockout counter (5 failures / 15 min), shared across replicas. */
export const loginAttempts = pgTable(
  'login_attempts',
  {
    id: id(),
    email: text('email').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    successful: boolean('successful').notNull(),
    attemptedAt: createdAt(),
  },
  (t) => [index('login_attempts_email_at_idx').on(t.email, t.attemptedAt)],
)

/**
 * Invitations (P11). Only the SHA-256 of the token is stored. Role and microsite come from here,
 * never from the accept body. Resend creates a new row and token (`resent_from_id`).
 */
export const invitations = pgTable(
  'invitations',
  {
    id: id(),
    email: text('email').notNull(),
    role: text('role').notNull(),
    micrositeId: uuid('microsite_id'),
    tokenHash: text('token_hash').notNull(),
    status: text('status').default('sent').notNull(),
    message: text('message'),
    /** Extra data for the accept step (e.g. mentor categories, microsites). */
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}).notNull(),
    invitedById: uuid('invited_by_id').references(() => users.id),
    acceptedById: uuid('accepted_by_id').references(() => users.id),
    expiresAt: tstz('expires_at').notNull(),
    acceptedAt: tstz('accepted_at'),
    revokedAt: tstz('revoked_at'),
    resentFromId: uuid('resent_from_id'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('invitations_token_hash_uq').on(t.tokenHash),
    index('invitations_email_status_idx').on(t.email, t.status),
    index('invitations_microsite_idx').on(t.micrositeId),
  ],
)

/** Append-only (contract §9.2). No update/delete path exists in the code. */
export const auditLog = pgTable(
  'audit_log',
  {
    id: id(),
    actorId: uuid('actor_id').references(() => users.id),
    action: text('action').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id'),
    targetLabel: text('target_label'),
    micrositeId: uuid('microsite_id'),
    ip: inet('ip'),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}).notNull(),
    at: createdAt(),
  },
  (t) => [index('audit_log_at_idx').on(t.at), index('audit_log_actor_idx').on(t.actorId)],
)

/** Data-rights requests (§9.7). */
export const dataRequests = pgTable('data_requests', {
  id: id(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  kind: text('kind').notNull(), // export | delete
  status: text('status').default('requested').notNull(), // requested | done | rejected
  fileKey: text('file_key'),
  decidedById: uuid('decided_by_id').references(() => users.id),
  decidedAt: tstz('decided_at'),
  ...timestamps(),
})
