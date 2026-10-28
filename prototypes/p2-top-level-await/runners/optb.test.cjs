// Jest's default CommonJS mode, loading the option-B packages through require(esm).
const { createCalendar, temporalReady } = require('./optb/core.js')
test('createCalendar works after temporalReady', async () => {
  await temporalReady
  expect(createCalendar().ok).toBe(true)
  console.log('source:', createCalendar().source)
})
