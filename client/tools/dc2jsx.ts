/**
 * Codemod: Claude Design artboard (.dc.html) → React page folder.
 *
 *   bun run tools/dc2jsx.ts <export/project dir> <out pages dir> [Artboard ...]
 *
 * For each artboard it writes src/pages/<Artboard>/:
 *   view.tsx    the <x-dc> markup as JSX (holes, sc-for, sc-if, events, styles converted)
 *   logic.js    the artboard's DCLogic class, unchanged apart from imports, hash routes → paths
 *               and the shared shell helper
 *   logic.d.ts  its type stub
 *   style.css   the <helmet> page CSS, scoped under .pgs-<Artboard>
 *   meta.json   the data-props declaration (variants, preview size)
 *   index.tsx   the page component: useDC(logic) → view
 *
 * Signed-in pages carry a copy of the app shell; it is replaced by <AppShell sh={v.sh}>.
 * The developer header ("specbar") is dropped.
 */
import { existsSync, writeFileSync as fsWrite, mkdirSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { type ChildNode, type Element, isComment, isTag, isText } from 'domhandler'
import { parseDocument } from 'htmlparser2'

type Scope = { loops: { name: string; idx: string; orig: string }[] }

/** Hand-edited files carry a "client:" marker; only --force overwrites them. */
let force = false
const skipped: string[] = []
function writeFileSync(file: string, data: string) {
  if (!force && existsSync(file) && readFileSync(file, 'utf8').includes('client:')) {
    skipped.push(file)
    return
  }
  fsWrite(file, data)
}

const warnings: string[] = []
const used = new Set<string>()
let current = ''

const RESERVED = new Set(
  'break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof new null return super switch this throw true try typeof var void while with yield let static implements interface package private protected public await v'.split(
    ' ',
  ),
)

const HTML_ATTRS: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  readonly: 'readOnly',
  maxlength: 'maxLength',
  minlength: 'minLength',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  autocomplete: 'autoComplete',
  autofocus: 'autoFocus',
  autoplay: 'autoPlay',
  inputmode: 'inputMode',
  enterkeyhint: 'enterKeyHint',
  spellcheck: 'spellCheck',
  crossorigin: 'crossOrigin',
  srcset: 'srcSet',
  datetime: 'dateTime',
  novalidate: 'noValidate',
  formnovalidate: 'formNoValidate',
  playsinline: 'playsInline',
  contenteditable: 'contentEditable',
  accesskey: 'accessKey',
  'accept-charset': 'acceptCharset',
  'http-equiv': 'httpEquiv',
  frameborder: 'frameBorder',
  allowfullscreen: 'allowFullScreen',
  cellpadding: 'cellPadding',
  cellspacing: 'cellSpacing',
  usemap: 'useMap',
  referrerpolicy: 'referrerPolicy',
  fetchpriority: 'fetchPriority',
  popovertarget: 'popoverTarget',
}
const BOOLEAN_ATTRS = new Set([
  'disabled',
  'checked',
  'selected',
  'readonly',
  'required',
  'multiple',
  'autofocus',
  'hidden',
  'open',
  'novalidate',
  'controls',
  'loop',
  'muted',
  'playsinline',
  'reversed',
  'default',
  'inert',
  'itemscope',
  'async',
  'defer',
])
const VOID = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
])
const CONTROLLED_INPUT_TYPES_EXCLUDED = new Set([
  'radio',
  'checkbox',
  'button',
  'submit',
  'reset',
  'hidden',
  'image',
])

const HOLE = /\{\{\s*([^}]+?)\s*\}\}/g

/** Attributes React types as numbers; static numeric values are emitted as numbers. */
const NUMERIC_ATTRS = new Set([
  'tabIndex',
  'rows',
  'cols',
  'size',
  'maxLength',
  'minLength',
  'colSpan',
  'rowSpan',
  'span',
  'start',
  'high',
  'low',
  'optimum',
  'aria-valuenow',
  'aria-valuemin',
  'aria-valuemax',
  'aria-level',
  'aria-posinset',
  'aria-setsize',
  'aria-colcount',
  'aria-rowcount',
  'aria-colindex',
  'aria-rowindex',
  'aria-colspan',
  'aria-rowspan',
])

function camel(name: string): string {
  return name.replace(/[-:]([a-z])/g, (_, c: string) => c.toUpperCase())
}

function safeIdent(name: string): string {
  const clean = name.replace(/[^A-Za-z0-9_$]/g, '_')
  return RESERVED.has(clean) || /^[0-9]/.test(clean) ? `_${clean}` : clean
}

/** Dotted lookup → JS expression with optional chaining. */
function expr(path: string, scope: Scope): string {
  const p = path.trim()
  if (/^(true|false|null|undefined)$/.test(p) || /^-?\d+(\.\d+)?$/.test(p)) return p
  if (/^'.*'$/.test(p) || /^".*"$/.test(p)) return p
  if (!/^[A-Za-z_$][\w$]*(\.[\w$]+)*$/.test(p)) {
    warnings.push(`${current}: unsupported hole {{${p}}}`)
    return 'undefined'
  }
  const segs = p.split('.')
  const head = segs[0] ?? ''
  let base: string
  if (head === '$index') {
    const loop = scope.loops[scope.loops.length - 1]
    base = loop ? loop.idx : '0'
  } else {
    const loop = [...scope.loops].reverse().find((l) => l.orig === head)
    base = loop ? loop.name : `v.${head}`
  }
  let out = base
  for (const seg of segs.slice(1)) out += /^\d+$/.test(seg) ? `?.[${seg}]` : `?.${seg}`
  return out
}

function hasHole(value: string): boolean {
  return /\{\{\s*[^}]+?\s*\}\}/.test(value)
}

function wholeHole(value: string): string | null {
  const m = value.trim().match(/^\{\{\s*([^}]+?)\s*\}\}$/)
  return m?.[1] ?? null
}

function template(value: string, scope: Scope): string {
  let out = ''
  let last = 0
  for (const m of value.matchAll(HOLE)) {
    out += value.slice(last, m.index).replace(/[`\\]/g, '\\$&').replace(/\$\{/g, '\\${')
    used.add('s')
    out += `\${$s(${expr(m[1] ?? '', scope)})}`
    last = (m.index ?? 0) + m[0].length
  }
  out += value.slice(last).replace(/[`\\]/g, '\\$&').replace(/\$\{/g, '\\${')
  return `\`${out}\``
}

function attrString(value: string): string {
  return /["&\\{}]/.test(value) || value.includes('\n')
    ? `{${JSON.stringify(value)}}`
    : `"${value}"`
}

/** Split a declaration list on ; outside parentheses/quotes. */
function splitDecls(style: string): string[] {
  const out: string[] = []
  let depth = 0
  let quote = ''
  let cur = ''
  for (const ch of style) {
    if (quote) {
      if (ch === quote) quote = ''
    } else if (ch === '"' || ch === "'") quote = ch
    else if (ch === '(') depth++
    else if (ch === ')') depth--
    else if (ch === ';' && depth === 0) {
      out.push(cur)
      cur = ''
      continue
    }
    cur += ch
  }
  out.push(cur)
  return out.map((d) => d.trim()).filter(Boolean)
}

function cssProp(prop: string): string {
  const p = prop.trim()
  if (p.startsWith('--')) return JSON.stringify(p)
  if (p.startsWith('-ms-')) return camel(p.slice(1))
  if (p.startsWith('-')) {
    const c = camel(p.slice(1))
    return c.charAt(0).toUpperCase() + c.slice(1)
  }
  return camel(p)
}

function styleAttr(value: string, scope: Scope): string {
  const parts: string[] = []
  for (const decl of splitDecls(value)) {
    const i = decl.indexOf(':')
    if (i < 0) continue
    const prop = decl.slice(0, i)
    const val = decl.slice(i + 1).trim()
    const key = cssProp(prop)
    const v = hasHole(val) ? template(val, scope) : JSON.stringify(val)
    parts.push(`${key}: ${v}`)
  }
  if (parts.some((x) => x.startsWith('"--'))) {
    used.add('sx')
    return `style={$sx({ ${parts.join(', ')} })}`
  }
  return `style={{ ${parts.join(', ')} }}`
}

function classOf(el: Element): string[] {
  return (el.attribs.class ?? '').split(/\s+/).filter(Boolean)
}

function convertAttrs(el: Element, scope: Scope, inSvg: boolean, extra: string[] = []): string {
  const tag = el.name.toLowerCase()
  const a = { ...el.attribs }
  delete a['hint-placeholder-val']
  delete a['hint-placeholder-count']
  const out: string[] = [...extra]
  const has = (n: string) => Object.keys(a).some((k) => k === n)
  const isFormField =
    tag === 'textarea' ||
    tag === 'select' ||
    (tag === 'input' && !CONTROLLED_INPUT_TYPES_EXCLUDED.has((a.type ?? 'text').toLowerCase()))
  const isCheck = tag === 'input' && ['checkbox', 'radio'].includes((a.type ?? '').toLowerCase())
  const handler = has('onInput') || has('onChange')
  const anyHandler = handler || has('onClick')

  // React wants onChange for live text updates; the mockup uses onInput.
  if (has('onInput') && !has('onChange') && (isFormField || isCheck)) {
    a.onChange = a.onInput ?? ''
    delete a.onInput
  }

  for (const [rawName, value] of Object.entries(a)) {
    let name = rawName
    if (name === 'class') name = 'className'
    else if (/^on[A-Z]/.test(name)) {
      const h = wholeHole(value)
      if (h) out.push(`${name}={${expr(h, scope)}}`)
      else warnings.push(`${current}: dropped static handler ${name}`)
      continue
    } else if (name.startsWith('aria-') || name.startsWith('data-')) {
      // keep
    } else if (inSvg) {
      if (name === 'xlink:href') name = 'xlinkHref'
      else if (name === 'xml:space') name = 'xmlSpace'
      else if (name.includes('-') || name.includes(':')) name = camel(name)
    } else {
      name = HTML_ATTRS[name.toLowerCase()] ?? name
    }

    // controlled form values without a change handler become defaults (still editable)
    if ((rawName === 'value' && isFormField) || (rawName === 'checked' && isCheck)) {
      if (!anyHandler) name = rawName === 'value' ? 'defaultValue' : 'defaultChecked'
      else if (!handler) {
        out.push('onChange={$noop}')
        used.add('noop')
      }
    }

    if (rawName === 'href' && value.startsWith('#/')) {
      out.push(
        `href=${hasHole(value) ? `{${template(value.slice(1), scope)}}` : attrString(value.slice(1))}`,
      )
      continue
    }
    if (rawName === 'style') {
      out.push(styleAttr(value, scope))
      continue
    }
    if (value === '' && BOOLEAN_ATTRS.has(rawName.toLowerCase())) {
      out.push(name)
      continue
    }
    const h = wholeHole(value)
    if (h) {
      const e = expr(h, scope)
      if (name === 'className') {
        used.add('s')
        out.push(`className={$s(${e})}`)
      } else out.push(`${name}={${e}}`)
    } else if (hasHole(value)) out.push(`${name}={${template(value, scope)}}`)
    else if (NUMERIC_ATTRS.has(name) && /^-?\d+(\.\d+)?$/.test(value.trim()))
      out.push(`${name}={${value.trim()}}`)
    else out.push(`${name}=${attrString(value)}`)
  }
  return out.length ? ` ${out.join(' ')}` : ''
}

function textToJsx(raw: string, scope: Scope): string {
  const text = raw.replace(/\s+/g, ' ')
  if (!text.trim()) return ''
  let out = ''
  let last = 0
  const lit = (t: string) => {
    if (!t) return ''
    return /^[^{}<>&\s][^{}<>&]*[^{}<>&\s]$|^[^{}<>&\s]$/.test(t) ? t : `{${JSON.stringify(t)}}`
  }
  for (const m of text.matchAll(HOLE)) {
    out += lit(text.slice(last, m.index))
    out += `{${expr(m[1] ?? '', scope)}}`
    last = (m.index ?? 0) + m[0].length
  }
  out += lit(text.slice(last))
  return out
}

type Ctx = { scope: Scope; inSvg: boolean; shellDone: { v: boolean }; textParent?: string }

/** Elements where React rejects whitespace text children. */
const NO_TEXT_PARENTS = new Set([
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'colgroup',
  'select',
  'optgroup',
  'datalist',
])

function convertChildren(nodes: ChildNode[], ctx: Ctx): string {
  const parts: string[] = []
  const parentName = ctx.textParent ?? ''
  nodes.forEach((n, i) => {
    if (isComment(n)) return
    if (isText(n)) {
      const t = n.data
      if (!t.trim()) {
        // whitespace between two siblings renders as one space in HTML
        const prev = nodes
          .slice(0, i)
          .reverse()
          .find((x) => !isComment(x))
        const next = nodes.slice(i + 1).find((x) => !isComment(x))
        if (prev && next && t.length > 0 && !NO_TEXT_PARENTS.has(parentName)) parts.push("{' '}")
        return
      }
      parts.push(textToJsx(t, ctx.scope))
      return
    }
    if (isTag(n)) parts.push(convertEl(n, ctx))
  })
  return parts.filter(Boolean).join('\n')
}

function findChild(el: Element, pred: (e: Element) => boolean): Element | undefined {
  for (const c of el.children) if (isTag(c) && pred(c)) return c
  return undefined
}

function convertEl(el: Element, ctx: Ctx): string {
  const tag = el.name
  const lower = tag.toLowerCase()
  const cls = classOf(el)

  if (cls.includes('specbar')) return ''
  if (lower === 'script' || lower === 'helmet') {
    warnings.push(`${current}: dropped <${tag}> in markup`)
    return ''
  }
  if (lower === 'style') {
    warnings.push(`${current}: inline <style> in markup kept as dangerouslySetInnerHTML`)
    return `<style dangerouslySetInnerHTML={{ __html: ${JSON.stringify(el.children.map((c) => (isText(c) ? c.data : '')).join(''))} }} />`
  }

  // App shell copy → <AppShell>
  if (
    lower === 'div' &&
    cls.length === 1 &&
    cls[0] === 'app' &&
    findChild(el, (c) => classOf(c).includes('nav-cb') || c.name === 'aside')
  ) {
    const mainc = findChild(el, (c) => classOf(c).includes('mainc'))
    if (!mainc) warnings.push(`${current}: .app without .mainc`)
    const kids = (mainc?.children ?? []).filter(
      (c) => !(isTag(c) && c.name === 'header' && classOf(c).includes('topb')),
    )
    used.add('AppShell')
    ctx.shellDone.v = true
    return `<AppShell sh={v.sh}>\n${convertChildren(kids, { ...ctx, textParent: 'div' })}\n</AppShell>`
  }

  if (lower === 'sc-for') {
    const list = wholeHole(el.attribs.list ?? '')
    const as = el.attribs.as ?? 'item'
    if (!list) {
      warnings.push(`${current}: sc-for without list hole`)
      return ''
    }
    const name = safeIdent(as)
    const idx = `${name}$i`
    const listExpr = expr(list, ctx.scope)
    const scope: Scope = { loops: [...ctx.scope.loops, { name, idx, orig: as }] }
    const body = convertChildren(el.children, { ...ctx, scope })
    used.add('arr')
    used.add('Fragment')
    const usesName = new RegExp(`\\b${name.replace(/\$/g, '\\$')}\\b(?!\\$i)`).test(body)
    const param = usesName ? name : `_${name}`
    return `{$arr(${listExpr}).map((${param}, ${idx}) => (\n<Fragment key={${idx}}>\n${body}\n</Fragment>\n))}`
  }

  if (lower === 'sc-if') {
    const cond = wholeHole(el.attribs.value ?? '')
    if (!cond) {
      warnings.push(`${current}: sc-if without value hole`)
      return ''
    }
    const body = convertChildren(el.children, ctx)
    if (!body.trim()) return ''
    return `{${expr(cond, ctx.scope)} ? (\n<>\n${body}\n</>\n) : null}`
  }

  if (lower === 'dc-import') {
    warnings.push(`${current}: dc-import ${el.attribs.name} not supported in pages`)
    return ''
  }

  const inSvg = ctx.inSvg || lower === 'svg'
  let extra: string[] = []
  let children = el.children

  // <textarea>text</textarea> → defaultValue / value
  if (lower === 'textarea' && children.length) {
    const txt = children.map((c) => (isText(c) ? c.data : '')).join('')
    if (txt.trim()) {
      const h = wholeHole(txt)
      const val = h
        ? `{${expr(h, ctx.scope)}}`
        : hasHole(txt)
          ? `{${template(txt, ctx.scope)}}`
          : attrString(txt)
      const hasHandler = 'onInput' in el.attribs || 'onChange' in el.attribs
      extra = [`${hasHandler ? 'value' : 'defaultValue'}=${val}`]
    }
    children = []
  }

  // <select> with <option selected> → defaultValue on the select
  if (lower === 'select' && !('value' in el.attribs)) {
    const opts = el.children.filter((c): c is Element => isTag(c) && c.name === 'option')
    const sel = opts.find((o) => 'selected' in o.attribs)
    if (sel) {
      const v =
        sel.attribs.value ??
        sel.children
          .map((c) => (isText(c) ? c.data : ''))
          .join('')
          .trim()
      const h = wholeHole(sel.attribs.selected ?? '')
      if (!h && !hasHole(v)) extra.push(`defaultValue=${attrString(v)}`)
      else warnings.push(`${current}: select with dynamic selected option`)
    }
  }
  if (lower === 'option' && 'selected' in el.attribs) {
    const parentSel = el.parent && isTag(el.parent) && el.parent.name === 'select'
    if (parentSel && !wholeHole(el.attribs.selected ?? '')) {
      const { selected: _drop, ...rest } = el.attribs
      el.attribs = rest
    }
  }

  const attrs = convertAttrs(el, ctx.scope, inSvg, extra)
  if (VOID.has(lower) && !inSvg) return `<${tag}${attrs} />`
  const inner = convertChildren(children, { ...ctx, inSvg, textParent: lower })
  if (!inner.trim()) return `<${tag}${attrs} />`
  return `<${tag}${attrs}>\n${inner}\n</${tag}>`
}

// ---------- CSS scoping ----------

function splitTopLevel(input: string, sep: string): string[] {
  const out: string[] = []
  let depth = 0
  let cur = ''
  for (const ch of input) {
    if (ch === '(' || ch === '[') depth++
    else if (ch === ')' || ch === ']') depth--
    if (ch === sep && depth === 0) {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out
}

function scopeSelector(sel: string, scope: string): string {
  return splitTopLevel(sel, ',')
    .map((raw) => {
      const p = raw.trim()
      if (!p) return p
      if (p.includes('pgs-')) return p
      if (/^(html|body|:root)$/.test(p)) return `.${scope}`
      if (/^(html|body|:root)[\s>]/.test(p)) return p.replace(/^(html|body|:root)/, `.${scope}`)
      if (/^(html|body)\[/.test(p)) return p.replace(/^(html|body)/, `.${scope}`)
      return `:where(.${scope}) ${p}`
    })
    .join(',')
}

/** Scope every rule under .<scope>; leaves @keyframes and @font-face alone. */
function scopeCss(css: string, scope: string): string {
  let out = ''
  let i = 0
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '')
  while (i < src.length) {
    const open = src.indexOf('{', i)
    if (open < 0) {
      out += src.slice(i)
      break
    }
    const head = src.slice(i, open).trim()
    // find matching close
    let depth = 1
    let j = open + 1
    while (j < src.length && depth > 0) {
      if (src[j] === '{') depth++
      else if (src[j] === '}') depth--
      j++
    }
    const body = src.slice(open + 1, j - 1)
    if (
      head.startsWith('@media') ||
      head.startsWith('@supports') ||
      head.startsWith('@container') ||
      head.startsWith('@layer')
    ) {
      out += `${head}{${scopeCss(body, scope)}}\n`
    } else if (head.startsWith('@')) {
      out += `${head}{${body}}\n`
    } else {
      out += `${scopeSelector(head, scope)}{${body}}\n`
    }
    i = j
  }
  return out
}

// ---------- logic ----------

function convertLogic(js: string, name: string): string {
  let out = js.trim()
  if (!/class Component extends DCLogic/.test(out)) warnings.push(`${name}: no DCLogic class`)
  out = out.replace(
    /class Component extends DCLogic/,
    'export default class Component extends DCLogic',
  )
  // hash routes → real paths
  out = out.replace(/(['"`])#\//g, '$1/')
  let imports = "import { DCLogic } from '@/dc/runtime'\n"
  const shell = out.match(/\n( *)shell\(ar, role, active, site, crumbs\)\s*\{[\s\S]*?\n\1\}\n/)
  if (shell) {
    out = out.replace(
      shell[0],
      `\n${shell[1]}shell(ar, role, active, site, crumbs) {\n${shell[1]}  return shellHelper(ar, role, active, site, crumbs)\n${shell[1]}}\n`,
    )
    imports += "import { shellHelper } from '@/components/shell/shellHelper'\n"
  }
  if (/location\.hash/.test(out)) warnings.push(`${name}: uses location.hash`)
  return `// Ported verbatim from the Claude Design artboard ${name} (DCLogic class).\n// Runs on the DCLogic shim in src/dc/runtime.ts.\n${imports}\n${out}\n`
}

// ---------- main ----------

function convert(file: string, outDir: string) {
  const name = basename(file).replace(/\.dc\.html$/, '')
  current = name
  used.clear()
  const html = readFileSync(file, 'utf8')
  const xdcStart = html.indexOf('<x-dc>')
  const xdcEnd = html.lastIndexOf('</x-dc>')
  const xdc = html.slice(xdcStart + 6, xdcEnd)
  const helmet = xdc.match(/<helmet>([\s\S]*?)<\/helmet>/)?.[1] ?? ''
  const css = [...helmet.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')
  const markup = xdc.replace(/<helmet>[\s\S]*?<\/helmet>/, '')
  const script = html.match(
    /<script type="text\/x-dc"[^>]*data-dc-script[^>]*>([\s\S]*?)<\/script>/,
  )
  const propsAttr = html.match(/data-props='([^']*)'/)?.[1] ?? '{}'
  const meta = JSON.parse(propsAttr.replace(/&#39;/g, "'").replace(/&amp;/g, '&'))

  const doc = parseDocument(markup, {
    lowerCaseAttributeNames: false,
    lowerCaseTags: false,
    recognizeSelfClosing: true,
    decodeEntities: true,
  })
  const roots = doc.children.filter((c) => isTag(c) || (isText(c) && c.data.trim()))
  const ctx: Ctx = { scope: { loops: [] }, inSvg: false, shellDone: { v: false } }
  let jsx = convertChildren(roots as ChildNode[], ctx)
  const rootEl = roots.find(isTag) as Element | undefined
  const scopeCls = `pgs-${name}`
  if (!rootEl || !classOf(rootEl).includes(scopeCls))
    jsx = `<div className="${scopeCls}">\n${jsx}\n</div>`
  else if (roots.length > 1) jsx = `<>\n${jsx}\n</>`

  const imports: string[] = []
  if (used.has('Fragment')) imports.push("import { Fragment } from 'react'")
  if (used.has('AppShell')) imports.push("import { AppShell } from '@/components/shell/AppShell'")
  const rt = ['arr', 'noop', 's', 'sx'].filter((x) => used.has(x))
  if (rt.length)
    imports.push(`import { ${rt.map((x) => `${x} as $${x}`).join(', ')} } from '@/dc/runtime'`)

  const view = `// Generated by tools/dc2jsx.ts from the Claude Design artboard ${name}.
${imports.join('\n')}

// biome-ignore lint/suspicious/noExplicitAny: values come from the ported, untyped mockup logic
type V = any

export default function View({ v }: { v: V }) {
  return (
${jsx}
  )
}
`
  const dir = join(outDir, name)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'view.tsx'), view)
  writeFileSync(
    join(dir, 'style.css'),
    `/* Page CSS from the Claude Design artboard ${name}, scoped under .${scopeCls}. */\n${scopeCss(css, scopeCls)}`,
  )
  writeFileSync(join(dir, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`)
  if (script?.[1]) {
    writeFileSync(join(dir, 'logic.js'), convertLogic(script[1], name))
    writeFileSync(
      join(dir, 'logic.d.ts'),
      "import type { DCLogic } from '@/dc/runtime'\n\ndeclare const Logic: new (props: Record<string, unknown>) => DCLogic\nexport default Logic\n",
    )
  } else warnings.push(`${name}: no logic script`)
  const comp = name.replace(/[^A-Za-z0-9]/g, '')
  writeFileSync(
    join(dir, 'index.tsx'),
    `import { useDC } from '@/dc/runtime'
import Logic from './logic.js'
import View from './view'
import './style.css'

export default function ${/^\d/.test(comp) ? `P${comp}` : comp}Page(props: Record<string, unknown>) {
  const v = useDC(Logic, props)
  return <View v={v} />
}
`,
  )
  return { name, shell: ctx.shellDone.v }
}

const args = process.argv.slice(2)
force = args.includes('--force')
const [srcDir, outDir, ...only] = args.filter((a) => a !== '--force')
if (!srcDir || !outDir) {
  console.error('usage: bun run tools/dc2jsx.ts <export/project> <out pages dir> [Artboard ...]')
  process.exit(1)
}
const names = only.length ? only : []
const results = names.map((n) => convert(join(srcDir, `${n}.dc.html`), outDir))
for (const r of results) console.log(`converted ${r.name}${r.shell ? ' (AppShell)' : ''}`)
for (const f of skipped) console.log(`kept hand-edited ${f}`)
if (warnings.length) {
  console.log(`\n${warnings.length} warnings:`)
  for (const w of [...new Set(warnings)]) console.log(`  - ${w}`)
}
