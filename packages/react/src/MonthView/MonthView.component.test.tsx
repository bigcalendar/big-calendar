import { Views } from '@big-calendar/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { CalendarProvider } from '../CalendarProvider'
import type { CalendarProviderProps } from '../CalendarProvider'
import type { MonthEventProps } from '../components.type'
import { LOCALIZER_CASES } from '../testing/localizers'
import MonthView from './MonthView.component'

interface Event {
  id?: number
  title?: string
  start: string
  end: string
}

const focus = '2026-06-15'
const NOW = '2026-06-15T12:00:00.000Z'
const events: Event[] = [
  { id: 1, title: 'Standup', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T10:00:00.000Z' },
  { id: 2, title: 'Review', start: '2026-06-15T11:00:00.000Z', end: '2026-06-15T12:00:00.000Z' },
  // bare event: no id/title → exercises the accessor fallbacks
  { start: '2026-06-15T13:00:00.000Z', end: '2026-06-15T14:00:00.000Z' },
]

describe.each(LOCALIZER_CASES)('MonthView [$name]', ({ create }) => {
  let localizer: Awaited<ReturnType<typeof create>>
  beforeAll(async () => {
    // UTC so the en-US grid is deterministic: Sunday-first, May 31 … Jul 4.
    localizer = await create()
  })

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
    // The drilled date is the grid cell's day value (same method the model uses).
    const cell15 = localizer.visibleDays(focus).find((d) => localizer.format({ value: d, format: 'dayOfMonth' }) === '15')
    expect(onDrillDown).toHaveBeenCalledWith({ date: cell15, view: Views.DAY })
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
    // Not a fake localizer: delegate every call to the real one and force only
    // the structural edge — an empty visibleDays the localizer never produces —
    // to exercise the component's empty-grid guard. Methods stay bound to the
    // real instance so its private state keeps working.
    const emptyLocalizer = new Proxy(localizer, {
      get(target, prop) {
        if (prop === 'visibleDays') return () => []
        const value = Reflect.get(target, prop, target)
        return typeof value === 'function' ? value.bind(target) : value
      },
    })
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
