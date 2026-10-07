import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import '@server/app'
import { buildOpenApiDocument } from '@server/lib/openapi'

/**
 * Writes docs/openapi.json from the mounted routes. `--check` fails when the committed file is
 * out of date (CI).
 */
const target = join(import.meta.dir, '../../docs/openapi.json')
const next = `${JSON.stringify(buildOpenApiDocument(), null, 2)}\n`
if (process.argv.includes('--check')) {
  let current = ''
  try {
    current = readFileSync(target, 'utf-8')
  } catch {}
  if (current !== next) {
    console.error('docs/openapi.json is out of date. Run `bun run openapi:emit`.')
    process.exit(1)
  }
  console.log('docs/openapi.json is up to date')
} else {
  writeFileSync(target, next)
  const doc = JSON.parse(next) as { paths: Record<string, Record<string, unknown>> }
  const ops = Object.values(doc.paths).reduce((n, p) => n + Object.keys(p).length, 0)
  console.log(`Wrote docs/openapi.json (${Object.keys(doc.paths).length} paths, ${ops} operations)`)
}
process.exit(0)
