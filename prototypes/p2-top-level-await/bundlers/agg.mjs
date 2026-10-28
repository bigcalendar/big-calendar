import { readFileSync } from 'node:fs'
const rows = process.argv
  .slice(2)
  .flatMap((f) =>
    readFileSync(f, 'utf8')
      .trim()
      .split('\n')
      .map((l) => JSON.parse(l)),
  )
  .filter((r) => !['FINISHED'].includes(r.scenario))
const agg = {}
for (const r of rows) {
  if (r.scenario === 'unhandledrejection') {
    ;(agg[`${r.tag} ${r.build}`] ??= { cells: {}, rej: [] }).rej.push(
      r.error.slice(0, 140),
    )
    continue
  }
  const k = `${r.tag} ${r.build}`
  const a = (agg[k] ??= { cells: {}, rej: [] })
  const c = (a.cells[r.scenario] ??= {
    pass: 0,
    fail: 0,
    errs: new Set(),
    src: new Set(),
  })
  r.ok ? c.pass++ : c.fail++
  if (!r.ok)
    c.errs.add(
      (
        r.error ??
        JSON.stringify({
          a: r.a,
          b: r.b,
          values: r.values,
          loaderSource: r.loaderSource,
        })
      ).slice(0, 150),
    )
  for (const s of [r.source, r.a?.source, r.b?.source, r.loaderSource])
    if (s) c.src.add(s)
}
for (const [k, a] of Object.entries(agg)) {
  console.log(
    k.padEnd(34),
    Object.entries(a.cells)
      .map(([s, c]) => `${s}:${c.pass}/${c.pass + c.fail}`)
      .join('  '),
    [...new Set(Object.values(a.cells).flatMap((c) => [...c.src]))].join('/'),
  )
  for (const [s, c] of Object.entries(a.cells))
    for (const e of c.errs) console.log('     ', s, '→', e)
  for (const e of [...new Set(a.rej)])
    console.log('      unhandledrejection →', e)
}
