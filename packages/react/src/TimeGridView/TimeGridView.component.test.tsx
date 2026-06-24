import { Views } from '@big-calendar/core'
import type { CalendarStore } from '@big-calendar/core'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { CalendarProvider, useCalendarContext } from '../CalendarProvider'
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
  { id: 4, title: 'Conference', allDay: true, ...allDayBounds },
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
    heading = localizer.format({ value: dayStart, format: 'dayColumnHeader' })
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

  it('renders a dashed resize-preview box from store.dragPreview and clears it', () => {
    let store!: CalendarStore<Event>
    function Capture() {
      store = useCalendarContext<Event>().store
      return null
    }
    const { container } = render(
      <CalendarProvider<Event>
        localizer={localizer}
        defaultDate={focus}
        defaultView={Views.DAY}
        events={events}
        getNow={() => NOW}
        onEventResize={() => {}}
      >
        <TimeGridView />
        <Capture />
      </CalendarProvider>,
    )
    expect(container.querySelector('.bc-drag-preview')).toBeNull()

    // Resize event 1's end down to 11:00 (slot end → 11:30): preview spans 9:00–11:30.
    act(() => store.previewResize({ id: 1, edge: 'end', target: '2026-06-15T11:00:00.000Z' }))
    const box = container.querySelector('.bc-drag-preview') as HTMLElement
    expect(box).not.toBeNull()
    expect(box.style.getPropertyValue('--bc-top')).toBe(String(9 / 24)) // 09:00 of a 24h column
    // 9:00 → 11:30 = 2.5h of a 24h column (subtraction → compare with tolerance).
    expect(Number(box.style.getPropertyValue('--bc-height'))).toBeCloseTo(2.5 / 24, 10)

    act(() => store.clearDragPreview())
    expect(container.querySelector('.bc-drag-preview')).toBeNull()
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

  it('shows a full-height overlay on middle columns when a drag spans three or more days', () => {
    const { container } = renderGrid({ defaultView: Views.WEEK, selectable: true })
    // Anchor on day 0 slot 10, drag to day 2 slot 5 (global index 2*48+5 = 101).
    const cells = container.querySelectorAll('.bc-time-slot')
    document.elementFromPoint = () => cells[2 * 48 + 5] as Element

    fireEvent.pointerDown(cells[10] as HTMLElement, { button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(window, { clientX: 400, clientY: 60 })

    // Three overlay boxes: day 0 partial, day 1 full-height, day 2 partial.
    const overlays = container.querySelectorAll('.bc-selection')
    expect(overlays.length).toBe(3)
    // Day 1 (middle) spans the full column: top=0, height=1.
    expect((overlays[1] as HTMLElement).style.getPropertyValue('--bc-top')).toBe('0')
    expect((overlays[1] as HTMLElement).style.getPropertyValue('--bc-height')).toBe('1')

    fireEvent.pointerUp(window)
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
      format: 'dayColumnHeader',
    })
    expect(container.querySelector('.bc-now-indicator')).toBeNull()
    expect(screen.getByText(heading16).classList.contains('bc-today')).toBe(false)
  })

  it('omits the now-line when now falls outside the visible time window', () => {
    // window 13:00–14:00, but NOW is 12:00 → before the column, so no line
    const { container } = renderGrid({
      min: { hour: 13 },
      max: { hour: 14 },
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
    // 3 all-day events, limit=2 → 1 overflows
    const { container } = renderGrid()
    expect((container.querySelector('.bc-show-more') as HTMLElement).textContent).toBe('+1 more')
  })

  it('lists the overflowed all-day events in the show-more popover when opened', () => {
    // 3 all-day events, limit=2 → 1 overflows into the popover
    const { container } = renderGrid()
    const showMore = container.querySelector('.bc-show-more') as HTMLElement
    expect(container.querySelectorAll('.bc-popover .bc-segment').length).toBe(0)

    const panel = document.getElementById(showMore.getAttribute('aria-controls') ?? '')
    if (!panel) throw new Error('popover panel not found')
    fireEvent(panel, Object.assign(new Event('toggle'), { newState: 'open' }))

    expect(container.querySelectorAll('.bc-popover .bc-segment').length).toBe(1)
    expect(screen.getAllByText('Holiday').length).toBeGreaterThan(0)
  })

  it('honors slot overrides (dayHeading / timeLabel / event / allDayEvent / showMore)', () => {
    renderGrid({
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
    // two all-day segments fit the two rows; the third overflows
    expect(screen.getAllByTestId('custom-allday').length).toBe(2)
    expect(screen.getByTestId('custom-more').textContent).toBe('+1 more')
  })
})

describe.each(LOCALIZER_CASES)('TimeGridView keyboard DnD [$name]', ({ create }) => {
  let localizer: Awaited<ReturnType<typeof create>>
  beforeAll(async () => {
    localizer = await create()
  })

  const timed: Event[] = [
    { id: 1, title: 'Standup', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T10:00:00.000Z' },
    { id: 3, title: 'Holiday', allDay: true, ...allDayBounds },
  ]

  function renderGrid(extra?: Partial<CalendarProviderProps<Event>>) {
    return render(
      <CalendarProvider<Event>
        localizer={localizer}
        defaultDate={focus}
        defaultView={Views.DAY}
        events={timed}
        getNow={() => NOW}
        {...extra}
      >
        <TimeGridView />
      </CalendarProvider>,
    )
  }

  const grab = (btn: HTMLElement) => act(() => void fireEvent.keyDown(btn, { key: ' ' }))
  const press = (btn: HTMLElement, key: string, shiftKey = false) =>
    act(() => void fireEvent.keyDown(btn, { key, shiftKey }))

  it('Space picks a timed event up (aria-grabbed + announcement) without opening it', () => {
    const onEventClick = vi.fn()
    renderGrid({ onEventClick })
    const btn = screen.getByRole('button', { name: /Standup/ })
    grab(btn)
    expect(btn.getAttribute('aria-grabbed')).toBe('true')
    expect(screen.getByRole('status').textContent).toMatch(/Picked up/)
    expect(onEventClick).not.toHaveBeenCalled() // Space grabbed, did not open
  })

  it('ArrowDown then Enter commits a move via onEventDrop', () => {
    const onEventDrop = vi.fn()
    renderGrid({ onEventDrop, step: 30 })
    const btn = screen.getByRole('button', { name: /Standup/ })
    grab(btn)
    press(btn, 'ArrowDown') // one slot later
    press(btn, 'Enter')
    expect(onEventDrop).toHaveBeenCalledTimes(1)
    expect(onEventDrop.mock.calls[0]![0]).toMatchObject({
      start: localizer.add({ value: timed[0]!.start, amount: 30, unit: 'minute' }),
      end: localizer.add({ value: timed[0]!.end, amount: 30, unit: 'minute' }),
    })
  })

  it('Shift+ArrowDown then Enter resizes the end via onEventResize', () => {
    const onEventResize = vi.fn()
    renderGrid({ onEventResize, step: 30 })
    const btn = screen.getByRole('button', { name: /Standup/ })
    grab(btn)
    press(btn, 'ArrowDown', true) // grow the end edge one slot
    press(btn, 'Enter')
    expect(onEventResize).toHaveBeenCalledTimes(1)
    expect(onEventResize.mock.calls[0]![0]).toMatchObject({
      start: timed[0]!.start,
      end: localizer.add({ value: timed[0]!.end, amount: 30, unit: 'minute' }),
    })
  })

  it('Escape cancels the grab and fires nothing', () => {
    const onEventDrop = vi.fn()
    renderGrid({ onEventDrop, step: 30 })
    const btn = screen.getByRole('button', { name: /Standup/ })
    grab(btn)
    press(btn, 'ArrowDown')
    press(btn, 'Escape')
    expect(onEventDrop).not.toHaveBeenCalled()
    expect(btn.getAttribute('aria-grabbed')).toBeNull()
    expect(screen.getByRole('status').textContent).toMatch(/cancelled/i)
  })

  it('the all-day row is not grabbable', () => {
    const onEventDrop = vi.fn()
    renderGrid({ onEventDrop, step: 30 })
    const btn = screen.getByRole('button', { name: /Holiday/ })
    grab(btn)
    expect(btn.getAttribute('aria-grabbed')).toBeNull()
    press(btn, 'ArrowDown')
    press(btn, 'Enter')
    expect(onEventDrop).not.toHaveBeenCalled()
  })

  it('ArrowUp then Enter moves the event one slot earlier via onEventDrop', () => {
    const onEventDrop = vi.fn()
    renderGrid({ onEventDrop, step: 30 })
    const btn = screen.getByRole('button', { name: /Standup/ })
    grab(btn)
    press(btn, 'ArrowUp') // one slot earlier
    press(btn, 'Enter')
    expect(onEventDrop).toHaveBeenCalledTimes(1)
    expect(onEventDrop.mock.calls[0]![0]).toMatchObject({
      start: localizer.add({ value: timed[0]!.start, amount: -30, unit: 'minute' }),
      end: localizer.add({ value: timed[0]!.end, amount: -30, unit: 'minute' }),
    })
  })

  it('ArrowLeft then Enter moves the event one day earlier via onEventDrop', () => {
    const onEventDrop = vi.fn()
    renderGrid({ onEventDrop, step: 30 })
    const btn = screen.getByRole('button', { name: /Standup/ })
    grab(btn)
    press(btn, 'ArrowLeft')
    press(btn, 'Enter')
    expect(onEventDrop).toHaveBeenCalledTimes(1)
    expect(onEventDrop.mock.calls[0]![0]).toMatchObject({
      start: localizer.add({ value: timed[0]!.start, amount: -1, unit: 'day' }),
      end: localizer.add({ value: timed[0]!.end, amount: -1, unit: 'day' }),
    })
  })

  it('ArrowRight then Enter moves the event one day later via onEventDrop', () => {
    const onEventDrop = vi.fn()
    renderGrid({ onEventDrop, step: 30 })
    const btn = screen.getByRole('button', { name: /Standup/ })
    grab(btn)
    press(btn, 'ArrowRight')
    press(btn, 'Enter')
    expect(onEventDrop).toHaveBeenCalledTimes(1)
    expect(onEventDrop.mock.calls[0]![0]).toMatchObject({
      start: localizer.add({ value: timed[0]!.start, amount: 1, unit: 'day' }),
      end: localizer.add({ value: timed[0]!.end, amount: 1, unit: 'day' }),
    })
  })

  describe('with resources (day view)', () => {
    interface ResEvent extends Event {
      resourceId?: string
    }
    interface Resource {
      id: string
      title: string
    }
    const resources: Resource[] = [
      { id: 'r1', title: 'Board room' },
      { id: 'r2', title: 'Training room' },
    ]
    const resEvents: ResEvent[] = [
      { id: 1, title: 'Board mtg', resourceId: 'r1', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T10:00:00.000Z' },
      { id: 2, title: 'Class', resourceId: 'r2', start: '2026-06-15T11:00:00.000Z', end: '2026-06-15T12:00:00.000Z' },
      { id: 3, title: 'Board holiday', resourceId: 'r1', allDay: true, ...allDayBounds },
    ]

    function renderResourceGrid() {
      return render(
        <CalendarProvider<ResEvent>
          localizer={localizer}
          defaultDate={focus}
          defaultView={Views.DAY}
          events={resEvents}
          resources={resources}
          getNow={() => NOW}
        >
          <TimeGridView />
        </CalendarProvider>,
      )
    }

    it('renders one single-tier title header per resource', () => {
      renderResourceGrid()
      expect(screen.getByText('Board room')).toBeTruthy()
      expect(screen.getByText('Training room')).toBeTruthy()
    })

    it('renders one time column per resource carrying data-bc-resource', () => {
      const { container } = renderResourceGrid()
      const columns = container.querySelectorAll('.bc-day-column[data-bc-resource]')
      expect(columns).toHaveLength(2)
      expect(container.querySelector('.bc-day-column[data-bc-resource="r1"]')).toBeTruthy()
      expect(container.querySelector('.bc-day-column[data-bc-resource="r2"]')).toBeTruthy()
    })

    it('places each timed event in its own resource column', () => {
      const { container } = renderResourceGrid()
      const board = container.querySelector<HTMLElement>('.bc-day-column[data-bc-resource="r1"]')!
      const training = container.querySelector<HTMLElement>('.bc-day-column[data-bc-resource="r2"]')!
      expect(board.textContent).toContain('Board mtg')
      expect(board.textContent).not.toContain('Class')
      expect(training.textContent).toContain('Class')
    })

    it('routes a resource all-day event to that resource lane only', () => {
      const { container } = renderResourceGrid()
      const lanes = container.querySelectorAll<HTMLElement>('.bc-allday-resource[data-bc-resource]')
      expect(lanes).toHaveLength(2)
      const r1Lane = container.querySelector<HTMLElement>('.bc-allday-resource[data-bc-resource="r1"]')!
      const r2Lane = container.querySelector<HTMLElement>('.bc-allday-resource[data-bc-resource="r2"]')!
      expect(r1Lane.textContent).toContain('Board holiday')
      expect(r2Lane.textContent).not.toContain('Board holiday')
    })

    it('shows a selection overlay in the anchored resource column during a drag', () => {
      const { container } = render(
        <CalendarProvider<ResEvent>
          localizer={localizer}
          defaultDate={focus}
          defaultView={Views.DAY}
          events={resEvents}
          resources={resources}
          getNow={() => NOW}
          selectable
        >
          <TimeGridView />
        </CalendarProvider>,
      )
      const r1Col = container.querySelector<HTMLElement>('.bc-day-column[data-bc-resource="r1"]')!
      const slots = r1Col.querySelectorAll('.bc-time-slot')
      document.elementFromPoint = () => slots[5] as Element

      fireEvent.pointerDown(slots[2] as HTMLElement, { button: 0, clientX: 0, clientY: 0 })
      fireEvent.pointerMove(window, { clientX: 0, clientY: 60 })

      expect(r1Col.querySelector('.bc-selection')).not.toBeNull()

      fireEvent.pointerUp(window)
      delete (document as { elementFromPoint?: unknown }).elementFromPoint
    })
  })

  describe('with resources (week view)', () => {
    interface ResEvent extends Event {
      resourceId?: string
    }
    interface Resource {
      id: string
      title: string
    }
    const resources: Resource[] = [
      { id: 'r1', title: 'Board room' },
      { id: 'r2', title: 'Training room' },
    ]
    const resEvents: ResEvent[] = [
      { id: 1, title: 'Board mtg', resourceId: 'r1', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T10:00:00.000Z' },
      { id: 2, title: 'Class', resourceId: 'r2', start: '2026-06-15T11:00:00.000Z', end: '2026-06-15T12:00:00.000Z' },
      { id: 3, title: 'Board holiday', resourceId: 'r1', allDay: true, ...allDayBounds },
      { id: 4, title: 'Board conf', resourceId: 'r1', allDay: true, ...allDayBounds },
      { id: 5, title: 'Board off', resourceId: 'r1', allDay: true, ...allDayBounds },
    ]

    function renderResourceWeek() {
      return render(
        <CalendarProvider<ResEvent>
          localizer={localizer}
          defaultDate={focus}
          defaultView={Views.WEEK}
          events={resEvents}
          resources={resources}
          getNow={() => NOW}
        >
          <TimeGridView />
        </CalendarProvider>,
      )
    }

    it('renders a two-tier header: resource titles over day names', () => {
      const { container } = renderResourceWeek()
      expect(container.querySelector('.bc-time-header-tiered')).toBeTruthy()
      expect(screen.getByText('Board room')).toBeTruthy()
      expect(screen.getByText('Training room')).toBeTruthy()
      // Day-name tier: one heading per visible day per resource (7 days × 2).
      expect(container.querySelectorAll('.bc-day-heading')).toHaveLength(14)
    })

    it('lays out one body column per resource per visible day (resource-major)', () => {
      const { container } = renderResourceWeek()
      expect(container.querySelectorAll('.bc-day-column[data-bc-resource="r1"]')).toHaveLength(7)
      expect(container.querySelectorAll('.bc-day-column[data-bc-resource="r2"]')).toHaveLength(7)
    })

    it('places each timed event in its own resource column', () => {
      const { container } = renderResourceWeek()
      const r1Cols = Array.from(container.querySelectorAll<HTMLElement>('.bc-day-column[data-bc-resource="r1"]'))
      const r2Cols = Array.from(container.querySelectorAll<HTMLElement>('.bc-day-column[data-bc-resource="r2"]'))
      expect(r1Cols.some((c) => c.textContent?.includes('Board mtg'))).toBe(true)
      expect(r1Cols.some((c) => c.textContent?.includes('Class'))).toBe(false)
      expect(r2Cols.some((c) => c.textContent?.includes('Class'))).toBe(true)
    })

    it('routes a resource all-day event to that resource lane only', () => {
      const { container } = renderResourceWeek()
      const lanes = container.querySelectorAll<HTMLElement>('.bc-allday-resource-week[data-bc-resource]')
      expect(lanes).toHaveLength(2)
      const r1Lane = container.querySelector<HTMLElement>('.bc-allday-resource-week[data-bc-resource="r1"]')!
      const r2Lane = container.querySelector<HTMLElement>('.bc-allday-resource-week[data-bc-resource="r2"]')!
      expect(r1Lane.textContent).toContain('Board holiday')
      expect(r2Lane.textContent).not.toContain('Board holiday')
    })

    it('overflows all-day events to the ShowMore indicator in resource-major week lanes', () => {
      const { container } = render(
        <CalendarProvider<ResEvent>
          localizer={localizer}
          defaultDate={focus}
          defaultView={Views.WEEK}
          events={resEvents}
          resources={resources}
          getNow={() => NOW}
        >
          <TimeGridView />
        </CalendarProvider>,
      )
      // r1 has 3 all-day events; limit=2 → 1 overflows to ShowMore.
      const r1Lane = container.querySelector<HTMLElement>('.bc-allday-resource-week[data-bc-resource="r1"]')!
      expect(r1Lane.querySelector('.bc-show-more')).toBeTruthy()
    })

    it('drills into a day when its heading is clicked (resource-major week)', () => {
      const onDrillDown = vi.fn()
      const { container } = render(
        <CalendarProvider<ResEvent>
          localizer={localizer}
          defaultDate={focus}
          defaultView={Views.WEEK}
          events={resEvents}
          resources={resources}
          getNow={() => NOW}
          onDrillDown={onDrillDown}
        >
          <TimeGridView />
        </CalendarProvider>,
      )
      // There are 14 headings (7 days × 2 resources); click any one.
      const heading = container.querySelectorAll<HTMLElement>('.bc-day-heading')[0]!
      fireEvent.click(heading)
      expect(onDrillDown).toHaveBeenCalledTimes(1)
    })

    it('renders background events in resource columns', () => {
      const bgEvents: ResEvent[] = [
        { id: 10, title: 'Busy', resourceId: 'r1', start: '2026-06-15T13:00:00.000Z', end: '2026-06-15T14:00:00.000Z' },
      ]
      const { container } = render(
        <CalendarProvider<ResEvent>
          localizer={localizer}
          defaultDate={focus}
          defaultView={Views.WEEK}
          events={resEvents}
          backgroundEvents={bgEvents}
          resources={resources}
          getNow={() => NOW}
        >
          <TimeGridView />
        </CalendarProvider>,
      )
      // Background event appears in at least one r1 column for that day.
      const r1Cols = Array.from(container.querySelectorAll<HTMLElement>('.bc-day-column[data-bc-resource="r1"]'))
      expect(r1Cols.some((c) => c.querySelector('.bc-bg-event') !== null)).toBe(true)
    })
  })

  describe('with resources and resourceLayout:"day" (day-major, week view)', () => {
    interface ResEvent extends Event {
      resourceId?: string
    }
    interface Resource {
      id: string
      title: string
    }
    const resources: Resource[] = [
      { id: 'r1', title: 'Board room' },
      { id: 'r2', title: 'Training room' },
    ]
    const resEvents: ResEvent[] = [
      { id: 1, title: 'Board mtg', resourceId: 'r1', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T10:00:00.000Z' },
      { id: 2, title: 'Class', resourceId: 'r2', start: '2026-06-15T11:00:00.000Z', end: '2026-06-15T12:00:00.000Z' },
      { id: 3, title: 'Board holiday', resourceId: 'r1', allDay: true, ...allDayBounds },
    ]

    function renderDayMajorWeek() {
      return render(
        <CalendarProvider<ResEvent>
          localizer={localizer}
          defaultDate={focus}
          defaultView={Views.WEEK}
          events={resEvents}
          resources={resources}
          resourceLayout="day"
          getNow={() => NOW}
        >
          <TimeGridView />
        </CalendarProvider>,
      )
    }

    it('renders the day-major container class', () => {
      const { container } = renderDayMajorWeek()
      expect(container.querySelector('.bc-time-grid-resources-day-major')).toBeTruthy()
    })

    it('renders a two-tier header: day names on row 1, resource names on row 2', () => {
      const { container } = renderDayMajorWeek()
      expect(container.querySelector('.bc-time-header-tiered')).toBeTruthy()
      // Row 1: one day-major header cell per visible day (7 days).
      expect(container.querySelectorAll('.bc-day-major-header')).toHaveLength(7)
      // Row 2: resource labels — one per (day × resource) cell (7 × 2 = 14).
      expect(container.querySelectorAll('.bc-resource-header-label')).toHaveLength(14)
      // Both resource names appear.
      expect(screen.getAllByText('Board room').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Training room').length).toBeGreaterThan(0)
    })

    it('renders one body column per (day × resource) cell in day-first order', () => {
      const { container } = renderDayMajorWeek()
      // 7 days × 2 resources = 14 leaf columns.
      const allCols = container.querySelectorAll('.bc-day-column[data-bc-resource]')
      expect(allCols).toHaveLength(14)
      expect(container.querySelectorAll('.bc-day-column[data-bc-resource="r1"]')).toHaveLength(7)
      expect(container.querySelectorAll('.bc-day-column[data-bc-resource="r2"]')).toHaveLength(7)
    })

    it('renders one all-day lane per (day × resource) cell', () => {
      const { container } = renderDayMajorWeek()
      // 7 days × 2 resources = 14 stacked all-day lanes.
      expect(container.querySelectorAll('.bc-allday-resource[data-bc-resource]')).toHaveLength(14)
    })

    it('places each timed event in its (day, resource) column only', () => {
      const { container } = renderDayMajorWeek()
      const r1Cols = Array.from(container.querySelectorAll<HTMLElement>('.bc-day-column[data-bc-resource="r1"]'))
      const r2Cols = Array.from(container.querySelectorAll<HTMLElement>('.bc-day-column[data-bc-resource="r2"]'))
      expect(r1Cols.some((c) => c.textContent?.includes('Board mtg'))).toBe(true)
      expect(r2Cols.some((c) => c.textContent?.includes('Board mtg'))).toBe(false)
      expect(r2Cols.some((c) => c.textContent?.includes('Class'))).toBe(true)
      expect(r1Cols.some((c) => c.textContent?.includes('Class'))).toBe(false)
    })

    it('routes a resource all-day event to that resource lanes only', () => {
      const { container } = renderDayMajorWeek()
      const r1Lanes = Array.from(container.querySelectorAll<HTMLElement>('.bc-allday-resource[data-bc-resource="r1"]'))
      const r2Lanes = Array.from(container.querySelectorAll<HTMLElement>('.bc-allday-resource[data-bc-resource="r2"]'))
      expect(r1Lanes.some((l) => l.textContent?.includes('Board holiday'))).toBe(true)
      expect(r2Lanes.some((l) => l.textContent?.includes('Board holiday'))).toBe(false)
    })

    it('renders background events in day-major resource columns', () => {
      const bgEvents: ResEvent[] = [
        { id: 10, title: 'Busy', resourceId: 'r1', start: '2026-06-15T13:00:00.000Z', end: '2026-06-15T14:00:00.000Z' },
      ]
      const { container } = render(
        <CalendarProvider<ResEvent>
          localizer={localizer}
          defaultDate={focus}
          defaultView={Views.WEEK}
          events={resEvents}
          backgroundEvents={bgEvents}
          resources={resources}
          resourceLayout="day"
          getNow={() => NOW}
        >
          <TimeGridView />
        </CalendarProvider>,
      )
      expect(container.querySelector('.bc-bg-event')).toBeTruthy()
    })

    it('renders a dashed resize-preview box in a day-major resource column', () => {
      let store!: CalendarStore<ResEvent>
      function Capture() {
        store = useCalendarContext<ResEvent>().store
        return null
      }
      const { container } = render(
        <CalendarProvider<ResEvent>
          localizer={localizer}
          defaultDate={focus}
          defaultView={Views.WEEK}
          events={resEvents}
          resources={resources}
          resourceLayout="day"
          getNow={() => NOW}
          onEventResize={() => {}}
        >
          <TimeGridView />
          <Capture />
        </CalendarProvider>,
      )
      expect(container.querySelector('.bc-drag-preview')).toBeNull()
      // Resize Board mtg (id 1) end to 11:00 — preview covers 09:00–11:00.
      act(() => store.previewResize({ id: 1, edge: 'end', target: '2026-06-15T11:00:00.000Z' }))
      expect(container.querySelector('.bc-drag-preview')).not.toBeNull()
      act(() => store.clearDragPreview())
      expect(container.querySelector('.bc-drag-preview')).toBeNull()
    })
  })

  describe('scrollToTime', () => {
    let scrollTo: ReturnType<typeof vi.fn>

    beforeEach(() => {
      scrollTo = vi.fn()
      // JSDOM does not define scrollTo on HTMLElement — add it directly.
      Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
        configurable: true, writable: true, value: scrollTo,
      })
      // JSDOM does not implement layout so offsetHeight is always 0.
      // Return 1440 for .bc-day-column to simulate a 1px-per-minute column.
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
        configurable: true,
        get() {
          return (this as HTMLElement).classList.contains('bc-day-column') ? 1440 : 0
        },
      })
    })

    afterEach(() => {
      // Both properties were added only for this suite — delete them entirely.
      delete (HTMLElement.prototype as Record<string, unknown>).scrollTo
      delete (HTMLElement.prototype as Record<string, unknown>).offsetHeight
    })

    it('scrolls to current time when scrollToTime is not set', () => {
      // NOW = 2026-06-15T12:00:00.000Z → 12:00 in UTC → 720 min from midnight.
      // Full 24-hour column (1440 px) → fraction 720/1440 = 0.5 → scrollTop 720.
      renderGrid()
      expect(scrollTo).toHaveBeenCalledTimes(1)
      expect(scrollTo).toHaveBeenCalledWith({ top: 720, behavior: 'instant' })
    })

    it('scrolls to the configured hour when scrollToTime is set', () => {
      // scrollToTime { hour: 8 } → 480 min. Full 24h column → 480 px.
      renderGrid({ scrollToTime: { hour: 8 } })
      expect(scrollTo).toHaveBeenCalledTimes(1)
      expect(scrollTo).toHaveBeenCalledWith({ top: 480, behavior: 'instant' })
    })

    it('scrolls to the configured hour + minute', () => {
      // scrollToTime { hour: 8, minute: 30 } → 510 min → 510 px.
      renderGrid({ scrollToTime: { hour: 8, minute: 30 } })
      expect(scrollTo).toHaveBeenCalledTimes(1)
      expect(scrollTo).toHaveBeenCalledWith({ top: 510, behavior: 'instant' })
    })

    it('clamps to top when scrollToTime is before min', () => {
      // min: { hour: 8 } → visible window 08:00–24:00 (960 min).
      // scrollToTime { hour: 6 } is before the window → clamped to top → scrollTop 0.
      renderGrid({ min: { hour: 8 }, scrollToTime: { hour: 6 } })
      expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' })
    })

    it('clamps to bottom when scrollToTime is after max', () => {
      // max: { hour: 18 } → visible window 00:00–18:00 (1080 min).
      // scrollToTime { hour: 20 } is after the window → clamped to bottom → scrollTop 1440.
      renderGrid({ max: { hour: 18 }, scrollToTime: { hour: 20 } })
      expect(scrollTo).toHaveBeenCalledWith({ top: 1440, behavior: 'instant' })
    })
  })
})
