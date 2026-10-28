import { test } from 'node:test'
import assert from 'node:assert'
import { check, coreSource } from './calendar.test.js'
test('temporal is ready at import time', async () => {
  assert.equal(await check(), true)
  console.log('node:test source:', coreSource)
})
