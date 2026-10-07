import postgres from 'postgres'

/** Creates the test database named in TEST_DATABASE_URL (default: <DATABASE_URL db>_test). */
const base = process.env.DATABASE_URL
const testUrl = process.env.TEST_DATABASE_URL ?? base?.replace(/\/([^/?]+)(\?|$)/, '/$1_test$2')
if (!testUrl || !/test/.test(testUrl))
  throw new Error('Set TEST_DATABASE_URL (must contain "test")')
const url = new URL(testUrl)
const name = url.pathname.slice(1)
url.pathname = '/postgres'
const sql = postgres(url.toString(), { max: 1, onnotice: () => {} })
const [exists] = await sql`select 1 from pg_database where datname = ${name}`
if (!exists) await sql.unsafe(`create database "${name.replace(/"/g, '')}"`)
await sql.end()
console.log(exists ? `${name} already exists` : `Created ${name}`)
