import { Views } from '@big-calendar/core'
import { act, fireEvent, render, screen } from '@testing-library/react'
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

  /**
   * Committed slot callbacks are split per gesture (`onSlotClick` /
   * `onSlotDoubleClick` / `onSlotSelect`); the payload no longer carries
   * `action`. Fan the three into one spy and re-inject `action`.
   */
  function slotSpy() {
    const fn = vi.fn()
    const props: Partial<CalendarProviderProps<Event>> = {
      onSlotClick: (s) => fn({ action: 'click', ...s }),
      onSlotDoubleClick: (s) => fn({ action: 'doubleClick', ...s }),
      onSlotSelect: (s) => fn({ action: 'select', ...s }),
    }
    return { fn, props }
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

  it('sets --bc-day-count on the grid container so every row shares the column tracks', () => {
    // The header, all-day row, and body all build their grid from repeat(var(--bc-day-count)…);
    // the var must live on the .bc-time-grid container so all three inherit a valid track count.
    // (Missing it collapses repeat() → the gutter spans full width and no day columns form.)
    const { container } = renderGrid({ defaultView: Views.WEEK })
    const grid = container.querySelector('.bc-time-grid') as HTMLElement
    expect(grid.style.getPropertyValue('--bc-day-count')).toBe('7')
  })

  it('leads the header with a gutter spacer so day headings align with the body columns', () => {
    // The header grid has a gutter track + day tracks; without a spacer in the gutter
    // track the auto-flowed headings shift one column left of the body day columns.
    const { container } = renderGrid({ defaultView: Views.WEEK })
    const first = container.querySelector('.bc-time-header')?.firstElementChild as HTMLElement
    expect(first.classList.contains('bc-time-header-gutter')).toBe(true)
    expect(first.classList.contains('bc-day-heading')).toBe(false)
    // exactly one heading per day, none consumed by the gutter track
    expect(container.querySelectorAll('.bc-day-heading').length).toBe(7)
  })

  it('sets --bc-slots-per-group on the grid container so gutter rows and column lines share the group size', () => {
    // The gutter sizes each label row to span the group, and the day columns draw
    // the hour line every group; both read the var from the .bc-time-grid container.
    const { container } = renderGrid()
    const grid = container.querySelector('.bc-time-grid') as HTMLElement
    expect(grid.style.getPropertyValue('--bc-slots-per-group')).toBe('2')
  })

  it('renders a real per-slot hit cell per slot, tagged with its day + slot index', () => {
    // The slot cells are the base layer for pointer/keyboard slot selection.
    const { container } = renderGrid()
    const cells = container.querySelectorAll('.bc-day-column .bc-time-slot')
    // one cell per slot row (full day, 48 thirty-minute slots)
    expect(cells.length).toBe(48)
    const firstCell = cells[0] as HTMLElement
    expect(firstCell.dataset.date).toBe(dayStart)
    expect(firstCell.dataset.slotIndex).toBe('0')
    expect((cells[47] as HTMLElement).dataset.slotIndex).toBe('47')
  })

  it('shows the selection overlay in the anchored column during a drag, and clears it on release', () => {
    const { container } = renderGrid({ selectable: true })
    const cells = container.querySelectorAll('.bc-time-slot')
    // jsdom has no layout → stub elementFromPoint to resolve to the drag head.
    document.elementFromPoint = () => cells[5] as Element

    fireEvent.pointerDown(cells[2] as HTMLElement, { button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(window, { clientX: 0, clientY: 60 })

    const overlay = container.querySelector('.bc-selection') as HTMLElement
    expect(overlay).not.toBeNull()
    // slots 2..5 of 48 → top 2/48, height 4/48
    expect(overlay.style.getPropertyValue('--bc-top')).toBe(String(2 / 48))
    expect(overlay.style.getPropertyValue('--bc-height')).toBe(String(4 / 48))

    fireEvent.pointerUp(window)
    expect(container.querySelector('.bc-selection')).toBeNull()
    delete (document as { elementFromPoint?: unknown }).elementFromPoint
  })

  it('spans columns and commits an all-day range when a drag crosses days', () => {
    const { fn: onSelectSlot, props: slotProps } = slotSpy()
    const { container } = renderGrid({ defaultView: Views.WEEK, selectable: true, ...slotProps })
    // Cells are global-indexed (col*48 + row). Anchor on day 0 (row 10), drag to
    // day 1 (row 5): jsdom has no layout, so resolve the move to day 1's cell.
    const cells = container.querySelectorAll('.bc-time-slot')
    document.elementFromPoint = () => cells[48 + 5] as Element

    fireEvent.pointerDown(cells[10] as HTMLElement, { button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(window, { clientX: 200, clientY: 60 })

    // Two overlay boxes: day 0 fills from its slot to the bottom, day 1 from the top.
    const overlays = container.querySelectorAll('.bc-selection')
    expect(overlays.length).toBe(2)
    expect((overlays[0] as HTMLElement).style.getPropertyValue('--bc-top')).toBe(String(10 / 48))
    expect((overlays[0] as HTMLElement).style.getPropertyValue('--bc-height')).toBe(String(38 / 48))
    expect((overlays[1] as HTMLElement).style.getPropertyValue('--bc-top')).toBe('0')
    expect((overlays[1] as HTMLElement).style.getPropertyValue('--bc-height')).toBe(String(6 / 48))

    fireEvent.pointerUp(window)
    expect(onSelectSlot).toHaveBeenCalledTimes(1)
    const arg = onSelectSlot.mock.calls[0]![0] as { allDay: boolean; slots: string[]; start: string }
    // Cross-day → an all-day span that keeps instant times + per-slot list:
    // day 0 rows 10..47 (38) + day 1 rows 0..5 (6) = 44 slots.
    expect(arg.allDay).toBe(true)
    expect(arg.slots).toHaveLength(44)
    expect(arg.start).toBe(arg.slots[0])
    delete (document as { elementFromPoint?: unknown }).elementFromPoint
  })

  it('selects whole days from the all-day row, painting a band and committing an all-day range', () => {
    const { fn: onSelectSlot, props: slotProps } = slotSpy()
    const { container } = renderGrid({ defaultView: Views.WEEK, selectable: true, ...slotProps })
    // One hit cell per visible day, linear day-indexed (== range.days order).
    const cells = container.querySelectorAll('.bc-allday-slot')
    expect(cells.length).toBe(7)
    expect((cells[0] as HTMLElement).dataset.slotIndex).toBe('0')
    expect((cells[2] as HTMLElement).dataset.slotIndex).toBe('2')
    // jsdom has no layout → resolve the drag head to day 2's all-day cell.
    document.elementFromPoint = () => cells[2] as Element

    fireEvent.pointerDown(cells[0] as HTMLElement, { button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(window, { clientX: 60, clientY: 0 })

    // Band spans the selected day columns (days 0..2 → 1-based left 1, span 3).
    const band = container.querySelector('.bc-selection-allday') as HTMLElement
    expect(band).not.toBeNull()
    expect(band.style.getPropertyValue('--bc-seg-left')).toBe('1')
    expect(band.style.getPropertyValue('--bc-seg-span')).toBe('3')

    fireEvent.pointerUp(window)
    expect(container.querySelector('.bc-selection-allday')).toBeNull()
    expect(onSelectSlot).toHaveBeenCalledTimes(1)
    const arg = onSelectSlot.mock.calls[0]![0] as { allDay: boolean; slots: string[] }
    // Whole-day selection over 3 days.
    expect(arg.allDay).toBe(true)
    expect(arg.slots).toHaveLength(3)
    delete (document as { elementFromPoint?: unknown }).elementFromPoint
  })

  it('roves time-slot focus with the arrows and extends + commits a timed range with the keyboard', () => {
    const { fn: onSelectSlot, props: slotProps } = slotSpy()
    const { container } = renderGrid({ defaultView: Views.WEEK, selectable: true, ...slotProps })
    const cells = container.querySelectorAll('.bc-time-slot') // 7 days × 48 slots
    const focusCell = (el: Element) => act(() => (el as HTMLElement).focus())
    expect((cells[0] as HTMLElement).tabIndex).toBe(0)

    // Interior: down/up step a slot, right/left step a day column (±48).
    focusCell(cells[58]!)
    fireEvent.keyDown(cells[58] as HTMLElement, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(cells[59])
    fireEvent.keyDown(cells[59] as HTMLElement, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(cells[58])
    fireEvent.keyDown(cells[58] as HTMLElement, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(cells[106])
    fireEvent.keyDown(cells[106] as HTMLElement, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(cells[58])

    // Edges resolve to no neighbor.
    focusCell(cells[0]!)
    fireEvent.keyDown(cells[0] as HTMLElement, { key: 'ArrowUp' }) // top slot
    fireEvent.keyDown(cells[0] as HTMLElement, { key: 'ArrowLeft' }) // first day
    expect(document.activeElement).toBe(cells[0])
    focusCell(cells[47]!)
    fireEvent.keyDown(cells[47] as HTMLElement, { key: 'ArrowDown' }) // bottom slot
    expect(document.activeElement).toBe(cells[47])
    focusCell(cells[335]!)
    fireEvent.keyDown(cells[335] as HTMLElement, { key: 'ArrowRight' }) // last day
    expect(document.activeElement).toBe(cells[335])

    // Shift+Arrow extends within the day; Enter commits a timed (not all-day) range.
    focusCell(cells[58]!)
    fireEvent.keyDown(cells[58] as HTMLElement, { key: 'ArrowDown', shiftKey: true })
    fireEvent.keyDown(cells[59] as HTMLElement, { key: 'Enter' })
    expect(onSelectSlot).toHaveBeenCalledTimes(1)
    const arg = onSelectSlot.mock.calls[0]![0] as { action: string; allDay: boolean; slots: string[] }
    expect(arg.action).toBe('select')
    expect(arg.allDay).toBe(false)
    expect(arg.slots).toHaveLength(2)
  })

  it('roves all-day focus with left/right and commits a whole-day range with the keyboard', () => {
    const { fn: onSelectSlot, props: slotProps } = slotSpy()
    const { container } = renderGrid({ defaultView: Views.WEEK, selectable: true, ...slotProps })
    const cells = container.querySelectorAll('.bc-allday-slot')
    const focusCell = (el: Element) => act(() => (el as HTMLElement).focus())
    expect(cells.length).toBe(7)

    focusCell(cells[0]!)
    fireEvent.keyDown(cells[0] as HTMLElement, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(cells[1])
    fireEvent.keyDown(cells[1] as HTMLElement, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(cells[0])
    // No vertical movement in the single-row all-day strip, and the ends have no
    // horizontal neighbor.
    fireEvent.keyDown(cells[0] as HTMLElement, { key: 'ArrowDown' })
    fireEvent.keyDown(cells[0] as HTMLElement, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(cells[0])
    focusCell(cells[6]!)
    fireEvent.keyDown(cells[6] as HTMLElement, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(cells[6])

    focusCell(cells[0]!)
    fireEvent.keyDown(cells[0] as HTMLElement, { key: 'ArrowRight', shiftKey: true })
    fireEvent.keyDown(cells[1] as HTMLElement, { key: 'Enter' })
    expect(onSelectSlot).toHaveBeenCalledTimes(1)
    const arg = onSelectSlot.mock.calls[0]![0] as { action: string; allDay: boolean; slots: string[] }
    expect(arg.action).toBe('select')
    expect(arg.allDay).toBe(true)
    expect(arg.slots).toHaveLength(2)
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
