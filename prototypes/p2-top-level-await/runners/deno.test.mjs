import { check, coreSource } from './calendar.test.js'
Deno.test('temporal is ready at import time', async () => {
  if (!(await check())) throw new Error('not ready')
  console.log('deno source:', coreSource)
})
