/**
 * Cross-framework visual comparison: React (6006) vs Vue (6008).
 *
 * Each test loads the same story ID from both Storybooks, takes a screenshot
 * of each, and saves them as named snapshots. On the first run Playwright
 * writes the baseline images; on subsequent runs it diffs against them.
 *
 * Run with:
 *   pnpm exec playwright test --config playwright/playwright.config.js
 *
 * To update baselines after an intentional change:
 *   pnpm exec playwright test --config playwright/playwright.config.js --update-snapshots
 */
import { test, expect } from '@playwright/test'
import { settleAnimations } from '../helpers/storybook.js'

const REACT_BASE = 'http://localhost:6006'
const VUE_BASE = 'http://localhost:6008'

/**
 * Stories that exist identically in both React and Vue Storybooks.
 * Format: [storyId, label]
 */
const SHARED_STORIES = [
  ['calendar-standard--standard', 'Calendar / Standard'],
  ['calendar-custom-rendering--month-weekday', 'Custom Rendering / MonthWeekday'],
  ['calendar-custom-rendering--month-date-cell', 'Custom Rendering / MonthDateCell'],
  ['calendar-custom-rendering--month-event', 'Custom Rendering / MonthEvent'],
  ['calendar-custom-rendering--month-show-more', 'Custom Rendering / MonthShowMore'],
  ['calendar-custom-rendering--time-day-heading', 'Custom Rendering / TimeDayHeading'],
  ['background-events-with-background-events--with-background-events', 'Background Events / WithBackgroundEvents'],
  ['background-events-with-background-events--selectable-with-background-events', 'Background Events / SelectableWithBgEvents'],
  ['background-events-with-background-events--drag-and-drop-with-background-events', 'Background Events / DnDWithBgEvents'],
  ['events-event-callbacks--event-callbacks', 'Events / EventCallbacks'],
  ['drag-drop-event-drag-drop--event-drag-and-drop', 'DnD / EventDragAndDrop'],
  ['drag-drop-drop-from-outside--drop-from-outside', 'DnD / DropFromOutside'],
  ['resources-with-resources--with-resources', 'Resources / WithResources'],
  ['selection-selectable--selectable', 'Selection / Selectable'],
]

for (const [storyId, label] of SHARED_STORIES) {
  test(`[React] ${label}`, async ({ page }) => {
    await page.goto(`${REACT_BASE}/iframe.html?id=${storyId}&viewMode=story`)
    await page.waitForSelector('.bc-calendar', { state: 'visible', timeout: 15_000 })
    await settleAnimations(page)
    // Hide the now-indicator for stable snapshots (position is time-dependent)
    await page.addStyleTag({ content: '.bc-now-indicator { display: none !important; }' })
    await expect(page).toHaveScreenshot(`react-${storyId}.png`, { fullPage: false })
  })

  test(`[Vue]   ${label}`, async ({ page }) => {
    await page.goto(`${VUE_BASE}/iframe.html?id=${storyId}&viewMode=story`)
    await page.waitForSelector('.bc-calendar', { state: 'visible', timeout: 15_000 })
    await settleAnimations(page)
    await page.addStyleTag({ content: '.bc-now-indicator { display: none !important; }' })
    await expect(page).toHaveScreenshot(`vue-${storyId}.png`, { fullPage: false })
  })
}
