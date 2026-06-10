import type { LocalizerContract } from '@big-calendar/core'
import { beforeAll, describe, expect, it } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import { formatEventTime } from './formatEventTime.function'

const START = '2026-07-03T14:30:00Z'
const END = '2026-07-03T15:00:00Z'
const ALL_DAY_LABEL = 'All Day'

// These two branches never reach the localizer, so they don't need one.
describe('formatEventTime — control flow (no localizer call)', () => {
  const localizer = null as unknown as LocalizerContract

  it('returns the all-day label for all-day events', () => {
    expect(formatEventTime({ localizer, allDayLabel: ALL_DAY_LABEL, start: START, end: END, allDay: true })).toBe(ALL_DAY_LABEL)
  })

  it('returns the all-day label when start is missing', () => {
    expect(formatEventTime({ localizer, allDayLabel: ALL_DAY_LABEL, start: null, end: END, allDay: false })).toBe(ALL_DAY_LABEL)
  })
})

describe.each(LOCALIZER_CASES)('formatEventTime [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create({ locale: 'en-US', timezone: 'UTC' })
  })

  it('formats a start–end range for timed events', () => {
    const result = formatEventTime({ localizer, allDayLabel: ALL_DAY_LABEL, start: START, end: END, allDay: false })
    const expected = `${localizer.format({ value: START, format: 'agendaTime' })} – ${localizer.format({ value: END, format: 'agendaTime' })}`
    expect(result).toBe(expected)
  })

  it('formats just the start when there is no end', () => {
    const result = formatEventTime({ localizer, allDayLabel: ALL_DAY_LABEL, start: START, end: null, allDay: false })
    expect(result).toBe(localizer.format({ value: START, format: 'agendaTime' }))
  })

  it('honors an explicit format role', () => {
    const result = formatEventTime({ localizer, allDayLabel: ALL_DAY_LABEL, start: START, end: null, allDay: false, format: 'time' })
    expect(result).toBe(localizer.format({ value: START, format: 'time' }))
  })
})
