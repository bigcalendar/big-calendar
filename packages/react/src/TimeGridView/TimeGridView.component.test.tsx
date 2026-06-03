import { Views } from '@big-calendar/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CalendarProvider } from '../CalendarProvider'
import type { CalendarProviderProps } from '../CalendarProvider'
import type { TimeEventProps } from '../components.type'
import type { CalendarProps } from '../useCalendar'
import TimeGridView from './TimeGridView.component'

interface Event {
  id?: number
  title?: string
  start: string
  end: string
  allDay?: boolean
}

const day = (v: string) => v.slice(0, 10)
const ms = (v: string) => new Date(v.length <= 10 ? `${v}T00:00:00.000Z` : v).getTime()
const iso = (t: number) => new Date(t).toISOString()
const minMid = (v: string) => (ms(v) - ms(day(v))) / 60000
const hhmm = (v: string) => {
  const d = new Date(ms(v))
  return `${d.getUTCHours()}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}
const dayDiff = (a: string, b: string) => Math.round((ms(day(b)) - ms(day(a))) / 86400000)

// A UTC fake covering the full time-grid build (slot metrics + all-day segments)
// plus the now-indicator and today derivations. No DST (UTC), so getDstOffset is 0.
const baseLocalizer = {
  format: ({ value, format }: { value: string; format: string }) => {
    if (format === 'dayHeader') return `Day ${day(value)}`
    if (format === 'timeGutter' || format === 'time') return hhmm(value)
    return `${format}:${value}`
  },
  startOf: ({ value, unit }: { value: string; unit: string }) =>
    unit === 'day' ? iso(ms(day(value))) : day(value),
  add: ({ value, amount }: { value: string; amount: number }) => iso(ms(day(value)) + amount * 86400000),
  ceil: ({ value }: { value: string }) =>
    ms(value) === ms(day(value)) ? iso(ms(day(value))) : iso(ms(day(value)) + 86400000),
  diff: ({ a, b, unit }: { a: string; b: string; unit?: string }) =>
    unit === 'day' ? dayDiff(a, b) : (ms(b) - ms(a)) / 60000,
  min: ({ values }: { values: string[] }) => values.reduce((m, v) => (ms(v) < ms(m) ? v : m)),
  max: ({ values }: { values: string[] }) => values.reduce((m, v) => (ms(v) > ms(m) ? v : m)),
  range: ({ start, end }: { start: string; end: string }) => {
    const out: string[] = []
    for (let t = ms(day(start)); t <= ms(day(end)); t += 86400000) out.push(iso(t))
    return out
  },
  eq: ({ a, b }: { a: string; b: string }) => ms(a) === ms(b),
  isSameDate: ({ a, b }: { a: string; b: string }) => day(a) === day(b),
  inEventRange: ({
    event,
    range,
  }: {
    event: { start: string; end: string }
    range: { start: string; end: string }
  }) => ms(event.start) < ms(range.end) && ms(event.end) > ms(range.start),
  startAndEndAreDateOnly: ({ start, end }: { start: string; end: string }) =>
    minMid(start) === 0 && minMid(end) === 0,
  daySpan: ({ start, end }: { start: string; end: string }) => dayDiff(start, end) + 1,
  sortEvents: ({ events }: { events: Array<{ start: string }> }) =>
    [...events].sort((a, b) => (ms(a.start) < ms(b.start) ? -1 : 1)),
  getMinutesFromMidnight: (value: string) => minMid(value),
  getTotalMin: ({ start, end }: { start: string; end: string }) => (ms(end) - ms(start)) / 60000,
  getDstOffset: () => 0,
  getSlotDate: ({ date, minutesFromMidnight }: { date: string; minutesFromMidnight: number }) =>
    iso(ms(day(date)) + minutesFromMidnight * 60000),
}
const localizer = baseLocalizer as unknown as CalendarProps<Event>['localizer']

const focus = '2026-06-15'
const NOW = '2026-06-15T12:00:00.000Z'
const allDayBounds = { start: '2026-06-15T00:00:00.000Z', end: '2026-06-16T00:00:00.000Z' }
const events: Event[] = [
  { id: 1, title: 'Standup', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T10:00:00.000Z' },
  { id: 2, title: 'Review', start: '2026-06-15T11:00:00.000Z', end: '2026-06-15T12:00:00.000Z' },
  // bare timed event: no id/title → exercises the accessor fallbacks
  { start: '2026-06-15T15:00:00.000Z', end: '2026-06-15T16:00:00.000Z' },
  { id: 3, title: 'Holiday', allDay: true, ...allDayBounds },
  // bare all-day event: no id/title → exercises the all-day accessor fallbacks
  { allDay: true, ...allDayBounds },
]
const backgroundEvents: Event[] = [
  { id: 10, title: 'Busy', start: '2026-06-15T13:00:00.000Z', end: '2026-06-15T14:00:00.000Z' },
  // bare background event → exercises the background accessor fallbacks
  { start: '2026-06-15T13:30:00.000Z', end: '2026-06-15T14:30:00.000Z' },
]

function renderGrid(extra?: Partial<CalendarProviderProps<Event>>) {
  return render(
    <CalendarProvider<Event>
      localizer={localizer}
      defaultDate={focus}
      defaultView={Views.DAY}
      events={events}
      backgroundEvents={backgroundEvents}
      getNow={() => NOW}
      {...extra}
    >
      <TimeGridView />
    </CalendarProvider>,
  )
}

describe('TimeGridView', () => {
  it('renders headings, gutter, positioned events, all-day segments, and the now-line', () => {
    const { container } = renderGrid()

    // day heading carries today state
    const heading = screen.getByText('Day 2026-06-15')
    expect(heading.classList.contains('bc-day-heading')).toBe(true)
    expect(heading.classList.contains('bc-today')).toBe(true)

    // gutter: a label per slot group (full day, step 30 / timeslots 2 → 24 groups)
    expect(container.querySelectorAll('.bc-time-label').length).toBe(24)
    expect(container.querySelector('.bc-time-label')?.textContent).toBe('0:00')

    // body height in slot rows (48 thirty-minute slots)
    const body = container.querySelector('.bc-time-body') as HTMLElement
    expect(body.style.getPropertyValue('--bc-slot-count')).toBe('48')

    // timed event box geometry (09:00 → 540/1440 = 0.375 down the column)
    const standup = screen.getByText('Standup').closest('.bc-event') as HTMLElement
    expect(standup.style.getPropertyValue('--bc-top')).toBe('0.375')
    expect(standup.style.getPropertyValue('--bc-width')).toBe('1')

    // all-day segments (Holiday + the bare all-day event), placed in column 1
    const segment = container.querySelector('.bc-segment') as HTMLElement
    expect(segment.style.getPropertyValue('--bc-seg-left')).toBe('1')
    expect(screen.getByText('Holiday')).toBeTruthy()

    // background events render behind the foreground
    expect(container.querySelectorAll('.bc-bg-event').length).toBe(2)

    // now-line on today's column (12:00 → 720/1440 = 0.5)
    const now = container.querySelector('.bc-now-indicator') as HTMLElement
    expect(now.style.getPropertyValue('--bc-now-top')).toBe('0.5')
    expect((container.querySelector('.bc-day-column') as HTMLElement).classList.contains('bc-today')).toBe(true)
  })

  it('omits the now-line when the column is not today', () => {
    const { container } = renderGrid({ defaultDate: '2026-06-16' })
    expect(container.querySelector('.bc-now-indicator')).toBeNull()
    expect(screen.getByText('Day 2026-06-16').classList.contains('bc-today')).toBe(false)
  })

  it('omits the now-line when now falls outside the visible time window', () => {
    // window 13:00–14:00, but NOW is 12:00 → before the column, so no line
    const { container } = renderGrid({
      min: '2026-06-15T13:00:00.000Z',
      max: '2026-06-15T14:00:00.000Z',
    })
    expect(screen.getByText('Day 2026-06-15').classList.contains('bc-today')).toBe(true)
    expect(container.querySelector('.bc-now-indicator')).toBeNull()
  })

  it('drills into a day when its heading is clicked', () => {
    const onDrillDown = vi.fn()
    renderGrid({ onDrillDown })
    fireEvent.click(screen.getByText('Day 2026-06-15'))
    expect(onDrillDown).toHaveBeenCalledWith({ date: '2026-06-15T00:00:00.000Z', view: Views.DAY })
  })

  it('renders nothing when the active view is not a time grid', () => {
    const { container } = renderGrid({ defaultView: Views.AGENDA })
    expect(container.querySelector('.bc-time-grid')).toBeNull()
  })

  it('overflows all-day events past the row limit into the default "+N more" indicator', () => {
    const { container } = renderGrid({ allDayMaxRows: 0 })
    // both all-day events spill past the zero-row limit
    expect((container.querySelector('.bc-show-more') as HTMLElement).textContent).toBe('+2 more')
  })

  it('honors slot overrides (dayHeading / timeLabel / event / allDayEvent / showMore)', () => {
    renderGrid({
      allDayMaxRows: 1,
      components: {
        time: {
          dayHeading: ({ label }) => <div data-testid="custom-heading">{label}</div>,
          timeLabel: ({ label }) => <div data-testid="custom-label">{label}</div>,
          event: ({ title }: TimeEventProps<Event>) => <div data-testid="custom-event">{title}</div>,
          allDayEvent: ({ title }) => <div data-testid="custom-allday">{title}</div>,
          showMore: ({ label }) => <div data-testid="custom-more">{label}</div>,
        },
      },
    })
    expect(screen.getAllByTestId('custom-heading').length).toBe(1)
    expect(screen.getAllByTestId('custom-label').length).toBe(24)
    // three timed events (Standup, Review, the bare one)
    expect(screen.getAllByTestId('custom-event').length).toBe(3)
    // one all-day segment fits the single row; the other overflows
    expect(screen.getAllByTestId('custom-allday').length).toBe(1)
    expect(screen.getByTestId('custom-more').textContent).toBe('+1 more')
  })
})
