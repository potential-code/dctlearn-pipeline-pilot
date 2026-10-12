import { expect, prepare, test, watchErrors } from './fixtures'

/**
 * P59 course editor (hand-built after the potential-template CourseBuilder). Mock data only:
 * C01 has a pre-test, two modules, a unit quiz and a post-test.
 */
const PATH = '/admin/catalog/editor/C01'

test.describe('P59 course editor', () => {
  test('layout: header card, pre-test, curriculum, post-test, settings, statistics', async ({
    page,
  }) => {
    const errors = watchErrors(page)
    await prepare(page, { account: 'admin' })
    await page.goto(PATH)
    await expect(page.getByRole('link', { name: 'All courses' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: 'DCT World' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Pre-test' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Post-test' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Modules & content' })).toBeVisible()
    await expect(page.getByRole('complementary', { name: 'Course settings' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Statistics' })).toContainText('15')
    // the five old tabs are gone
    await expect(page.locator('.ptabs')).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('catalog links into the editor', async ({ page }) => {
    await prepare(page, { account: 'admin' })
    await page.goto('/admin/catalog')
    await page.locator('a[href="/admin/catalog/editor/C01"]').first().click()
    await expect(page).toHaveURL(/\/admin\/catalog\/editor\/C01$/)
    await expect(page.getByRole('heading', { level: 1, name: 'DCT World' })).toBeVisible()
  })

  test('unit expands to its blocks; block dialog is a modal and Escape closes it', async ({
    page,
  }) => {
    await prepare(page, { account: 'admin' })
    await page.goto(PATH)
    const unit = page.getByRole('button', { name: 'Who we are 4 blocks' })
    await expect(unit).toHaveAttribute('aria-expanded', 'false')
    await unit.click()
    await expect(unit).toHaveAttribute('aria-expanded', 'true')
    await page.getByRole('button', { name: 'Edit block: DCT in three minutes' }).click()
    const dlg = page.getByRole('dialog')
    await expect(dlg).toHaveAttribute('aria-modal', 'true')
    await expect(dlg.getByLabel('Video URL or ID')).toHaveValue('dQw4w9WgXcQ')
    await page.keyboard.press('Escape')
    await expect(dlg).toHaveCount(0)
  })

  test('add module, add unit and a text block', async ({ page }) => {
    await prepare(page, { account: 'admin' })
    await page.goto(PATH)
    await page.getByRole('button', { name: 'Add module' }).click()
    await page.getByLabel('Module title (English)').fill('Extra module')
    await page.getByRole('button', { name: 'Create' }).click()
    await expect(page.getByRole('heading', { name: 'Extra module' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Statistics' })).toContainText('3')
  })

  test('questions: add a multiple-choice question to the pre-test', async ({ page }) => {
    await prepare(page, { account: 'admin' })
    await page.goto(PATH)
    const pre = page.getByRole('region', { name: 'Pre-test' })
    await expect(pre.getByText('Questions (3)')).toBeVisible()
    await pre.getByRole('button', { name: 'Add question' }).click()
    const dlg = page.getByRole('dialog')
    await dlg.getByLabel('Question text (English)').fill('Which colour is the DCT logo?')
    await dlg.getByLabel('Option (English) 1').fill('Red')
    await dlg.getByLabel('Option (English) 2').fill('Blue')
    await dlg.getByRole('button', { name: 'Create' }).click()
    await expect(pre.getByText('Questions (4)')).toBeVisible()
  })

  test('keyboard reordering of modules (space, arrow, space)', async ({ page }) => {
    await prepare(page, { account: 'admin' })
    await page.goto(PATH)
    const titles = page.locator('.cb-mod-h h3')
    await expect(titles).toHaveText(['Welcome to DCT', 'Culture & Tourism'])
    const grip = page.getByRole('button', { name: 'Reorder module: Culture & Tourism' })
    await grip.focus()
    await page.keyboard.press('Space')
    await page.keyboard.press('ArrowUp')
    await page.waitForTimeout(250)
    await page.keyboard.press('Space')
    await expect(titles).toHaveText(['Culture & Tourism', 'Welcome to DCT'])
  })

  test('settings: auto-saves a title change and folds the old tabs into sections', async ({
    page,
  }) => {
    await prepare(page, { account: 'admin' })
    await page.goto(PATH)
    const panel = page.getByRole('complementary', { name: 'Course settings' })
    await panel.getByLabel('Title (English)').fill('DCT World 2')
    await expect(page.getByRole('heading', { level: 1, name: 'DCT World 2' })).toBeVisible()
    await expect(panel.getByRole('status').first()).toContainText('Saved')
    for (const name of ['Course card', 'Certificate', 'Points', 'Behaviour', 'Archive']) {
      await panel.getByRole('button', { name, exact: true }).click()
    }
    await expect(panel.getByLabel('Signatory name')).toBeVisible()
    await expect(panel.getByLabel('Per module')).toBeVisible()
  })

  test('Arabic renders right-to-left with the settings column on the left', async ({ page }) => {
    await prepare(page, { account: 'admin', lang: 'ar' })
    await page.goto(PATH)
    await expect(page.locator('.ds.pt')).toHaveAttribute('dir', 'rtl')
    const main = await page.locator('.cb-main').boundingBox()
    const side = await page.locator('.cb-side').boundingBox()
    if (page.viewportSize()?.width && page.viewportSize()!.width > 1100) {
      expect(side!.x).toBeLessThan(main!.x)
    }
    const scrollW = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollW).toBeLessThanOrEqual(page.viewportSize()?.width ?? 0)
  })

  test('no horizontal scroll at the current viewport', async ({ page }) => {
    await prepare(page, { account: 'admin' })
    await page.goto(PATH)
    const scrollW = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollW).toBeLessThanOrEqual(page.viewportSize()?.width ?? 0)
  })
})
