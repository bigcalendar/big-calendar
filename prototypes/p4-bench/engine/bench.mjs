// Timings under the D-44 profile: Chromium 4× CPU slowdown; WebKit and Firefox unthrottled.
// Each configuration runs in a fresh page: one cold run, one warm-up, then 10 measured runs (median).
// Usage: node engine/bench.mjs [engines...]  → engine/results.json
import { chromium, firefox, webkit } from 'playwright'
import { writeFile, readFile } from 'node:fs/promises'
import { serve } from '../serve.mjs'

const want = process.argv.slice(2)
const engines = Object.entries({ chromium, webkit, firefox }).filter(
  ([n]) => !want.length || want.includes(n),
)
const { url, close } = await serve()
const median = (a) => {
  const s = [...a].sort((x, y) => x - y)
  return (s[4] + s[5]) / 2
}
let results = {}
try {
  results = JSON.parse(
    await readFile(new URL('./results.json', import.meta.url)),
  )
} catch {}

for (const [ename, engine] of engines) {
  const browser = await engine.launch()
  for (const impl of ['native', 'tp', 'js']) {
    for (const order of ['temporal', 'bigint', 'number']) {
      for (const [scenario, spread] of [
        ['year', 365],
        ['dense', 42],
      ]) {
        for (const view of ['week', 'month']) {
          const page = await browser.newPage()
          if (impl !== 'native')
            await page.addInitScript(() => {
              delete globalThis.Temporal
            })
          if (ename === 'chromium') {
            const cdp = await page.context().newCDPSession(page)
            await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
          }
          await page.goto(`${url}/temporal/blank.html`)
          const r = await page.evaluate(
            async ({ src, order, spread, view }) => {
              const m = await import(src)
              const raw = m.makeEvents(5000, 1, spread)
              const strip = ({ ingest, view, total }) => ({
                ingest,
                view,
                total,
              })
              const cold = strip(m.runOnce(m.T, order, raw, view))
              m.runOnce(m.T, order, raw, view)
              const runs = []
              for (let i = 0; i < 10; i++)
                runs.push(strip(m.runOnce(m.T, order, raw, view)))
              return { cold, runs }
            },
            { src: `${url}/engine/dist/${impl}.js`, order, spread, view },
          )
          await page.close()
          const k = `${ename}/${impl}/${order}/${scenario}/${view}`
          results[k] = {
            cold: r.cold,
            median: {
              ingest: median(r.runs.map((x) => x.ingest)),
              view: median(r.runs.map((x) => x.view)),
              total: median(r.runs.map((x) => x.total)),
            },
          }
          console.log(
            k.padEnd(42),
            'median total',
            results[k].median.total.toFixed(1),
            'ms (ingest',
            results[k].median.ingest.toFixed(1),
            'view',
            results[k].median.view.toFixed(1) + ')',
            'cold',
            r.cold.total.toFixed(1),
          )
        }
      }
    }
  }
  await browser.close()
}
close()
await writeFile(
  new URL('./results.json', import.meta.url),
  JSON.stringify(results, null, 1),
)
