import { beforeAll, describe, expect, it } from 'vitest'
import { createLuxonLocalizer, type LuxonLocalizer } from '@big-calendar/localizer-luxon'
import { createTemporalLocalizer, type TemporalLocalizer } from '@big-calendar/localizer-temporal'

/**
 * Proves both shipped localizer packages resolve correctly under Vitest's node
 * environment — including Temporal's dynamic polyfill import — before tests
 * that rely on the dual-localizer LOCALIZER_CASES harness run.
 */

let temporal: TemporalLocalizer
let luxon: LuxonLocalizer

beforeAll(async () => {
  temporal = await createTemporalLocalizer({ locale: 'en-US', timezone: 'UTC' })
  luxon = createLuxonLocalizer({ locale: 'en-US', timezone: 'UTC' })
})

describe('@big-calendar/localizer-temporal (dist) under Vitest/node', () => {
  it('imports the package, loads the polyfill, and formats a value', () => {
    expect(
      temporal.format({ value: '2026-07-03T00:00:00Z', format: { hour: '2-digit', minute: '2-digit', hour12: false } }),
    ).toBe('00:00')
  })
})

describe('@big-calendar/localizer-luxon (dist) under Vitest/node', () => {
  it('imports the package and formats a value', () => {
    expect(
      luxon.format({ value: '2026-07-03T00:00:00Z', format: { hour: '2-digit', minute: '2-digit', hour12: false } }),
    ).toBe('00:00')
  })
})
