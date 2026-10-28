// Scenario 5: the calendar is already loaded statically; two lazy routes then load at once.
import { run } from './report.js'
import { coreSeen } from './core.js'
run('late', async () => {
  await new Promise((r) => setTimeout(r, 50))
  const [ma, mb] = await Promise.all([
    import('./route-a.js'),
    import('./route-c.js'),
  ])
  return {
    ok: coreSeen === true && ma?.a?.seen === true && mb?.c?.seen === true,
  }
})
