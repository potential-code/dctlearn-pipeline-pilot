import type { DbOrTx } from '@server/db/connection'
import { sql } from 'drizzle-orm'

/**
 * Transaction-scoped advisory lock on a string key: serialises bookings per mentor and
 * applications/matches per mentee and microsite. The partial unique indexes stay the backstop.
 */
export async function lockKey(tx: DbOrTx, key: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${key}))`)
}
