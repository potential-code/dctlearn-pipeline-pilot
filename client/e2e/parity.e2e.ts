import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { expect, prepare, test } from './fixtures'
import { PAGES } from './pages'

/**
 * Parity with the artboard code: the React page must contain every text run and the same number
 * of elements per class as the original artboard template rendered with the same props
 * (fixtures from tools/parity.ts). The shared app shell is excluded on both sides.
 */
type Fixture = { text: string[]; classes: Record<string, number> } | { error: string }

mkdirSync('e2e/.out/parity', { recursive: true })

for (const entry of PAGES) {
  for (const lang of ['en', 'ar'] as const) {
    test(`${entry.artboard} ${lang}`, async ({ page }, info) => {
      test.skip(info.project.name === 'mobile', 'content parity is viewport independent')
      const fx = JSON.parse(readFileSync(`e2e/fixtures/${entry.artboard}.expected.json`, 'utf8'))[
        lang
      ] as Fixture
      test.skip('error' in fx, 'artboard logic could not be evaluated')
      if ('error' in fx) return
      const root = `.pgs-${entry.source ?? entry.artboard}`
      await prepare(page, { account: entry.account, lang })
      await page.goto(entry.path, { waitUntil: 'domcontentloaded' })
      await page.waitForSelector(root)
      const dom = await page.evaluate(
        ({ root, classes }) => {
          const el = document.querySelector(root)
          if (!el) return { text: '', counts: {} as Record<string, number> }
          const skip = (n: Node) =>
            !!n.parentElement?.closest(
              '.app aside.sb, .app header.topb, .proto-sw, .ptx, style, script, textarea, select',
            )
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
          let text = ''
          for (let n = walker.nextNode(); n; n = walker.nextNode())
            if (!skip(n)) text += n.nodeValue ?? ''
          const counts: Record<string, number> = {}
          for (const c of classes) {
            counts[c] = [...el.querySelectorAll(`.${CSS.escape(c)}`)].filter(
              (x) => !x.closest('.app aside.sb, .app header.topb') && x !== el,
            ).length
          }
          return { text: text.replace(/\s+/g, ' '), counts }
        },
        { root, classes: Object.keys(fx.classes) },
      )
      const norm = (s: string) => s.replace(/\s+/g, ' ').trim()
      const missingText = fx.text.filter((t) => !dom.text.includes(norm(t)))
      const classDiff = Object.entries(fx.classes)
        .filter(([c, n]) => dom.counts[c] !== n && c !== root.slice(1))
        .map(([c, n]) => `${c}: expected ${n}, got ${dom.counts[c] ?? 0}`)
      writeFileSync(
        `e2e/.out/parity/${entry.artboard}-${lang}.json`,
        JSON.stringify(
          {
            artboard: entry.artboard,
            lang,
            texts: fx.text.length,
            classes: Object.keys(fx.classes).length,
            missingText,
            classDiff,
          },
          null,
          1,
        ),
      )
      expect(missingText, `missing text:\n${missingText.join('\n')}`).toEqual([])
      expect(classDiff, `class count differences:\n${classDiff.join('\n')}`).toEqual([])
    })
  }
}
