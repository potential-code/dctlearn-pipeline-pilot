import { test as base, type Page } from '@playwright/test'
import { EMAILS, type Who } from './pages'

/** Starts a page with a demo session and a language, the way the app stores them. */
export async function prepare(page: Page, opts: { account?: Who; lang?: 'en' | 'ar' }) {
  await page.addInitScript(
    ({ email, lang }) => {
      if (email) window.localStorage.setItem('dct.session', email)
      else window.localStorage.removeItem('dct.session')
      window.localStorage.setItem('dct.lang', lang)
    },
    { email: opts.account ? EMAILS[opts.account] : '', lang: opts.lang ?? 'en' },
  )
}

/** Collects console errors, page errors and failed same-origin requests. */
export function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`)
  })
  page.on('response', (r) => {
    const url = new URL(r.url())
    if (url.host === 'localhost:5173' && r.status() >= 400)
      errors.push(`http ${r.status()}: ${url.pathname}`)
  })
  return errors
}

export const test = base
export { expect } from '@playwright/test'
