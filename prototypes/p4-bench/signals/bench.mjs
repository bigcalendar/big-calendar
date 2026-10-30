// Signals timings: Chromium 4× CPU slowdown, WebKit and Firefox unthrottled, and Node.
// Fresh page per library; one warm-up, then 10 runs; medians. Also heap in Node.
import { chromium, firefox, webkit } from 'playwright'
import { writeFile } from 'node:fs/promises'
import { serve } from '../serve.mjs'
const { url, close } = await serve()
const med = (a) => { const s = [...a].sort((x, y) => x - y); return (s[4] + s[5]) / 2 }
const summarize = (runs) => Object.fromEntries(Object.keys(runs[0]).map((k) => [k, +med(runs.map((r) => r[k])).toFixed(2)]))
const out = {}
for (const [ename, engine] of Object.entries({ chromium, webkit, firefox })) {
  const b = await engine.launch()
  for (const lib of ['alien', 'preact']) {
    const p = await b.newPage()
    if (ename === 'chromium') await (await p.context().newCDPSession(p)).send('Emulation.setCPUThrottlingRate', { rate: 4 })
    await p.goto(`${url}/temporal/blank.html`)
    const runs = await p.evaluate(async (src) => { const m = await import(src); m.runSignals(m.F); const rs = []; for (let i = 0; i < 10; i++) rs.push(m.runSignals(m.F)); return rs }, `${url}/signals/dist/${lib}.js`)
    out[`${ename}/${lib}`] = summarize(runs)
    console.log(`${ename}/${lib}`.padEnd(18), JSON.stringify(out[`${ename}/${lib}`]))
    await p.close()
  }
  await b.close()
}
close()
for (const lib of ['alien', 'preact']) {
  const m = await import(`./dist/${lib}.js`)
  m.runSignals(m.F)
  const rs = []; for (let i = 0; i < 10; i++) rs.push(m.runSignals(m.F))
  out[`node/${lib}`] = summarize(rs)
  console.log(`node/${lib}`.padEnd(18), JSON.stringify(out[`node/${lib}`]))
}
await writeFile(new URL('./results.json', import.meta.url), JSON.stringify(out, null, 1))
