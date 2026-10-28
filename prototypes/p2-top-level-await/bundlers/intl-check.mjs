import { chromium, firefox, webkit } from 'playwright'
const probe = () => {
  const want = ['gregory', 'islamic-umalqura', 'hebrew', 'persian', 'japanese']
  const cals = Intl.supportedValuesOf('calendar')
  const fmt = want.map((c) => {
    try {
      return (
        c +
        '=' +
        new Intl.DateTimeFormat('en-u-ca-' + c, { dateStyle: 'medium' }).format(
          new Date(Date.UTC(2026, 9, 28, 12)),
        )
      )
    } catch (e) {
      return c + '=ERR'
    }
  })
  return {
    missing: want.filter((c) => !cals.includes(c)),
    fmt,
    weekInfo: typeof new Intl.Locale('en-US').getWeekInfo,
    durationFormat: typeof Intl.DurationFormat,
    temporal: typeof globalThis.Temporal,
    anchor: CSS.supports('anchor-name: --a'),
    scope: CSS.supports('selector(:scope)') && 'CSSScopeRule' in globalThis,
  }
}
for (const [n, t] of Object.entries({ chromium, firefox, webkit })) {
  const b = await t.launch()
  const p = await b.newPage()
  await p.goto('about:blank')
  console.log(n, b.version(), JSON.stringify(await p.evaluate(probe)))
  await b.close()
}
