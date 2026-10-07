import { z } from 'zod'

/**
 * Boot-time validation of the environment (API-CONTRACT §9.9). The only file that reads
 * `process.env` (drizzle.config.ts and seed/test scripts aside). An empty value counts as unset.
 */

const url = z.url()

const originList = z
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  )
  .pipe(z.array(url.transform((origin) => new URL(origin).origin)).min(1))

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65_535).default(8000),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    APP_VERSION: z.string().default('0.1.0'),

    DATABASE_URL: url,

    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: url,
    /** Public web app origin: links in e-mails point here. */
    APP_URL: url,
    /** Browser origins allowed to call the API with cookies (comma-separated, exact). */
    CORS_ORIGINS: originList,
    TRUST_PROXY: z.stringbool().default(false),

    /** Off in tests; the rate-limit tests switch it on explicitly. */
    RATE_LIMIT_ENABLED: z.stringbool().default(true),
    /** haveibeenpwned check on new passwords (network call). On when deployed. */
    PASSWORD_BREACH_CHECK: z.stringbool().optional(),
    /** Validate every JSON response against its documented schema (dev/test safety net). */
    RESPONSE_VALIDATION: z.stringbool().optional(),

    AUTH_LOCKOUT_MAX_ATTEMPTS: z.coerce.number().int().min(1).default(5),
    AUTH_LOCKOUT_WINDOW_MINUTES: z.coerce.number().int().min(1).default(15),

    MAIL_FROM: z.email().default('DCTLEARN@dctabudhabi.ae'),
    /** `smtp` (Mailpit in dev) · `ses` (deployed) · `memory` (tests: kept in an outbox). */
    MAIL_TRANSPORT: z.enum(['smtp', 'ses', 'memory']).optional(),
    SES_REGION: z.string().default('me-central-1'),
    SES_ACCESS_KEY_ID: z.string().optional(),
    SES_SECRET_ACCESS_KEY: z.string().optional(),
    MAILPIT_HOST: z.string().default('localhost'),
    MAILPIT_PORT: z.coerce.number().int().default(1025),

    STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
    STORAGE_LOCAL_DIR: z.string().default('./storage'),
    STORAGE_S3_ENDPOINT: z.string().optional(),
    STORAGE_S3_REGION: z.string().default('me-central-1'),
    STORAGE_S3_BUCKET: z.string().optional(),
    STORAGE_S3_ACCESS_KEY_ID: z.string().optional(),
    STORAGE_S3_SECRET_ACCESS_KEY: z.string().optional(),
    FILE_SIGNING_SECRET: z.string().min(32).optional(),

    REDIS_URL: z.string().optional(),
    /** Run the background job runner inside this process. Off in tests (they call it directly). */
    JOBS_ENABLED: z.stringbool().default(true),
    JOBS_POLL_SECONDS: z.coerce.number().int().min(1).default(5),

    ZOOM_SDK_KEY: z.string().optional(),
    ZOOM_SDK_SECRET: z.string().optional(),
    ZOOM_WEBHOOK_SECRET: z.string().optional(),
    AI_PROVIDER_URL: z.string().optional(),
    AI_PROVIDER_KEY: z.string().optional(),
    AI_MODEL: z.string().optional(),
    POTENTIAL_INTAKE_URL: z.string().optional(),
    POTENTIAL_INTAKE_KEY: z.string().optional(),
    VOICE_PROVIDER_KEY: z.string().optional(),
    TRANSLATION_API_URL: z.string().optional(),
    TRANSLATION_API_KEY: z.string().optional(),
    SENTRY_DSN: z.string().optional(),
    /** AI embed script / iframe hosts allowed on P61 (comma-separated host names). */
    AI_EMBED_ALLOWED_HOSTS: z.string().default(''),
    /** E-mail domains that may self-register on P08 (comma-separated). */
    EMPLOYEE_EMAIL_DOMAINS: z.string().default('dctabudhabi.ae'),
  })
  .superRefine((value, ctx) => {
    if (Boolean(value.SES_ACCESS_KEY_ID) !== Boolean(value.SES_SECRET_ACCESS_KEY)) {
      ctx.addIssue({
        code: 'custom',
        path: ['SES_SECRET_ACCESS_KEY'],
        message: 'SES_ACCESS_KEY_ID and SES_SECRET_ACCESS_KEY must be set together',
      })
    }
    if (value.STORAGE_DRIVER === 's3' && !value.STORAGE_S3_BUCKET) {
      ctx.addIssue({
        code: 'custom',
        path: ['STORAGE_S3_BUCKET'],
        message: 'required when STORAGE_DRIVER=s3',
      })
    }
    const deployed = value.NODE_ENV === 'production' || value.NODE_ENV === 'staging'
    if (deployed && !value.FILE_SIGNING_SECRET) {
      ctx.addIssue({
        code: 'custom',
        path: ['FILE_SIGNING_SECRET'],
        message: 'required when deployed',
      })
    }
  })

export type Env = z.infer<typeof envSchema>

function dropBlank(source: Record<string, string | undefined>) {
  return Object.fromEntries(Object.entries(source).filter(([, value]) => value !== ''))
}

export function parseEnv(source: Record<string, string | undefined>) {
  return envSchema.safeParse(dropBlank(source))
}

function loadEnv(): Env {
  const result = parseEnv(process.env)
  if (result.success) return result.data
  const lines = result.error.issues.map((issue) => {
    const key = issue.path.join('.') || '(root)'
    const missing = !process.env[String(issue.path[0])]
    return `  - ${key}: ${missing ? 'missing (unset or empty)' : issue.message}`
  })
  console.error(`Invalid environment configuration:\n${lines.join('\n')}`)
  process.exit(1)
}

export const env = loadEnv()

export const isDeployed = env.NODE_ENV === 'production' || env.NODE_ENV === 'staging'
export const isTest = env.NODE_ENV === 'test'

export const breachCheckEnabled = env.PASSWORD_BREACH_CHECK ?? isDeployed
export const responseValidationEnabled = env.RESPONSE_VALIDATION ?? !isDeployed
export const fileSigningSecret = env.FILE_SIGNING_SECRET ?? env.BETTER_AUTH_SECRET
export const mailTransport = env.MAIL_TRANSPORT ?? (isTest ? 'memory' : isDeployed ? 'ses' : 'smtp')
export const employeeDomains = env.EMPLOYEE_EMAIL_DOMAINS.split(',')
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean)
export const aiEmbedHosts = env.AI_EMBED_ALLOWED_HOSTS.split(',')
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean)

/** Optional integrations: blank keys switch the feature off (stubs answer 503 / rule-based). */
export const features = {
  zoom: Boolean(env.ZOOM_SDK_KEY && env.ZOOM_SDK_SECRET),
  ai: Boolean(env.AI_PROVIDER_URL && env.AI_PROVIDER_KEY),
  voiceHiring: Boolean(env.POTENTIAL_INTAKE_URL && env.POTENTIAL_INTAKE_KEY),
  translation: Boolean(env.TRANSLATION_API_URL && env.TRANSLATION_API_KEY),
}
