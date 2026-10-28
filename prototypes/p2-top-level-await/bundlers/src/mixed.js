// Scenario 3 (WebKit bug 242740, comment 10): the loader itself and a module
// that depends on it, imported at the same time.
import { run } from './report.js'
run('mixed', async () => {
  const [loader, ma] = await Promise.all([
    import('./loader.js'),
    import('./route-a.js'),
  ])
  return {
    ok: Boolean(loader?.source) && ma?.a?.seen === true,
    loaderSource: loader?.source,
    a: ma?.a,
  }
})
