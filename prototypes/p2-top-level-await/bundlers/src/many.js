// Scenario 4: five concurrent imports reaching the loader by different paths.
import { run } from './report.js'
run('many', async () => {
  const mods = await Promise.all([
    import('./route-a.js'),
    import('./route-b.js'),
    import('./route-c.js'),
    import('./core.js'),
    import('./interactions.js'),
  ])
  const [{ a }, { b }, { c }, core, inter] = mods
  const values = [
    a?.seen,
    b?.seen,
    c?.seen,
    core?.coreSeen,
    inter?.interactionsSeen,
  ]
  return { ok: values.every((v) => v === true), values }
})
