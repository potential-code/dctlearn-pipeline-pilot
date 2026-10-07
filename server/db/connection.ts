import { env } from '@server/config/env'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// postgres.js connects lazily on the first query, so importing this file never opens a socket.
const client = postgres(env.DATABASE_URL, {
  max: 10,
  connect_timeout: 10,
  onnotice: () => {},
})

/** One handle for the whole process. Schema-less: services use the query builder, not `db.query`. */
export const db = drizzle({ client })

export type Db = typeof db
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]
/** Services accept either, so callers can compose them inside one transaction. */
export type DbOrTx = Db | Tx

export async function closeDb() {
  await client.end({ timeout: 5 })
}

export const sqlClient = client
