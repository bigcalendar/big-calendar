import { Views } from '@big-calendar/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { CalendarProvider } from '../CalendarProvider'
import type { CalendarProviderProps } from '../CalendarProvider'
import type { TimeEventProps } from '../components.type'
import { LOCALIZER_CASES } from '../testing/localizers'
import TimeGridView from './TimeGridView.component'

interface Event {
  id?: number
  title?: string
  start: string
  end: string
  allDay?: boolean
}

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

describe.each(LOCALIZER_CASES)('TimeGridView [$name]', ({ create }) => {
  let localizer: Awaited<ReturnType<typeof create>>
  // Expected heading + first gutter label read back from the real localizer
  // (UTC, so the day window is the full 1440-minute column, no DST).
  let dayStart: string
  let heading: string
  let firstLabel: string

  beforeAll(async () => {
    localizer = await create()
    dayStart = localizer.startOf({ value: focus, unit: 'day' })
    heading = localizer.format({ value: dayStart, format: 'dayHeader' })
    firstLabel = localizer.format({ value: dayStart, format: 'timeGutter' })
  })

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

  it('renders headings, gutter, positioned events, all-day segments, and the now-line', () => {
    const { container } = renderGrid()

    // day heading carries today state
    const headingEl = screen.getByText(heading)
    expect(headingEl.classList.contains('bc-day-heading')).toBe(true)
    expect(headingEl.classList.contains('bc-today')).toBe(true)

    // gutter: a label per slot group (full day, step 30 / timeslots 2 → 24 groups)
    expect(container.querySelectorAll('.bc-time-label').length).toBe(24)
    expect(container.querySelector('.bc-time-label')?.textContent).toBe(firstLabel)

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
    const heading16 = localizer.format({
      value: localizer.startOf({ value: '2026-06-16', unit: 'day' }),
      format: 'dayHeader',
    })
    expect(container.querySelector('.bc-now-indicator')).toBeNull()
    expect(screen.getByText(heading16).classList.contains('bc-today')).toBe(false)
  })

  it('omits the now-line when now falls outside the visible time window', () => {
    // window 13:00–14:00, but NOW is 12:00 → before the column, so no line
    const { container } = renderGrid({
      min: '2026-06-15T13:00:00.000Z',
      max: '2026-06-15T14:00:00.000Z',
    })
    expect(screen.getByText(heading).classList.contains('bc-today')).toBe(true)
    expect(container.querySelector('.bc-now-indicator')).toBeNull()
  })

  it('drills into a day when its heading is clicked', () => {
    const onDrillDown = vi.fn()
    renderGrid({ onDrillDown })
    fireEvent.click(screen.getByText(heading))
    expect(onDrillDown).toHaveBeenCalledWith({ date: dayStart, view: Views.DAY })
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

  it('lists the overflowed all-day events in the show-more popover when opened', () => {
    const { container } = renderGrid({ allDayMaxRows: 0 })
    const showMore = container.querySelector('.bc-show-more') as HTMLElement
    expect(container.querySelectorAll('.bc-popover-event').length).toBe(0)

    const panel = document.getElementById(showMore.getAttribute('aria-controls') ?? '')
    if (!panel) throw new Error('popover panel not found')
    fireEvent(panel, Object.assign(new Event('toggle'), { newState: 'open' }))

    expect(container.querySelectorAll('.bc-popover-event').length).toBe(2)
    expect(screen.getAllByText('Holiday').length).toBeGreaterThan(0)
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
