// The same check under every runner: importing the packages gives a usable
// Temporal at import time, with no setup in the test.
import { coreSeen, coreSource } from './src/core.js'
import { interactionsSeen } from './src/interactions.js'

const check = async () => {
  const [{ a }, { b }, { c }] = await Promise.all([
    import('./src/route-a.js'),
    import('./src/route-b.js'),
    import('./src/route-c.js'),
  ])
  return (
    [coreSeen, interactionsSeen, a.seen, b.seen, c.seen].every(
      (v) => v === true,
    ) && Boolean(coreSource)
  )
}
export { check, coreSource }
