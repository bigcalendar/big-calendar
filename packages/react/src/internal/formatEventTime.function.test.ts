import type { LocalizerContract } from '@big-calendar/core'
import { describe, expect, it } from 'vitest'
import { formatEventTime } from './formatEventTime.function'

const localizer = {
  format: ({ value, format }: { value: string; format: string }) => `${format}:${value}`,
} as unknown as LocalizerContract

const base = { localizer, allDayLabel: 'All Day' } as const

describe('formatEventTime', () => {
  it('returns the all-day label for all-day events', () => {
    expect(formatEventTime({ ...base, start: 's', end: 'e', allDay: true })).toBe('All Day')
  })

  it('returns the all-day label when start is missing', () => {
    expect(formatEventTime({ ...base, start: null, end: 'e', allDay: false })).toBe('All Day')
  })

  it('formats a start–end range for timed events', () => {
    expect(formatEventTime({ ...base, start: 's', end: 'e', allDay: false })).toBe('agendaTime:s – agendaTime:e')
  })

  it('formats just the start when there is no end', () => {
    expect(formatEventTime({ ...base, start: 's', end: null, allDay: false })).toBe('agendaTime:s')
  })

  it('honors an explicit format role', () => {
    expect(formatEventTime({ ...base, start: 's', end: null, allDay: false, format: 'time' })).toBe('time:s')
  })
})
