import { beforeAll, describe, expect, it } from 'vitest'
import { createTemporalLocalizer, type TemporalLocalizer } from '@big-calendar/localizer-temporal'

/**
 * Step 0 of the localizer test retrofit: prove the built
 * `@big-calendar/localizer-temporal` package resolves under Vitest's jsdom
 * environment — including its dynamic `temporal-polyfill` import — before any
 * suite is converted off the hand-rolled fake localizer.
 */

let loc: TemporalLocalizer

beforeAll(async () => {
  loc = await createTemporalLocalizer({ locale: 'en-US', timezone: 'UTC' })
})

describe('@big-calendar/localizer-temporal (dist) under Vitest/jsdom', () => {
  it('imports the package, loads the polyfill, and formats a value', () => {
    expect(
      loc.format({ value: '2026-07-03T00:00:00Z', format: { hour: '2-digit', minute: '2-digit', hour12: false } }),
    ).toBe('00:00')
  })
})
