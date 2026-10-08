/**
 * Parity fixtures from the Claude Design artboards.
 *
 *   bun run tools/parity.ts <export/project dir>
 *
 * For every artboard in e2e/pages.ts it runs the artboard's ORIGINAL DCLogic class (from the
 * .dc.html, not the port) with the same props the route passes, renders the original template
 * with those values, and records what that render contains:
 *   - text:    every visible text run (EN and AR)
 *   - classes: how many elements carry each class
 * The app shell (sidebar, top bar) and the developer header are left out: the app renders one
 * shared AppShell instead. e2e/parity.e2e.ts compares the React page against these fixtures.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { type ChildNode, type Element, isTag, isText } from 'domhandler'
import { parseDocument } from 'htmlparser2'
import { PAGES } from '../e2e/pages'

// biome-ignore lint/suspicious/noExplicitAny: evaluating untyped mockup logic
type Any = any

class DCLogicStub {
  props: Any
  state: Any = {}
  constructor(props: Any) {
    this.props = props
  }
  setState(p: Any) {
    this.state = { ...this.state, ...(typeof p === 'function' ? p(this.state, this.props) : p) }
  }
  forceUpdate() {}
}

const fakeWindow = {
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() {},
  location: { hash: '', pathname: '/', search: '' },
  localStorage: { getItem: () => null, setItem() {} },
  scrollTo() {},
  innerWidth: 1280,
}
const fakeDocument = {
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener() {},
  removeEventListener() {},
}

function lookup(path: string, scopes: Any[]): Any {
  const p = path.trim()
  if (p === 'true') return true
  if (p === 'false') return false
  if (p === 'null') return null
  if (/^-?\d+(\.\d+)?$/.test(p)) return Number(p)
  if (/^'.*'$/.test(p)) return p.slice(1, -1)
  const [head, ...rest] = p.split('.')
  let cur: Any
  for (let i = scopes.length - 1; i >= 0; i--) {
    if (head && head in scopes[i]) {
      cur = scopes[i][head]
      break
    }
  }
  for (const seg of rest) cur = cur == null ? undefined : cur[seg]
  return cur
}

const str = (x: Any) => (x === undefined || x === null || x === false ? '' : String(x))
const HOLE = /\{\{\s*([^}]+?)\s*\}\}/g
const fill = (s: string, scopes: Any[]) => s.replace(HOLE, (_, p: string) => str(lookup(p, scopes)))
const norm = (s: string) => s.replace(/\s+/g, ' ').trim()

type Out = { text: string[]; classes: Record<string, number> }

function render(nodes: ChildNode[], scopes: Any[], out: Out) {
  for (const n of nodes) {
    if (isText(n)) {
      const t = norm(fill(n.data, scopes))
      if (t) out.text.push(t)
      continue
    }
    if (!isTag(n)) continue
    const el = n as Element
    const name = el.name.toLowerCase()
    if (name === 'style' || name === 'script' || name === 'helmet') continue
    if (name === 'sc-if') {
      const m = (el.attribs.value ?? '').match(/^\{\{\s*([^}]+?)\s*\}\}$/)
      if (m?.[1] && lookup(m[1], scopes)) render(el.children, scopes, out)
      continue
    }
    if (name === 'sc-for') {
      const m = (el.attribs.list ?? '').match(/^\{\{\s*([^}]+?)\s*\}\}$/)
      const list = m?.[1] ? lookup(m[1], scopes) : []
      const as = el.attribs.as ?? 'item'
      if (Array.isArray(list))
        list.forEach((item, i) => {
          render(el.children, [...scopes, { [as]: item, $index: i }], out)
        })
      continue
    }
    const cls = fill(el.attribs.class ?? '', scopes)
      .split(/\s+/)
      .filter(Boolean)
    if (cls.includes('specbar')) continue
    // shared shell: keep only the page content inside .mainc
    if (name === 'div' && cls.length === 1 && cls[0] === 'app') {
      const mainc = el.children.find(
        (c) => isTag(c) && (c.attribs.class ?? '').split(/\s+/).includes('mainc'),
      ) as Element | undefined
      const kids = (mainc?.children ?? []).filter((c) => !(isTag(c) && c.name === 'header'))
      render(kids, scopes, out)
      continue
    }
    for (const c of cls) out.classes[c] = (out.classes[c] ?? 0) + 1
    if (name === 'textarea' || name === 'select') continue // values, not text
    render(el.children, scopes, out)
  }
}

function fixture(
  file: string,
  props: Record<string, unknown>,
  locale: 'en' | 'ar',
): Out | { error: string } {
  const html = readFileSync(file, 'utf8')
  const script =
    html.match(/<script type="text\/x-dc"[^>]*data-dc-script[^>]*>([\s\S]*?)<\/script>/)?.[1] ?? ''
  const xdc = html
    .slice(html.indexOf('<x-dc>') + 6, html.lastIndexOf('</x-dc>'))
    .replace(/<helmet>[\s\S]*?<\/helmet>/, '')
  try {
    const Component = new Function('DCLogic', 'window', 'document', `${script}\nreturn Component;`)(
      DCLogicStub,
      fakeWindow,
      fakeDocument,
    )
    const inst = new Component({ ...props, locale, proto: true })
    const vals = inst.renderVals()
    const doc = parseDocument(xdc, {
      lowerCaseAttributeNames: false,
      lowerCaseTags: false,
      recognizeSelfClosing: true,
    })
    const out: Out = { text: [], classes: {} }
    render(doc.children, [vals], out)
    out.text = [...new Set(out.text)]
    return out
  } catch (e) {
    return { error: String(e) }
  }
}

const srcDir = process.argv[2]
if (!srcDir) {
  console.error('usage: bun run tools/parity.ts <export/project>')
  process.exit(1)
}
const outDir = join(import.meta.dirname, '../e2e/fixtures')
mkdirSync(outDir, { recursive: true })
let n = 0
for (const p of PAGES) {
  const source = p.source ?? p.artboard
  const file = join(srcDir, `${source}.dc.html`)
  const en = fixture(file, p.props ?? {}, 'en')
  const ar = fixture(file, p.props ?? {}, 'ar')
  for (const [lang, f] of [
    ['en', en],
    ['ar', ar],
  ] as const) {
    if ('error' in f) console.log(`! ${p.artboard} ${lang}: ${f.error}`)
  }
  writeFileSync(
    join(outDir, `${p.artboard}.expected.json`),
    `${JSON.stringify({ source, props: p.props ?? {}, en, ar }, null, 1)}\n`,
  )
  n++
}
console.log(`${n} parity fixtures written to e2e/fixtures/`)
