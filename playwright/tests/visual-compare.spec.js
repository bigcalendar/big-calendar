import { test } from '@playwright/test'

test('angular-month-grid-chain', async ({ page }) => {
  await page.goto('http://localhost:6009/iframe.html?id=calendar-standard--standard&viewMode=story')
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(2000)

  const chain = await page.evaluate(() => {
    const grid = document.querySelector('.bc-month-grid')
    if (!grid) return []
    const result = []
    let el = grid
    for (let i = 0; i < 6; i++) {
      const style = window.getComputedStyle(el)
      result.push({
        tag: el.tagName,
        cls: el.className?.toString()?.substring(0, 60) || '',
        height: el.getBoundingClientRect().height,
        display: style.display,
        blockSize: style.blockSize,
        minBlockSize: style.minBlockSize,
        overflow: style.overflow,
        gridTemplateRows: style.gridTemplateRows?.substring(0, 50),
      })
      if (!el.parentElement) break
      el = el.parentElement
    }
    return result
  })
  console.log('ANGULAR-MONTH-GRID-CHAIN:', JSON.stringify(chain, null, 2))
})
