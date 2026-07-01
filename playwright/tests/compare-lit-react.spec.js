/**
 * Cross-framework visual comparison: React (6006) vs Lit (6010).
 *
 * Each test loads the same story ID from both Storybooks and saves named
 * snapshots. On first run Playwright writes baselines; on subsequent runs
 * it diffs against them.
 *
 * Run with both servers already started:
 *   pnpm exec playwright test --config playwright/playwright.config.js --project=compare compare-lit-react
 */
import { test, expect } from '@playwright/test'
import { settleAnimations } from '../helpers/storybook.js'

const REACT_BASE = 'http://localhost:6006'
const LIT_BASE = 'http://localhost:6010'

const STABLE_STYLE = `
  .bc-now-indicator { display: none !important; }
  * { animation-duration: 0s !important; transition-duration: 0s !important; }
`

const SHARED_STORIES = [
  ['calendar-standard--standard', 'Calendar / Standard'],
  ['events-event-callbacks--event-callbacks', 'Events / EventCallbacks'],
  ['background-events-with-background-events--with-background-events', 'Background Events / WithBackgroundEvents'],
  ['resources-with-resources--with-resources', 'Resources / WithResources'],
  ['selection-selectable--selectable', 'Selection / Selectable'],
  ['drag-drop-event-drag-drop--event-drag-drop', 'Drag & Drop / EventDragDrop'],
]

for (const [storyId, label] of SHARED_STORIES) {
  test(`[React] ${label}`, async ({ page }) => {
    await page.goto(`${REACT_BASE}/iframe.html?id=${storyId}&viewMode=story`)
    await page.waitForSelector('.bc-calendar', { state: 'visible', timeout: 15_000 })
    await settleAnimations(page)
    await page.addStyleTag({ content: STABLE_STYLE })
    await page.waitForTimeout(500)
    await expect(page).toHaveScreenshot(`react-lr-${storyId}.png`, { fullPage: false })
  })

  test(`[Lit]   ${label}`, async ({ page }) => {
    await page.goto(`${LIT_BASE}/iframe.html?id=${storyId}&viewMode=story`)
    await page.waitForSelector('.bc-calendar', { state: 'visible', timeout: 20_000 })
    await settleAnimations(page)
    await page.addStyleTag({ content: STABLE_STYLE })
    await page.waitForTimeout(500)
    await expect(page).toHaveScreenshot(`lit-lr-${storyId}.png`, { fullPage: false })
  })
}
