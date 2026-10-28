// Scenario 2: two lazy routes loaded at the same time, both using the calendar.
import { run } from './report.js'
run('concurrent', async () => {
  const [ma, mb] = await Promise.all([
    import('./route-a.js'),
    import('./route-b.js'),
  ])
  const { a } = ma
  const { b } = mb
  return {
    ok: a?.seen === true && b?.seen === true && Boolean(a.source && b.source),
    a,
    b,
  }
})
