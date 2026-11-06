import assert from 'node:assert/strict'
import { test } from 'node:test'
import { message } from './app.js'

test('imports every package', () => {
  assert.equal(
    message,
    'big-calendar smoke: application/x-big-calendar-event+json all packages loaded',
  )
})
