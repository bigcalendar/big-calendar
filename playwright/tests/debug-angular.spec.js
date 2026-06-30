import { test } from '@playwright/test'
test('debug angular standard', async ({ page }) => {
  await page.goto('http://localhost:6009/iframe.html?id=calendar-standard--standard&viewMode=story')
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
  await page.waitForTimeout(5000)
  const info = await page.evaluate(() => ({
    title: document.title,
    bodySnip: document.body.innerHTML.substring(0, 600),
    hasBcCalendarDiv: !!document.querySelector('div.bc-calendar'),
    hasBcCalendarEl: !!document.querySelector('bc-calendar'),
    hasCalendarProvider: !!document.querySelector('bc-calendar-provider'),
  }))
  console.log('DEBUG:', JSON.stringify(info, null, 2))
  await page.screenshot({ path: '/tmp/angular-debug.png' })
})
