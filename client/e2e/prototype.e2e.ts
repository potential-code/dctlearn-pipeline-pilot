import { expect, prepare, test, watchErrors } from './fixtures'

/** Replays the canvas's clickable prototype: Home → Sign in → demo account → portal. */
const DEMO = [
  { name: 'Saeed Al Hammadi', url: /\/platforms$/, check: 'Choose your learning hub' },
  { name: 'Dr. Hessa Al Nuaimi', url: /\/mentor$/, check: 'Dr. Hessa Al Nuaimi' },
  { name: 'Noura Al Kaabi', url: /\/judge$/, check: 'Noura Al Kaabi' },
  { name: 'Layla Haddad', url: /\/elevate\/admin$/, check: 'Layla Haddad' },
  { name: 'Aisha Al Marzouqi', url: /\/admin$/, check: 'Aisha Al Marzouqi' },
]

test.describe('clickable prototype', () => {
  for (const d of DEMO) {
    test(`Home → sign in → ${d.name}`, async ({ page }, info) => {
      test.skip(info.project.name === 'mobile', 'desktop flow')
      const errors = watchErrors(page)
      await prepare(page, {})
      await page.goto('/')
      await page.locator('a[href="/login"]').first().click()
      await expect(page).toHaveURL(/\/login$/)
      await page.getByRole('button', { name: new RegExp(d.name) }).click()
      await expect(page).toHaveURL(d.url, { timeout: 10_000 })
      await expect(page.getByText(d.check).first()).toBeVisible()
      expect(errors, errors.join('\n')).toEqual([])
    })
  }

  test('learner: hub picker → dashboard → courses → course', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'desktop flow')
    await prepare(page, { account: 'learner' })
    await page.goto('/platforms')
    await page.locator('a[href="/employees/dashboard"]').first().click()
    await expect(page).toHaveURL(/\/employees\/dashboard$/)
    await page.locator('.sb a[href="/employees/hub/courses"]').click()
    await expect(page).toHaveURL(/\/employees\/hub\/courses$/)
    await expect(page.locator('.sb a.ni.on')).toContainText('Courses')
  })

  test('language toggle flips direction and persists across pages', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'desktop flow')
    await prepare(page, { account: 'learner' })
    await page.goto('/employees/dashboard')
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
    await page.locator('.topb button.tl').click()
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('.ds').first()).toHaveAttribute('dir', 'rtl')
    await page.locator('.sb a[href="/employees/achievements"]').click()
    await expect(page).toHaveURL(/achievements$/)
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await page.locator('.proto-sw button', { hasText: 'EN' }).click()
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
  })

  test('user menu opens, closes on Escape and outside click', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'desktop flow')
    await prepare(page, { account: 'admin' })
    await page.goto('/admin')
    const menu = page.locator('details.me-d')
    await menu.locator('summary').click()
    await expect(menu).toHaveAttribute('open', '')
    await page.keyboard.press('Escape')
    await expect(menu).not.toHaveAttribute('open', '')
    await menu.locator('summary').click()
    await page
      .locator('main')
      .first()
      .click({ position: { x: 5, y: 5 } })
    await expect(menu).not.toHaveAttribute('open', '')
  })

  test('switch account pill returns to sign in', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'desktop flow')
    await prepare(page, { account: 'mentor' })
    await page.goto('/mentor')
    await page.locator('.proto-sw a[href="/login"]').click()
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByText('Demo accounts')).toBeVisible()
  })
})

test.describe('intro transition (full motion)', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } })
  test('intro overlay clears and the page stays clickable', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'desktop flow')
    await prepare(page, {})
    await page.goto('/')
    await expect(page.locator('.ptx')).toHaveClass('ptx ', { timeout: 5_000 })
    await page.locator('a[href="/login"]').first().click()
    await expect(page).toHaveURL(/\/login$/)
  })
})

test.describe('guards and redirects', () => {
  test('signed-out visit to a portal goes to sign in', async ({ page }) => {
    await prepare(page, {})
    await page.goto('/admin/users')
    await expect(page).toHaveURL(/\/login\?next=/)
  })
  test('wrong role goes to its own home', async ({ page }) => {
    await prepare(page, { account: 'judge' })
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/judge$/)
  })
  test('microsite sign-in alias and landing-only redirect', async ({ page }) => {
    await prepare(page, {})
    await page.goto('/elevate/sign-in')
    await expect(page).toHaveURL(/\/elevate\/login$/)
    await page.goto('/ruwaad/dashboard')
    await expect(page).toHaveURL(/\/ruwaad$/)
  })
  test('unknown path renders the not-found page', async ({ page }) => {
    await prepare(page, {})
    await page.goto('/no-such-programme/xyz')
    await expect(page.locator('.pgs-P05-NotFound')).toBeVisible()
  })
})

test.describe('mobile sheet navigation', () => {
  test('menu button opens the sidebar sheet, scrim and navigation close it', async ({
    page,
  }, info) => {
    test.skip(info.project.name !== 'mobile', 'mobile only')
    await prepare(page, { account: 'learner' })
    await page.goto('/employees/dashboard')
    const cb = page.locator('#dct-nav-cb')
    await page.locator('.topb .navbtn').click()
    await expect(cb).toBeChecked()
    await expect(page.locator('.sb')).toBeInViewport()
    await page.locator('.sb-scrim').click({ position: { x: 360, y: 400 } })
    await expect(cb).not.toBeChecked()
    await page.locator('.topb .navbtn').click()
    await page.locator('.sb a[href="/employees/profile"]').click()
    await expect(page).toHaveURL(/profile$/)
    await expect(cb).not.toBeChecked()
  })
})

test.describe('page interactions', () => {
  test('P35 landing editor: save draft, publish', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'desktop flow')
    const errors = watchErrors(page)
    await prepare(page, { account: 'subadmin' })
    await page.goto('/elevate/admin?screen=edited')
    await page.getByRole('button', { name: 'Save draft' }).click()
    await expect(
      page.getByText('Draft saved. Visitors still see the published version.'),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Publish changes' }).first().click()
    const dlg = page.getByRole('dialog')
    await expect(dlg).toBeVisible()
    await dlg.locator('.btn-primary').click()
    await expect(page.getByText('Landing published · recorded in the audit log')).toBeVisible()
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('P40 members: open invite dialog', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'desktop flow')
    await prepare(page, { account: 'subadmin' })
    await page.goto('/elevate/admin/members')
    await page
      .getByRole('button', { name: /invite/i })
      .first()
      .click()
    await expect(page.getByRole('dialog').first()).toBeVisible()
  })

  test('P59 course editor: switch tabs', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'desktop flow')
    await prepare(page, { account: 'admin' })
    await page.goto('/admin/catalog/editor/C01')
    const tab = page.locator('.ptabs .ptab', { hasText: 'Certificate' })
    await tab.click()
    await expect(tab).toHaveAttribute('aria-current', 'page')
  })
})
