// Sequential-page run in Playwright's engines: native Temporal and forced polyfill.
import { spawn } from 'node:child_process'
import { chromium, firefox, webkit } from 'playwright'
import { rmSync, readFileSync } from 'node:fs'

const results = process.env.OUT ?? 'results-playwright.jsonl'
rmSync(results, { force: true })
let port = 4600
const runs = []
for (const [name, type] of Object.entries({ chromium, firefox, webkit })) {
  for (const mode of ['native', 'forced-polyfill']) {
    runs.push(
      (async () => {
        const p = ++port
        const server = spawn('node', ['server.mjs'], {
          env: {
            ...process.env,
            PORT: p,
            RESULTS: results,
            TAG: `${name}/${mode}`,
            REPEATS: '3',
            ONLY_NEXT: process.env.ONLY_NEXT ?? '',
          },
          stdio: 'ignore',
        })
        await new Promise((r) => setTimeout(r, 500))
        const browser = await type.launch()
        const page = await browser.newPage()
        if (mode === 'forced-polyfill')
          await page.addInitScript(() => {
            delete globalThis.Temporal
          })
        await page.goto(`http://localhost:${p}/seq/0`)
        await page.waitForURL(new RegExp(`seq/${process.env.END ?? 90}$`), {
          timeout: 600_000,
        })
        await page.waitForTimeout(300)
        console.log(name, mode, browser.version())
        await browser.close()
        server.kill()
      })(),
    )
  }
}
await Promise.all(runs)
