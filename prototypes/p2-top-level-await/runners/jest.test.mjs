import { check, coreSource } from './calendar.test.js'
test('temporal is ready at import time', async () => {
  expect(await check()).toBe(true)
  console.log('jest source:', coreSource)
})
