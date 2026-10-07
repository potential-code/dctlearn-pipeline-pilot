import { rm } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Bundles the server and the migrator into server/dist for the Bun runtime image. Flat output
 * (dist/index.js, dist/migrate.js) keeps both files one level below the directory holding
 * templates/ and db/migrations/, which is how they find them at runtime.
 */
const outdir = join(import.meta.dir, 'dist')
await rm(outdir, { recursive: true, force: true })

const result = await Bun.build({
  entrypoints: [join(import.meta.dir, 'index.ts'), join(import.meta.dir, 'db/migrate.ts')],
  outdir,
  naming: '[name].[ext]',
  target: 'bun',
  sourcemap: 'linked',
  minify: true,
})

if (!result.success) {
  for (const message of result.logs) console.error(message)
  process.exit(1)
}

for (const output of result.outputs) console.log(output.path)
