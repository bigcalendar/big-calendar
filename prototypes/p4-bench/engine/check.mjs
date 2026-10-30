// Sanity: every implementation and ordering produces identical layouts.
import { chromium } from 'playwright'
import { serve } from '../serve.mjs'
const { url, close } = await serve()
const b = await chromium.launch()
const p = await b.newPage()
await p.goto(`${url}/temporal/blank.html`)
const r = await p.evaluate(async (url) => {
  const res = {}
  for (const impl of ['native', 'tp', 'js']) {
    const m = await import(`${url}/engine/dist/${impl}.js`)
    const raw = m.makeEvents()
    for (const order of ['temporal', 'bigint', 'number'])
      for (const view of ['week', 'month'])
        res[`${impl}/${order}/${view}`] = JSON.stringify(
          m.runOnce(m.T, order, raw, view).out,
        )
  }
  return res
}, url)
const ref = {
  week: r['native/temporal/week'],
  month: r['native/temporal/month'],
}
for (const [k, v] of Object.entries(r))
  console.log(k, v === ref[k.split('/')[2]] ? 'same' : 'DIFFERENT', v.length)
const w = JSON.parse(ref.week)
console.log(
  'week segments',
  w.placed.map((c) => c.length),
  'allDay shown',
  w.allDay.shown.length,
)
const mo = JSON.parse(ref.month)
console.log(
  'month shown per row',
  mo.map((x) => x.shown.length),
  'more',
  mo.map((x) => x.more.join('')),
)
await b.close()
close()
