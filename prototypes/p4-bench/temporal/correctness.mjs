// Run the corpus in each engine with each implementation; native is the reference.
// Usage: node temporal/correctness.mjs  → writes temporal/correctness.json and prints a summary.
import { chromium, firefox, webkit } from 'playwright'
import { writeFile } from 'node:fs/promises'
import { serve } from '../serve.mjs'

const { url, close } = await serve()
const engines = { chromium, firefox, webkit }
const all = {}
for (const [ename, engine] of Object.entries(engines)) {
  const browser = await engine.launch()
  const page = await browser.newPage()
  await page.goto(`${url}/temporal/blank.html`)
  all[ename] = {}
  for (const impl of ['native', 'tp', 'js']) {
    const t0 = Date.now()
    all[ename][impl] = await page.evaluate(async (src) => {
      const m = await import(src)
      if (!m.T) return { error: 'no Temporal' }
      return { results: m.runCorpus(m.T), worked: m.workedExamples(m.T) }
    }, `${url}/temporal/dist/${impl}.js`)
    console.log(ename, impl, `${Date.now() - t0}ms`, Object.keys(all[ename][impl].results ?? {}).length, 'cases')
  }
  await browser.close()
}
close()

// Compare: natives against each other (the oracle must agree), then each polyfill against its engine's native.
const summary = { nativeDisagreements: {}, mismatches: {}, worked: {} }
const ref = (e) => all[e].native.results
const ids = Object.keys(ref('chromium'))
for (const e of ['firefox', 'webkit']) {
  summary.nativeDisagreements[e] = ids.filter((id) => ref(e)[id] !== ref('chromium')[id]).map((id) => ({ id, chromium: ref('chromium')[id], [e]: ref(e)[id] }))
}
const contested = new Set(Object.values(summary.nativeDisagreements).flat().map((x) => x.id))
for (const e of Object.keys(engines)) {
  for (const impl of ['tp', 'js']) {
    const r = all[e][impl].results
    const bad = ids.filter((id) => r[id] !== ref(e)[id]).map((id) => ({ id, native: ref(e)[id], [impl]: r[id], contested: contested.has(id) }))
    summary.mismatches[`${e}/${impl}`] = bad
    summary.worked[`${e}/${impl}`] = all[e][impl].worked.filter((w) => !w.ok)
  }
  summary.worked[`${e}/native`] = all[e].native.worked.filter((w) => !w.ok)
}
await writeFile(new URL('./correctness.json', import.meta.url), JSON.stringify(summary, null, 1))
// The Chromium native results are the reference for engines with no native Temporal (real Safari).
await writeFile(new URL('./reference.json', import.meta.url), JSON.stringify(all.chromium.native.results))
console.log('cases:', ids.length)
for (const [k, v] of Object.entries(summary.nativeDisagreements)) console.log(`native chromium vs ${k}:`, v.length)
for (const [k, v] of Object.entries(summary.mismatches)) console.log(`${k} vs native:`, v.length, `(${v.filter((x) => !x.contested).length} where natives agree)`)
for (const [k, v] of Object.entries(summary.worked)) if (v.length) console.log(`worked examples failing ${k}:`, v)
