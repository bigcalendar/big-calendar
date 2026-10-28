import { test, expect } from 'vitest'
import { check, coreSource } from './calendar.test.js'
test('temporal is ready at import time', async () => {
  expect(await check()).toBe(true)
  console.log('vitest source:', coreSource)
})
