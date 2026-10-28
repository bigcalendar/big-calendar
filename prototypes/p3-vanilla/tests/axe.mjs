// axe (WCAG 2.2 A/AA rules) on the prototype in all three engines, in normal
// and forced-colors modes, at 1280px and at 320 CSS px, across the key states.
import { chromium, firefox, webkit } from 'playwright'
import { readFileSync } from 'node:fs'
const axe = readFileSync('node_modules/axe-core/axe.min.js', 'utf8')
const pages = [
  '?view=month',
  '?view=week',
  '?view=week&date=2026-11-01',
  '?view=week&date=2026-03-08',
]
const total = {}
for (const [name, type] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await type.launch()
  for (const width of [1280, 320]) {
    for (const forced of ['none', 'active']) {
      const ctx = await browser.newContext({
        viewport: { width, height: 900 },
        forcedColors: forced,
        reducedMotion: 'reduce',
      })
      const page = await ctx.newPage()
      for (const q of pages) {
        await page.goto('http://localhost:4800/' + q)
        const states = [['initial', async () => {}]]
        if (q === '?view=month' && width === 1280) {
          states.push([
            'popover',
            async () => {
              await page.focus('[data-item="more:2026-10-28"]')
              await page.keyboard.press('Enter')
            },
          ])
          states.push([
            'menu',
            async () => {
              await page.keyboard.press('Escape')
              await page.focus('[data-item="standup"]')
              await page.keyboard.press('Shift+F10')
            },
          ])
          states.push([
            'moving',
            async () => {
              await page.keyboard.press('ArrowDown')
              await page.keyboard.press('Enter')
              await page.keyboard.press('ArrowRight')
            },
          ])
        }
        for (const [state, run] of states) {
          await run()
          await page.waitForTimeout(250)
          await page.addScriptTag({ content: axe })
          const r = await page.evaluate(async () => {
            const res = await axe.run(document, {
              runOnly: {
                type: 'tag',
                values: [
                  'wcag2a',
                  'wcag2aa',
                  'wcag21a',
                  'wcag21aa',
                  'wcag22aa',
                  'best-practice',
                ],
              },
            })
            return {
              violations: res.violations.map((v) => ({
                id: v.id,
                impact: v.impact,
                n: v.nodes.length,
                help: v.help,
                sample: v.nodes[0]?.target.join(' '),
              })),
              overflow: document.documentElement.scrollWidth > innerWidth + 1,
            }
          })
          const key = `${name} ${width}px forced=${forced} ${q} ${state}`
          for (const v of r.violations)
            (total[`${v.id} (${v.impact}): ${v.help}`] ??= []).push(
              `${key} ×${v.n} e.g. ${v.sample}`,
            )
          if (r.overflow) (total['page horizontal overflow'] ??= []).push(key)
        }
      }
      await ctx.close()
    }
  }
  await browser.close()
}
for (const [k, v] of Object.entries(total)) {
  console.log('##', k, `(${v.length} runs)`)
  for (const line of v.slice(0, 4)) console.log('   ', line)
}
if (!Object.keys(total).length) console.log('zero violations, no page overflow')
