import { test } from '@playwright/test'

const BASE = 'http://localhost:6009'
const STORIES = [
  // Previously working
  'calendar-standard--standard',
  // Previously blank — now fixed
  'calendar-standard--scroll-to-time',
  'background-events-with-background-events--drag-and-drop-with-background-events',
  'drag-drop-drop-from-outside--drop-from-outside',
  'drag-drop-event-drag-drop--event-drag-and-drop',
  'drag-drop-event-drag-drop--locked-all-day-events',
  'resources-with-resources--with-resources-week',
  'resources-with-resources--with-resources-day',
  'resources-with-resources--with-resources-day-major',
  'calendar-custom-rendering--month-weekday',
  'calendar-custom-rendering--month-date-cell',
  'calendar-custom-rendering--month-event',
  'calendar-custom-rendering--time-day-heading',
  'calendar-custom-rendering--time-label',
  'calendar-custom-rendering--time-event',
  'calendar-custom-rendering--time-all-day-event',
  'calendar-custom-rendering--agenda-date',
  'calendar-custom-rendering--agenda-event',
  'calendar-custom-rendering--agenda-empty',
  'calendar-event-type-accessor--month-view-typed',
  'calendar-event-type-accessor--week-view-typed',
  'resources-resource-type-accessor--day-view',
  'resources-resource-type-accessor--week-view',
  'resources-resource-type-accessor--day-major-view',
]

for (const id of STORIES) {
  test(id, async ({ page }) => {
    const errors = []
    page.on('pageerror', err => errors.push('PAGEERROR: ' + err.message))
    page.on('console', msg => { if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text()) })

    await page.goto(`${BASE}/iframe.html?id=${id}&viewMode=story`)
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {})
    await page.waitForTimeout(3000)

    const info = await page.evaluate(() => {
      const root = document.querySelector('#storybook-root')
      if (!root) return { rootExists: false }
      const firstChild = root.firstElementChild
      if (!firstChild) return { rootExists: true, hasContent: false, childCount: 0 }
      const rect = firstChild.getBoundingClientRect()
      return {
        rootExists: true,
        hasContent: true,
        childCount: root.children.length,
        tag: firstChild.tagName.toLowerCase(),
        height: rect.height,
        display: window.getComputedStyle(firstChild).display,
      }
    })

    const bcComponents = await page.evaluate(() =>
      Array.from(document.querySelectorAll('bc-calendar-provider, bc-calendar, bc-month-view, bc-time-grid-view, bc-agenda-view'))
        .map(el => ({ tag: el.tagName.toLowerCase(), h: el.getBoundingClientRect().height }))
    )

    const renders = info.height > 0 && bcComponents.length > 0
    console.log(`\n${renders ? '✓' : '✗'} ${id}`)
    console.log('  root:', JSON.stringify(info))
    console.log('  bc-components:', bcComponents.slice(0, 3).map(c => `${c.tag}(h=${Math.round(c.h)})`).join(', '))
    if (errors.length) console.log('  errors:', errors.slice(0, 2))
  })
}
