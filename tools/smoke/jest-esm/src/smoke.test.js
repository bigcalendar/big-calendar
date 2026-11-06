import { message } from './app.js'

test('imports every package', () => {
  expect(message).toBe(
    'big-calendar smoke: application/x-big-calendar-event+json all packages loaded',
  )
})
