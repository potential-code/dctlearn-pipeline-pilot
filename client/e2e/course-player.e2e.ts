import type { Page } from '@playwright/test'
import { expect, prepare, test, watchErrors } from './fixtures'

/** On a phone the course menu sits behind a toggle. */
async function showMenu(page: Page, mobile: boolean) {
  if (mobile) await page.getByRole('button', { name: /Course content/ }).click()
  return page.getByRole('navigation', { name: 'Course content' })
}

/**
 * P16 course player (hand-built after the potential-template learning-module player). Mock data only:
 * DCT World (C01) has a pre-test, two modules (four units, 15 blocks), a unit check and a post-test.
 * Each test is a fresh page load, so the mock learner starts at its seed.
 */
const COURSE = '/employees/learn/dct-world'

test.describe('P16 course player', () => {
  test('course URL lands on the pending pre-test; modules are locked', async ({ page }, info) => {
    const errors = watchErrors(page)
    await prepare(page, { account: 'learner' })
    await page.goto(COURSE)
    await expect(page).toHaveURL(/\/learn\/dct-world\/pre-test$/)
    await expect(page.getByRole('heading', { level: 1, name: 'DCT World' })).toBeVisible()
    await expect(page.getByText('Your progress')).toBeVisible()
    const menu = await showMenu(page, info.project.name === 'mobile')
    await expect(menu.getByRole('link', { name: /DCT World pre-test/ })).toHaveAttribute(
      'aria-current',
      'step',
    )
    await expect(menu.getByText('Locked').first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'DCT World pre-test' })).toBeVisible()
    await expect(page.getByText('Attempts made')).toBeVisible()
    await expect(page.getByText(/Passing score:.*50%/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start assessment' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start the course' })).toBeDisabled()
    expect(errors).toEqual([])
  })

  test('after the pre-test the first block opens; Next is gated until the block is complete', async ({
    page,
  }, info) => {
    await prepare(page, { account: 'learner' })
    await page.goto(COURSE)
    await page.getByRole('button', { name: 'Start assessment' }).click()
    // 3 questions: choice, true/false, open text
    await page.getByRole('radio').first().check()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('radio').first().check()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('textbox').fill('I want to learn about our sectors')
    await page.getByRole('button', { name: 'Submit answers' }).click()
    await expect(page.getByText('Well done, you passed')).toBeVisible()
    await page.getByRole('link', { name: 'Start the course' }).click()
    await expect(page).toHaveURL(/\/u1\/b1$/)
    await expect(page.getByRole('heading', { name: 'DCT in three minutes' })).toBeVisible()
    const menu = await showMenu(page, info.project.name === 'mobile')
    await expect(menu.getByText('Locked').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Mark as complete' })).toBeDisabled()
    await page.getByRole('button', { name: 'Play video' }).click()
    await expect(page.getByText('Watched')).toBeVisible({ timeout: 8000 })
    await page.getByRole('button', { name: 'Mark as complete' }).click()
    await expect(page.getByRole('link', { name: 'Next' })).toBeVisible()
    await page.getByRole('link', { name: 'Next' }).click()
    await expect(page).toHaveURL(/\/u1\/b2$/)
    await page.getByRole('link', { name: 'Previous' }).click()
    await expect(page).toHaveURL(/\/u1\/b1$/)
  })

  test('deep links: unit, block, final check and complete keep working', async ({ page }) => {
    await prepare(page, { account: 'learner' })
    await page.goto(`${COURSE}/u3`)
    await expect(page).toHaveURL(/\/u3\/b1$/)
    await expect(page.getByRole('heading', { name: 'Cultural sites explorer' })).toBeVisible()
    await page.goto(`${COURSE}/u2/b3`)
    await expect(page.getByRole('heading', { name: 'Sector map' })).toBeVisible()
    await page.goto(`${COURSE}/final-check`)
    await expect(page.getByRole('heading', { name: 'DCT World final check' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start assessment' })).toBeVisible()
    await page.goto(`${COURSE}/complete`)
    await expect(page.getByText('Course complete')).toBeVisible()
    await page.goto(`${COURSE}?state=complete`)
    await expect(page).toHaveURL(/\/complete$/)
  })

  test('post-test and later units stay locked while earlier ones are open', async ({ page }) => {
    await prepare(page, { account: 'learner' })
    await page.goto(`${COURSE}?state=u2`)
    await expect(page).toHaveURL(/\/u2\/b1$/)
    await page.evaluate(() =>
      window.dispatchEvent(
        new CustomEvent('dct-nav', { detail: '/employees/learn/dct-world/final-check' }),
      ),
    )
    await expect(page.getByText('Complete every module to open the post-test.')).toBeVisible()
    await page.evaluate(() =>
      window.dispatchEvent(
        new CustomEvent('dct-nav', { detail: '/employees/learn/dct-world/u2/b3' }),
      ),
    )
    await expect(page.getByText('Complete the block before this one to open it.')).toBeVisible()
  })

  test('leaving a running assessment asks first (modal dialog)', async ({ page }) => {
    await prepare(page, { account: 'learner' })
    await page.goto(COURSE)
    await page.getByRole('button', { name: 'Start assessment' }).click()
    await page.getByRole('link', { name: 'All courses' }).click()
    const dlg = page.getByRole('dialog')
    await expect(dlg).toHaveAttribute('aria-modal', 'true')
    await expect(dlg).toContainText('Leave this attempt?')
    await page.keyboard.press('Escape')
    await expect(dlg).toHaveCount(0)
    await expect(page).toHaveURL(/\/pre-test$/)
  })

  test('failed final check shows attempts left, then a pass completes the course', async ({
    page,
  }) => {
    await prepare(page, { account: 'learner' })
    await page.goto(`${COURSE}/final-check`)
    const run = async (pick: 'first' | 'last') => {
      await page.getByRole('button', { name: /Start|Retake/ }).click()
      for (let n = 0; n < 4; n++) {
        const radios = page.getByRole('radio')
        await (pick === 'first' ? radios.first() : radios.last()).check()
        await page.getByRole('button', { name: 'Next' }).click()
      }
      await page.getByRole('textbox').fill('I welcome every visitor warmly')
      await page.getByRole('button', { name: 'Submit answers' }).click()
    }
    await run('last')
    await expect(page.getByText('Not quite. 1 attempt left')).toBeVisible()
    await page.getByRole('button', { name: 'Retake assessment' }).first().click()
    for (let n = 0; n < 4; n++) {
      await page.getByRole('radio').first().check()
      await page.getByRole('button', { name: 'Next' }).click()
    }
    await page.getByRole('textbox').fill('I welcome every visitor warmly')
    await page.getByRole('button', { name: 'Submit answers' }).click()
    await expect(page.getByText('Well done, you passed')).toBeVisible()
    await page.getByRole('link', { name: 'View your certificate' }).click()
    await expect(page).toHaveURL(/\/complete$/)
    await expect(page.getByText('+110')).toBeVisible()
  })

  test('Arabic: RTL, Western digits', async ({ page }) => {
    await prepare(page, { account: 'learner', lang: 'ar' })
    await page.goto(`${COURSE}/u2/b1`)
    await expect(page.locator('.ds').first()).toHaveAttribute('dir', 'rtl')
    await expect(page.getByRole('heading', { level: 1, name: 'عالم الدائرة' })).toBeVisible()
    const text = await page.locator('main').innerText()
    expect(text).not.toMatch(/[٠-٩]/)
  })

  test('phone: the course menu is a toggle above the content', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile', 'phone layout')
    await prepare(page, { account: 'learner' })
    await page.goto(`${COURSE}/u2/b1`)
    const menu = page.getByRole('navigation', { name: 'Course content' })
    await expect(menu).toBeHidden()
    await page.getByRole('button', { name: /Course content/ }).click()
    await expect(menu).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
})
