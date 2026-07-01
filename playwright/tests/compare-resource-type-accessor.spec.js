/**
 * Visual comparison: React vs Vue for Resource Type Accessor stories.
 * Captures screenshots from both Storybooks so divergences are visible
 * as side-by-side PNG files in the snapshots directory.
 */
import { test, expect } from '@playwright/test'
import { settleAnimations } from '../helpers/storybook.js'

const REACT_BASE = 'http://localhost:6006'
const VUE_BASE = 'http://localhost:6008'

const STORIES = [
  ['resources-resource-type-accessor--day-view',      'ResourceTypeAccessor / DayView'],
  ['resources-resource-type-accessor--week-view',     'ResourceTypeAccessor / WeekView'],
  ['resources-resource-type-accessor--day-major-view','ResourceTypeAccessor / DayMajorView'],
]

for (const [storyId, label] of STORIES) {
  test(`[React] ${label}`, async ({ page }) => {
    await page.goto(`${REACT_BASE}/iframe.html?id=${storyId}&viewMode=story`)
    await page.waitForSelector('.bc-calendar', { state: 'visible', timeout: 15_000 })
    await settleAnimations(page)
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
