import { db } from '@server/db/connection'
import { SEED_TODAY, setNow } from '@server/lib/clock'
import { resetRateLimits } from '@server/middleware/rate-limit.middleware'
import { outbox } from '@server/services/email.service'
import { sql } from 'drizzle-orm'

/** Empties every table (keeps the schema), clears the outbox and limits, pins the clock. */
export async function resetDb() {
  const rows = await db.execute<{ tablename: string }>(
    sql`select tablename from pg_tables where schemaname = 'public'`,
  )
  const names = rows.map((r) => `"${r.tablename}"`)
  if (names.length)
    await db.execute(sql.raw(`truncate ${names.join(', ')} restart identity cascade`))
  outbox.length = 0
  await resetRateLimits()
  setNow(SEED_TODAY)
}
