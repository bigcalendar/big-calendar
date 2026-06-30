/**
 * Storybook iframe helpers for big-calendar Playwright tests.
 *
 * Story IDs follow Storybook 8's URL-slug format:
 *   title 'Calendar/Standard' + story 'Standard'
 *   → 'calendar-standard--standard'
 *
 * Verify live IDs via the Storybook index:
 *   http://localhost:6006/index.json  (React)
 *   http://localhost:6008/index.json  (Vue)
 */

/**
 * Navigate to a story iframe (bypasses Storybook chrome for a clean DOM).
 * @param {import('@playwright/test').Page} page
 * @param {string} storyId
 */
export async function gotoStory(page, storyId) {
  await page.goto(`/iframe.html?id=${storyId}&viewMode=story`)
}

/**
 * Wait for the big-calendar root element to appear.
 * @param {import('@playwright/test').Page} page
 */
export async function waitForCalendar(page) {
  await page.waitForSelector('.bc-calendar', { state: 'visible', timeout: 15_000 })
}

/**
 * Navigate to a story and wait for the calendar to render.
 * @param {import('@playwright/test').Page} page
 * @param {string} storyId
 */
export async function loadStory(page, storyId) {
  await gotoStory(page, storyId)
  await waitForCalendar(page)
}

/**
 * Wait for any in-flight animations / transitions to settle before screenshotting.
 * @param {import('@playwright/test').Page} page
 */
export async function settleAnimations(page) {
  // Disable CSS transitions/animations so screenshots are stable
  await page.addStyleTag({
    content: `*, *::before, *::after {
      animation-duration: 0s !important;
      transition-duration: 0s !important;
    }`,
  })
}
