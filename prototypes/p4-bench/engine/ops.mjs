// Per-operation cost (ns/op, unthrottled) for the calls the engine makes, native vs polyfill.
import { chromium, firefox, webkit } from 'playwright'
import { serve } from '../serve.mjs'
const { url, close } = await serve()
for (const [ename, engine] of Object.entries({ chromium, firefox, webkit })) {
  const b = await engine.launch()
  for (const impl of ['native', 'tp']) {
    const p = await b.newPage()
    if (impl !== 'native') await p.addInitScript(() => { delete globalThis.Temporal })
    await p.goto(`${url}/temporal/blank.html`)
    const r = await p.evaluate(async (src) => {
      const { T } = await import(src)
      const xs = Array.from({ length: 2000 }, (_, i) => T.Instant.fromEpochMilliseconds(1.79e12 + i * 997_000))
      const ns = xs.map((x) => x.epochNanoseconds), ms = xs.map((x) => x.epochMilliseconds)
      const z = 'America/New_York'
      const ops = {
        'Instant.compare': () => { let s = 0; for (let i = 1; i < 2000; i++) s += T.Instant.compare(xs[i - 1], xs[i]); return s },
        'bigint compare': () => { let s = 0; for (let i = 1; i < 2000; i++) s += ns[i - 1] < ns[i] ? -1 : 1; return s },
        'number compare': () => { let s = 0; for (let i = 1; i < 2000; i++) s += ms[i - 1] < ms[i] ? -1 : 1; return s },
        'epochNanoseconds get': () => { let s = 0n; for (let i = 0; i < 2000; i++) s += xs[i].epochNanoseconds; return s },
        'Instant.from(string)': () => { for (let i = 0; i < 2000; i++) T.Instant.from('2026-10-26T09:15:00-04:00') },
        'toZonedDateTimeISO+toPlainTime': () => { for (let i = 0; i < 2000; i++) xs[i].toZonedDateTimeISO(z).toPlainTime() },
        'PlainDate.toZonedDateTime': () => { const d = T.PlainDate.from('2026-10-26'); for (let i = 0; i < 2000; i++) d.toZonedDateTime(z) },
      }
      const out = {}
      for (const [k, f] of Object.entries(ops)) {
        f(); f()
        const t0 = performance.now(); for (let r = 0; r < 5; r++) f(); out[k] = (((performance.now() - t0) / 5 / 2000) * 1e6).toFixed(0)
      }
      return out
    }, `${url}/engine/dist/${impl}.js`)
    console.log(ename, impl, JSON.stringify(r))
    await p.close()
  }
  await b.close()
}
close()
