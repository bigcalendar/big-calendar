import { expect, it } from 'vitest'
import { message } from './app.js'

it('imports every package', () => {
  expect(message).toBe(
    'big-calendar smoke: application/x-big-calendar-event+json all packages loaded',
  )
})
