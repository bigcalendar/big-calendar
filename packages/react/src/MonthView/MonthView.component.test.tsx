import { Views } from '@big-calendar/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CalendarProvider } from '../CalendarProvider'
import type { CalendarProviderProps } from '../CalendarProvider'
import type { MonthEventProps } from '../components.type'
import type { CalendarProps } from '../useCalendar'
import MonthView from './MonthView.component'

interface Event {
  id?: number
  title?: string
  start: string
  end: string
}

const DAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const day = (v: string) => v.slice(0, 10)
const utc = (v: string) => new Date(`${day(v)}T00:00:00.000Z`)
const isoDay = (d: Date) => d.toISOString().slice(0, 10)
const ts = (v: string) => new Date(v.length <= 10 ? `${v}T00:00:00.000Z` : v).getTime()
const addDays = (v: string, n: number) => {
  const d = utc(v)
  d.setUTCDate(d.getUTCDate() + n)
  return isoDay(d)
}
const dayDiff = (a: string, b: string) => Math.round((utc(b).getTime() - utc(a).getTime()) / 86400000)

// First Sunday on/before the 1st of `value`'s month.
function firstVis(value: string) {
  const d = utc(value)
  d.setUTCDate(1)
  while (d.getUTCDay() !== 0) d.setUTCDate(d.getUTCDate() - 1)
  return isoDay(d)
}
// First Saturday on/after the last day of `value`'s month.
function lastVis(value: string) {
  const d = utc(value)
  d.setUTCMonth(d.getUTCMonth() + 1, 0)
  while (d.getUTCDay() !== 6) d.setUTCDate(d.getUTCDate() + 1)
  return isoDay(d)
}
function rangeDays(start: string, end: string) {
  const out: string[] = []
  for (let cur = day(start); cur <= day(end); cur = addDays(cur, 1)) out.push(cur)
  return out
}

// A compact UTC-day fake covering the full month-grid build (range → segments)
// plus the today / off-range derivations. `visibleDays` is overridable so a test
// can drive the empty-grid edge case.
const baseLocalizer = {
  format: ({ value, format }: { value: string; format: string }) => {
    const d = utc(value)
    if (format === 'weekday') return DAY_LONG[d.getUTCDay()] ?? ''
    if (format === 'weekdayShort') return DAY_SHORT[d.getUTCDay()] ?? ''
    if (format === 'dayOfMonth') return String(d.getUTCDate())
    return `${format}:${value}`
  },
  startOf: ({ value, unit }: { value: string; unit: string }) => {
    if (unit === 'month') {
      const d = utc(value)
      d.setUTCDate(1)
      return isoDay(d)
    }
    return day(value)
  },
  add: ({ value, amount }: { value: string; amount: number }) => addDays(value, amount),
  ceil: ({ value }: { value: string }) => (ts(value) === ts(day(value)) ? day(value) : addDays(value, 1)),
  diff: ({ a, b }: { a: string; b: string }) => dayDiff(a, b),
  min: ({ values }: { values: string[] }) => values.reduce((m, v) => (v < m ? v : m)),
  max: ({ values }: { values: string[] }) => values.reduce((m, v) => (v > m ? v : m)),
  range: ({ start, end }: { start: string; end: string }) => rangeDays(start, end),
  firstVisibleDay: (value: string) => firstVis(value),
  lastVisibleDay: (value: string) => lastVis(value),
  visibleDays: (value: string) => rangeDays(firstVis(value), lastVis(value)),
  isSameDate: ({ a, b }: { a: string; b: string }) => day(a) === day(b),
  neq: ({ a, b, unit }: { a: string; b: string; unit?: string }) =>
    unit === 'month' ? day(a).slice(0, 7) !== day(b).slice(0, 7) : day(a) !== day(b),
  inEventRange: ({
    event,
    range,
  }: {
    event: { start: string; end: string }
    range: { start: string; end: string }
  }) => ts(event.start) < ts(range.end) && ts(event.end) > ts(range.start),
  daySpan: ({ start, end }: { start: string; end: string }) => dayDiff(day(start), day(end)) + 1,
  sortEvents: ({ events }: { events: Array<{ start: string }> }) =>
    [...events].sort((a, b) => (a.start < b.start ? -1 : 1)),
  getMinutesFromMidnight: () => 0,
}
const localizer = baseLocalizer as unknown as CalendarProps<Event>['localizer']

const focus = '2026-06-15'
const NOW = '2026-06-15T12:00:00.000Z'
const events: Event[] = [
  { id: 1, title: 'Standup', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T10:00:00.000Z' },
  { id: 2, title: 'Review', start: '2026-06-15T11:00:00.000Z', end: '2026-06-15T12:00:00.000Z' },
  // bare event: no id/title → exercises the accessor fallbacks
  { start: '2026-06-15T13:00:00.000Z', end: '2026-06-15T14:00:00.000Z' },
]

function renderMonth(extra?: Partial<CalendarProviderProps<Event>>) {
  return render(
    <CalendarProvider<Event>
      localizer={localizer}
      defaultDate={focus}
      defaultView={Views.MONTH}
      events={events}
      getNow={() => NOW}
      {...extra}
    >
      <MonthView />
    </CalendarProvider>,
  )
}

describe('MonthView', () => {
  it('renders weekday headings, date cells with today / off-range state, and placed segments', () => {
    const { container } = renderMonth()

    // weekday header (grid is Sunday-first)
    expect(screen.getByText('Sunday')).toBeTruthy()
    expect(screen.getByText('Sun')).toBeTruthy()

    // today cell (06-15)
    const today = screen.getByText('15').closest('.bc-date-cell')
    expect(today?.classList.contains('bc-today')).toBe(true)
    expect(today?.classList.contains('bc-off-range')).toBe(false)

    // off-range cell (05-31, padding from the previous month)
    const offRange = screen.getByText('31').closest('.bc-date-cell')
    expect(offRange?.classList.contains('bc-off-range')).toBe(true)

    // titled events placed as segments, with geometry custom properties
    expect(screen.getByText('Standup')).toBeTruthy()
    expect(screen.getByText('Review')).toBeTruthy()
    const segment = container.querySelector('.bc-segment') as HTMLElement
    expect(segment.style.getPropertyValue('--bc-seg-left')).toBe('2')
    expect(segment.style.getPropertyValue('--bc-seg-row')).toBe('1')

    // container carries the week count (May 31 … Jul 4 → 5 weeks)
    const grid = container.querySelector('.bc-month-grid') as HTMLElement
    expect(grid.style.getPropertyValue('--bc-week-count')).toBe('5')
  })

  it('drills into a day when its date number is clicked', () => {
    const onDrillDown = vi.fn()
    renderMonth({ onDrillDown })
    fireEvent.click(screen.getByText('15'))
    expect(onDrillDown).toHaveBeenCalledWith({ date: '2026-06-15', view: Views.DAY })
  })

  it('renders nothing when the active view is not the month', () => {
    const { container } = renderMonth({ defaultView: Views.AGENDA })
    expect(container.querySelector('.bc-month')).toBeNull()
  })

  it('overflows events past weekEventLimit into the default "+N more" indicator', () => {
    const { container } = renderMonth({ weekEventLimit: 1 })
    // one event fits the single allowed row; the other two overflow
    const showMore = container.querySelector('.bc-show-more') as HTMLElement
    expect(showMore.textContent).toBe('+2 more')
  })

  it('honors slot overrides (weekday / dateCell / event / showMore)', () => {
    renderMonth({
      weekEventLimit: 1,
      components: {
        month: {
          weekday: ({ short }) => <div data-testid="custom-weekday">{short}</div>,
          dateCell: ({ label }) => <div data-testid="custom-date">{label}</div>,
          event: ({ title }: MonthEventProps<Event>) => <div data-testid="custom-event">{title}</div>,
          showMore: ({ label }) => <div data-testid="custom-more">{label}</div>,
        },
      },
    })
    expect(screen.getAllByTestId('custom-weekday').length).toBe(7)
    // 5 weeks × 7 days
    expect(screen.getAllByTestId('custom-date').length).toBe(35)
    // one event placed, two overflowed into the show-more
    expect(screen.getAllByTestId('custom-event').length).toBe(1)
    expect(screen.getByTestId('custom-more').textContent).toBe('+2 more')
  })

  it('renders an empty grid without crashing when no days are visible', () => {
    const emptyLocalizer = {
      ...baseLocalizer,
      visibleDays: () => [],
    } as unknown as CalendarProps<Event>['localizer']
    const { container } = render(
      <CalendarProvider<Event>
        localizer={emptyLocalizer}
        defaultDate={focus}
        defaultView={Views.MONTH}
        events={events}
        getNow={() => NOW}
      >
        <MonthView />
      </CalendarProvider>,
    )
    expect(container.querySelector('.bc-month')).not.toBeNull()
    expect(container.querySelector('.bc-weekday')).toBeNull()
    expect(container.querySelector('.bc-month-week')).toBeNull()
  })
})
