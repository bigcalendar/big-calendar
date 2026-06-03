import type { LocalizerContract } from '@big-calendar/localizer'
import { describe, expect, it } from 'vitest'
import { Views } from '../constants/views.constant'
import type { VisibleRange } from '../types/calendar.type'
import { viewLabel } from './viewLabel.function'

// Marker localizer: echoes the requested role + value so the test can assert
// which format role and which date each view label used.
const localizer = {
  format: ({ value, format }: { value: string; format: string }) => `${format}:${value}`,
} as unknown as LocalizerContract

const date = '2026-06-15'
const range: VisibleRange = {
  firstVisibleDay: '2026-06-01',
  lastVisibleDay: '2026-06-07',
  days: [],
}
const span = 'monthDay:2026-06-01 – monthDay:2026-06-07'

describe('viewLabel', () => {
  it('month → monthHeader of the focus date', () => {
    expect(viewLabel({ localizer, view: Views.MONTH, date, range })).toBe('monthHeader:2026-06-15')
  })

  it('day → dayHeader of the focus date', () => {
    expect(viewLabel({ localizer, view: Views.DAY, date, range })).toBe('dayHeader:2026-06-15')
  })

  it('week → the visible span', () => {
    expect(viewLabel({ localizer, view: Views.WEEK, date, range })).toBe(span)
  })

  it('work_week → the visible span', () => {
    expect(viewLabel({ localizer, view: Views.WORK_WEEK, date, range })).toBe(span)
  })

  it('agenda → the visible span', () => {
    expect(viewLabel({ localizer, view: Views.AGENDA, date, range })).toBe(span)
  })
})
