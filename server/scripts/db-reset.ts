import { env } from '@server/config/env'
import postgres from 'postgres'

/** Development only: drops and recreates the public schema of DATABASE_URL. */
if (env.NODE_ENV === 'production' || env.NODE_ENV === 'staging') {
  console.error('Refusing to reset a deployed database.')
  process.exit(1)
}
const name = new URL(env.DATABASE_URL).pathname.slice(1)
if (!name.startsWith('dct_learn')) {
  console.error(`Refusing to reset "${name}": only dct_learn* databases.`)
  process.exit(1)
}
const sql = postgres(env.DATABASE_URL, { max: 1, onnotice: () => {} })
await sql.unsafe(
  'drop schema if exists public cascade; create schema public; drop schema if exists drizzle cascade;',
)
await sql.end()
console.log(`Reset ${name}`)
process.exit(0)
