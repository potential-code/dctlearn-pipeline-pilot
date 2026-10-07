/**
 * Test preload. Points the server at the test database (never the dev one), silences logs,
 * switches rate limits, the job loop and real e-mail off, and rebuilds the schema once per run
 * from server/db/schema/*.ts (drizzle-kit push), so every test starts from the current tables.
 */
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const testUrl =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL?.replace(/\/[^/?]+(\?|$)/, '/dct_learn_test$1')
if (!testUrl || !/test/.test(testUrl))
  throw new Error('TEST_DATABASE_URL must point at a *test* database')

Object.assign(process.env, {
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  DATABASE_URL: testUrl,
  RATE_LIMIT_ENABLED: 'false',
  MAIL_TRANSPORT: 'memory',
  JOBS_ENABLED: 'false',
  PASSWORD_BREACH_CHECK: 'false',
  RESPONSE_VALIDATION: 'true',
  STORAGE_DRIVER: 'local',
  STORAGE_LOCAL_DIR: mkdtempSync(join(tmpdir(), 'dct-storage-')),
  BETTER_AUTH_URL: 'http://localhost:8000',
  APP_URL: 'http://localhost:5173',
  CORS_ORIGINS: 'http://localhost:5173',
  REDIS_URL: '',
})
process.env.BETTER_AUTH_SECRET ||= 'test-secret-that-is-at-least-32-characters-long'

if (!process.env.SKIP_SCHEMA_PUSH) {
  const postgres = (await import('postgres')).default
  const sql = postgres(testUrl, { max: 1, onnotice: () => {} })
  await sql.unsafe('drop schema if exists public cascade; create schema public;')
  await sql.end()
  const push = Bun.spawnSync(
    ['bunx', '--bun', 'drizzle-kit', 'push', '--force', '--config', './drizzle.config.ts'],
    {
      env: { ...process.env, DATABASE_URL: testUrl },
      stdout: 'pipe',
      stderr: 'pipe',
    },
  )
  if (push.exitCode !== 0) {
    throw new Error(
      `drizzle-kit push failed:\n${push.stdout.toString()}\n${push.stderr.toString()}`,
    )
  }
}
