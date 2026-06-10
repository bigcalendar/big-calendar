import { beforeAll, describe, expect, it } from 'vitest'
import { Views } from '../constants/views.constant'
import { LOCALIZER_CASES } from '../testing/localizers'
import type { VisibleRange } from '../types/calendar.type'
import { viewLabel } from './viewLabel.function'

const date = '2026-06-15T00:00:00.000Z'
const range: VisibleRange = {
  firstVisibleDay: '2026-06-01T00:00:00.000Z',
  lastVisibleDay: '2026-06-07T00:00:00.000Z',
  days: [],
}

describe.each(LOCALIZER_CASES)('viewLabel [$name]', ({ create }) => {
  let localizer: Awaited<ReturnType<typeof create>>
  beforeAll(async () => {
    localizer = await create()
  })

  // The expected label for each view, read back from the real localizer so the
  // test pins the dispatch (which format role / which date) without hard-coding
  // locale-specific ICU literals.
  const monthLabel = (): string => localizer.format({ value: date, format: 'monthHeader' })
  const dayLabel = (): string => localizer.format({ value: date, format: 'dayHeader' })
  const span = (): string =>
    localizer.formatDateRange({ start: range.firstVisibleDay, end: range.lastVisibleDay, format: 'monthDay' })

  it('month → monthHeader of the focus date', () => {
    expect(viewLabel({ localizer, view: Views.MONTH, date, range })).toBe(monthLabel())
  })

  it('day → dayHeader of the focus date', () => {
    expect(viewLabel({ localizer, view: Views.DAY, date, range })).toBe(dayLabel())
  })

  it('week → the visible span', () => {
    expect(viewLabel({ localizer, view: Views.WEEK, date, range })).toBe(span())
  })

  it('work_week → the visible span', () => {
    expect(viewLabel({ localizer, view: Views.WORK_WEEK, date, range })).toBe(span())
  })

  it('agenda → the visible span', () => {
    expect(viewLabel({ localizer, view: Views.AGENDA, date, range })).toBe(span())
  })
})
