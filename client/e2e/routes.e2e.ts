import { mkdirSync } from 'node:fs'
import { expect, prepare, test, watchErrors } from './fixtures'
import { PAGES } from './pages'

mkdirSync('e2e/.out/screens', { recursive: true })

for (const entry of PAGES) {
  for (const lang of ['en', 'ar'] as const) {
    test(`${entry.artboard} ${lang}`, async ({ page }, info) => {
      const errors = watchErrors(page)
      await prepare(page, { account: entry.account, lang })
      await page.goto(entry.path)
      await page.waitForLoadState('networkidle')
      await expect(page.locator('.ds').first()).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
      const suffix = `${lang === 'ar' ? '-AR' : ''}${info.project.name === 'mobile' ? '-m' : ''}`
      await page.screenshot({
        path: `e2e/.out/screens/${entry.artboard}${suffix}.png`,
        fullPage: true,
        animations: 'disabled',
      })
      expect(errors, errors.join('\n')).toEqual([])
    })
  }
}
