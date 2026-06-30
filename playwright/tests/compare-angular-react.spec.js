/**
 * Cross-framework visual comparison: React (6006) vs Angular (6009).
 *
 * Each test loads the same story ID from both Storybooksand saves named
 * snapshots. On first run Playwright writes baselines; on subsequent runs
 * it diffs against them.
 *
 * Run with both servers already started:
 *   pnpm exec playwright test --config playwright/playwright.config.js --project=compare compare-angular-react
 */
import { test, expect } from '@playwright/test'
import { loadStory, settleAnimations } from '../helpers/storybook.js'

const REACT_BASE = 'http://localhost:6006'
const ANGULAR_BASE = 'http://localhost:6009'

const STABLE_STYLE = `
  .bc-now-indicator { display: none !important; }
  * { animation-duration: 0s !important; transition-duration: 0s !important; }
`

const SHARED_STORIES = [
  ['calendar-standard--standard', 'Calendar / Standard'],
  ['calendar-custom-rendering--month-weekday', 'Custom Rendering / MonthWeekday'],
  ['calendar-custom-rendering--month-date-cell', 'Custom Rendering / MonthDateCell'],
  ['calendar-custom-rendering--month-event', 'Custom Rendering / MonthEvent'],
  ['events-event-callbacks--event-callbacks', 'Events / EventCallbacks'],
  ['background-events-with-background-events--with-background-events', 'Background Events / WithBackgroundEvents'],
  ['resources-with-resources--with-resources', 'Resources / WithResources'],
  ['selection-selectable--selectable', 'Selection / Selectable'],
]

for (const [storyId, label] of SHARED_STORIES) {
  test(`[React]   ${label}`, async ({ page }) => {
    await page.goto(`${REACT_BASE}/iframe.html?id=${storyId}&viewMode=story`)
    await page.waitForSelector('.bc-calendar', { state: 'visible', timeout: 15_000 })
    await settleAnimations(page)
    await page.addStyleTag({ content: STABLE_STYLE })
    await page.waitForTimeout(500)
    await expect(page).toHaveScreenshot(`react-ar-${storyId}.png`, { fullPage: false })
  })

  test(`[Angular] ${label}`, async ({ page }) => {
    await page.goto(`${ANGULAR_BASE}/iframe.html?id=${storyId}&viewMode=story`)
    // Some Angular stories render view components directly (no .bc-calendar wrapper)
    await page.waitForSelector('.bc-calendar, .bc-month, .bc-time-grid-view, .bc-agenda', { state: 'visible', timeout: 20_000 })
    await settleAnimations(page)
    await page.addStyleTag({ content: STABLE_STYLE })
    await page.waitForTimeout(500)
    await expect(page).toHaveScreenshot(`angular-ar-${storyId}.png`, { fullPage: false })
  })
}
