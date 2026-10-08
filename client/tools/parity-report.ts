/** Summarises e2e/.out/parity/*.json into e2e/.out/parity-report.md. */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = join(import.meta.dirname, '../e2e/.out/parity')
type Row = {
  artboard: string
  lang: string
  texts: number
  classes: number
  missingText: string[]
  classDiff: string[]
}
const rows: Row[] = readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')))
  .sort((a, b) => a.artboard.localeCompare(b.artboard) || a.lang.localeCompare(b.lang))
const ok = rows.filter((r) => !r.missingText.length && !r.classDiff.length)
let md = `# Parity with the Claude Design artboards\n\n${ok.length} of ${rows.length} page/language checks match exactly.\n\n`
md +=
  '| Artboard | Lang | Text runs | Classes | Missing text | Class count diffs |\n|---|---|---|---|---|---|\n'
for (const r of rows)
  md += `| ${r.artboard} | ${r.lang} | ${r.texts} | ${r.classes} | ${r.missingText.length} | ${r.classDiff.length} |\n`
for (const r of rows.filter((x) => x.missingText.length || x.classDiff.length)) {
  md += `\n## ${r.artboard} (${r.lang})\n`
  for (const t of r.missingText) md += `- missing text: ${t}\n`
  for (const c of r.classDiff) md += `- ${c}\n`
}
writeFileSync(join(dir, '../parity-report.md'), md)
console.log(`${ok.length}/${rows.length} match; report: e2e/.out/parity-report.md`)
