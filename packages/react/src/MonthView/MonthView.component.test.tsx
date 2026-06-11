import { Views } from '@big-calendar/core'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { CalendarProvider, useCalendarContext, useCalendarStore } from '../CalendarProvider'
import type { CalendarProviderProps } from '../CalendarProvider'
import type { MonthEventProps } from '../components.type'
import { LOCALIZER_CASES } from '../testing/localizers'
import MonthView from './MonthView.component'

function DndEnabler() {
  const { store } = useCalendarContext()
  useEffect(() => {
    store.dndEnabled.value = true
    return () => { store.dndEnabled.value = false }
  }, [store])
  return null
}

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

  it('places the "+N more" indicator in the overflowing day cell, not the week start', () => {
    const { container } = renderMonth({ weekEventLimit: 1 })
    const cells = container.querySelectorAll('.bc-show-more-cell')
    // All three events are on Jun 15 (Monday), so exactly one cell overflows…
    expect(cells.length).toBe(1)
    // …in Monday's column (Sunday-first grid → column 2), not Sunday/the week start.
    expect((cells[0] as HTMLElement).style.getPropertyValue('--bc-seg-left')).toBe('2')
  })

  it('lists the overflowed events in the show-more popover when opened', () => {
    const { container } = renderMonth({ weekEventLimit: 1 })
    const showMore = container.querySelector('.bc-show-more') as HTMLElement
    // The trigger drives a native popover; nothing is listed until it opens.
    expect(container.querySelectorAll('.bc-popover-event').length).toBe(0)

    const panel = document.getElementById(showMore.getAttribute('aria-controls') ?? '')
    if (!panel) throw new Error('popover panel not found')
    fireEvent(panel, Object.assign(new Event('toggle'), { newState: 'open' }))

    expect(container.querySelectorAll('.bc-popover-event').length).toBe(2)
    expect(screen.getAllByText('Review').length).toBeGreaterThan(0)
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

  it('renders a per-day hit cell per visible day, tagged with its date + linear index', () => {
    // The slot cells are the base layer for pointer/keyboard day selection;
    // the index is linear across the whole grid (week * 7 + day), matching the
    // store's `range.days` order.
    const { container } = renderMonth()
    const cells = container.querySelectorAll('.bc-month-week .bc-month-slot')
    // 5 weeks × 7 days
    expect(cells.length).toBe(35)
    const first = cells[0] as HTMLElement
    const days = localizer.visibleDays(focus)
    expect(first.dataset.date).toBe(days[0])
    expect(first.dataset.slotIndex).toBe('0')
    expect((cells[34] as HTMLElement).dataset.slotIndex).toBe('34')
  })

  it('shows the day-selection band across the dragged columns and clears it on release', () => {
    const { container } = renderMonth({ selectable: true })
    const cells = container.querySelectorAll('.bc-month-slot')
    // jsdom has no layout → stub elementFromPoint to resolve to the drag head
    // (slot index 4, same first week as the anchor at index 2).
    document.elementFromPoint = () => cells[4] as Element

    fireEvent.pointerDown(cells[2] as HTMLElement, { button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(window, { clientX: 60, clientY: 0 })

    const overlay = container.querySelector('.bc-selection-month') as HTMLElement
    expect(overlay).not.toBeNull()
    // days 2..4 of week 0 → columns 3..5 (1-based): left 3, span 3
    expect(overlay.style.getPropertyValue('--bc-seg-left')).toBe('3')
    expect(overlay.style.getPropertyValue('--bc-seg-span')).toBe('3')

    fireEvent.pointerUp(window)
    expect(container.querySelector('.bc-selection-month')).toBeNull()
    delete (document as { elementFromPoint?: unknown }).elementFromPoint
  })

  it('roves day-cell focus with the arrows and extends + commits with the keyboard', () => {
    const { fn: onSelectSlot, props: slotProps } = slotSpy()
    const { container } = renderMonth({ selectable: true, ...slotProps })
    const cells = container.querySelectorAll('.bc-month-slot')
    const focusCell = (el: Element) => act(() => (el as HTMLElement).focus())
    // One tab stop: the first cell is focusable, the rest are -1.
    expect((cells[0] as HTMLElement).tabIndex).toBe(0)
    expect((cells[1] as HTMLElement).tabIndex).toBe(-1)

    // Edges return no neighbor (top row has no up, first column no left).
    focusCell(cells[0]!)
    fireEvent.keyDown(cells[0] as HTMLElement, { key: 'ArrowUp' })
    fireEvent.keyDown(cells[0] as HTMLElement, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(cells[0])
    // ...and the last cell has no right/down neighbor.
    focusCell(cells[34]!)
    fireEvent.keyDown(cells[34] as HTMLElement, { key: 'ArrowRight' })
    fireEvent.keyDown(cells[34] as HTMLElement, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(cells[34])

    // Every interior direction resolves (right/left a day, down/up a week).
    focusCell(cells[8]!)
    fireEvent.keyDown(cells[8] as HTMLElement, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(cells[9])
    fireEvent.keyDown(cells[9] as HTMLElement, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(cells[8])
    fireEvent.keyDown(cells[8] as HTMLElement, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(cells[1])
    fireEvent.keyDown(cells[1] as HTMLElement, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(cells[8])
    // The tab stop follows focus.
    expect((cells[8] as HTMLElement).tabIndex).toBe(0)
    expect((cells[0] as HTMLElement).tabIndex).toBe(-1)

    // Shift+Arrow extends the selection; Enter commits it as whole days.
    fireEvent.keyDown(cells[8] as HTMLElement, { key: 'ArrowRight', shiftKey: true })
    fireEvent.keyDown(cells[9] as HTMLElement, { key: 'Enter' })
    expect(onSelectSlot).toHaveBeenCalledTimes(1)
    const arg = onSelectSlot.mock.calls[0]![0] as { action: string; allDay: boolean; slots: string[] }
    expect(arg.action).toBe('select')
    expect(arg.allDay).toBe(true)
    expect(arg.slots).toHaveLength(2) // days 8..9
  })

  it('makes the event buttons one tab stop with arrow navigation', () => {
    const { container } = renderMonth() // three events on Jun 15 → three buttons
    const btns = container.querySelectorAll('[data-bc-event]')
    expect(btns.length).toBeGreaterThanOrEqual(2)
    // Exactly one event button is tabbable.
    expect((btns[0] as HTMLElement).tabIndex).toBe(0)
    expect((btns[1] as HTMLElement).tabIndex).toBe(-1)
    // Arrow moves focus + the tab stop to the next event button.
    act(() => (btns[0] as HTMLElement).focus())
    fireEvent.keyDown(btns[0] as HTMLElement, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(btns[1])
    expect((btns[1] as HTMLElement).tabIndex).toBe(0)
    expect((btns[0] as HTMLElement).tabIndex).toBe(-1)
  })

  it('emits ISO day bounds on a day click after the double-click window', () => {
    vi.useFakeTimers()
    try {
      const { fn: onSelectSlot, props: slotProps } = slotSpy()
      const { container } = renderMonth({ selectable: true, ...slotProps })
      const cells = container.querySelectorAll('.bc-month-slot')
      const days = localizer.visibleDays(focus)

      fireEvent.pointerDown(cells[3] as HTMLElement, { button: 0, clientX: 0, clientY: 0 })
      fireEvent.pointerUp(window)
      vi.advanceTimersByTime(250)

      expect(onSelectSlot).toHaveBeenCalledTimes(1)
      const arg = onSelectSlot.mock.calls[0]![0] as { action: string; start: string; slots: string[] }
      expect(arg.action).toBe('click')
      expect(arg.start).toBe(days[3])
      expect(arg.slots).toEqual([days[3]])
    } finally {
      vi.useRealTimers()
    }
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

  describe('multi-day resize handles + drag preview', () => {
    function renderMonthWithDnd(extra?: Partial<CalendarProviderProps<Event>>) {
      return render(
        <CalendarProvider<Event>
          localizer={localizer}
          defaultDate={focus}
          defaultView={Views.MONTH}
          events={events}
          getNow={() => NOW}
          {...extra}
        >
          <DndEnabler />
          <MonthView />
        </CalendarProvider>,
      )
    }

    it('renders both resize handles on a single-day segment when DnD is enabled', () => {
      renderMonthWithDnd()
      const seg = screen.getByText('Standup').closest('.bc-segment') as HTMLElement
      expect(seg.querySelector('[data-bc-resize="start"]')).not.toBeNull()
      expect(seg.querySelector('[data-bc-resize="end"]')).not.toBeNull()
    })

    it('splits the handles across week rows: start on the first row, end on the last', () => {
      // Jun 19 (Fri) → Jun 23 (Tue) spans week rows Jun14–20 and Jun21–27.
      const crossWeek: Event[] = [
        { id: 9, title: 'Trip', start: '2026-06-19T00:00:00.000Z', end: '2026-06-23T23:59:59.999Z' },
      ]
      const { container } = renderMonthWithDnd({ events: crossWeek })
      const starts = container.querySelectorAll('[data-bc-resize="start"]')
      const ends = container.querySelectorAll('[data-bc-resize="end"]')
      expect(starts.length).toBe(1)
      expect(ends.length).toBe(1)
      // The two handles live in different week segments (the event wraps a row).
      expect(starts[0]!.closest('.bc-segment')).not.toBe(ends[0]!.closest('.bc-segment'))
    })

    it('omits resize handles when DnD is not enabled', () => {
      const { container } = renderMonth()
      expect(container.querySelector('[data-bc-resize]')).toBeNull()
    })

    it('omits resize handles when the event is locked from resizing', () => {
      const { container } = renderMonthWithDnd({ resizableAccessor: () => false })
      expect(container.querySelector('[data-bc-resize]')).toBeNull()
    })

    it('paints a day-cell drag-preview band from a move preview', () => {
      let store: ReturnType<typeof useCalendarStore<Event>> | null = null
      function Capture() {
        store = useCalendarStore<Event>()
        return null
      }
      const { container } = render(
        <CalendarProvider<Event>
          localizer={localizer}
          defaultDate={focus}
          defaultView={Views.MONTH}
          events={events}
          getNow={() => NOW}
          onEventDrop={vi.fn()}
        >
          <MonthView />
          <Capture />
        </CalendarProvider>,
      )
      expect(container.querySelector('.bc-drag-preview-month')).toBeNull()
      // Move event 1 (Jun 15) three days → Jun 18, column 5 of its week row.
      act(() => {
        store!.previewMove({ id: 1, target: '2026-06-18T00:00:00.000Z', mode: 'day' })
      })
      const band = container.querySelector('.bc-drag-preview-month') as HTMLElement
      expect(band).not.toBeNull()
      expect(band.style.getPropertyValue('--bc-seg-left')).toBe('5')
      expect(band.style.getPropertyValue('--bc-seg-span')).toBe('1')
      // Clearing the preview removes the band.
      act(() => store!.clearDragPreview())
      expect(container.querySelector('.bc-drag-preview-month')).toBeNull()
    })

    it('paints a day-cell band for a whole-day drop-from-outside preview', () => {
      let store: ReturnType<typeof useCalendarStore<Event>> | null = null
      function Capture() {
        store = useCalendarStore<Event>()
        return null
      }
      const { container } = render(
        <CalendarProvider<Event>
          localizer={localizer}
          defaultDate={focus}
          defaultView={Views.MONTH}
          events={events}
          getNow={() => NOW}
          onDropFromOutside={vi.fn()}
        >
          <MonthView />
          <Capture />
        </CalendarProvider>,
      )
      act(() => store!.previewExternal({ target: '2026-06-18T00:00:00.000Z', mode: 'day' }))
      const band = container.querySelector('.bc-drag-preview-month') as HTMLElement
      expect(band).not.toBeNull()
      expect(band.style.getPropertyValue('--bc-seg-left')).toBe('5')
    })
  })
})

describe.each(LOCALIZER_CASES)('MonthView keyboard DnD [$name]', ({ create }) => {
  let localizer: Awaited<ReturnType<typeof create>>
  beforeAll(async () => {
    localizer = await create()
  })

  const one: Event[] = [{ id: 1, title: 'Standup', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T10:00:00.000Z' }]

  function renderMonth(extra?: Partial<CalendarProviderProps<Event>>) {
    return render(
      <CalendarProvider<Event>
        localizer={localizer}
        defaultDate={focus}
        defaultView={Views.MONTH}
        events={one}
        getNow={() => NOW}
        {...extra}
      >
        <MonthView />
      </CalendarProvider>,
    )
  }

  const grab = (btn: HTMLElement) => act(() => void fireEvent.keyDown(btn, { key: ' ' }))
  const press = (btn: HTMLElement, key: string, shiftKey = false) =>
    act(() => void fireEvent.keyDown(btn, { key, shiftKey }))

  it('Space picks a segment up (aria-grabbed + announcement) without opening it', () => {
    const onEventClick = vi.fn()
    renderMonth({ onEventClick })
    const btn = screen.getByRole('button', { name: /Standup/ })
    grab(btn)
    expect(btn.getAttribute('aria-grabbed')).toBe('true')
    expect(screen.getByRole('status').textContent).toMatch(/Picked up/)
    expect(onEventClick).not.toHaveBeenCalled()
  })

  it('ArrowRight then Enter moves the event one day via onEventDrop', () => {
    const onEventDrop = vi.fn()
    renderMonth({ onEventDrop })
    const btn = screen.getByRole('button', { name: /Standup/ })
    grab(btn)
    press(btn, 'ArrowRight')
    press(btn, 'Enter')
    expect(onEventDrop).toHaveBeenCalledTimes(1)
    expect(onEventDrop.mock.calls[0]![0]).toMatchObject({
      start: localizer.add({ value: one[0]!.start, amount: 1, unit: 'day' }),
      end: localizer.add({ value: one[0]!.end, amount: 1, unit: 'day' }),
    })
  })

  it('ArrowDown moves by a whole week', () => {
    const onEventDrop = vi.fn()
    renderMonth({ onEventDrop })
    const btn = screen.getByRole('button', { name: /Standup/ })
    grab(btn)
    press(btn, 'ArrowDown') // next week
    press(btn, 'Enter')
    expect(onEventDrop.mock.calls[0]![0]).toMatchObject({
      start: localizer.add({ value: one[0]!.start, amount: 7, unit: 'day' }),
    })
  })

  it('Shift+ArrowRight then Enter resizes the end by a day via onEventResize', () => {
    const onEventResize = vi.fn()
    renderMonth({ onEventResize })
    const btn = screen.getByRole('button', { name: /Standup/ })
    grab(btn)
    press(btn, 'ArrowRight', true) // grow the end edge one day
    press(btn, 'Enter')
    expect(onEventResize).toHaveBeenCalledTimes(1)
    expect(onEventResize.mock.calls[0]![0]).toMatchObject({
      start: one[0]!.start,
      end: localizer.add({ value: one[0]!.end, amount: 1, unit: 'day' }),
    })
  })

  it('Escape cancels the grab and fires nothing', () => {
    const onEventDrop = vi.fn()
    renderMonth({ onEventDrop })
    const btn = screen.getByRole('button', { name: /Standup/ })
    grab(btn)
    press(btn, 'ArrowRight')
    press(btn, 'Escape')
    expect(onEventDrop).not.toHaveBeenCalled()
    expect(btn.getAttribute('aria-grabbed')).toBeNull()
    expect(screen.getByRole('status').textContent).toMatch(/cancelled/i)
  })

  it('ArrowLeft then Enter moves the event one day back via onEventDrop', () => {
    const onEventDrop = vi.fn()
    renderMonth({ onEventDrop })
    const btn = screen.getByRole('button', { name: /Standup/ })
    grab(btn)
    press(btn, 'ArrowLeft')
    press(btn, 'Enter')
    expect(onEventDrop).toHaveBeenCalledTimes(1)
    expect(onEventDrop.mock.calls[0]![0]).toMatchObject({
      start: localizer.add({ value: one[0]!.start, amount: -1, unit: 'day' }),
      end: localizer.add({ value: one[0]!.end, amount: -1, unit: 'day' }),
    })
  })

  it('ArrowUp moves by a whole week backward', () => {
    const onEventDrop = vi.fn()
    renderMonth({ onEventDrop })
    const btn = screen.getByRole('button', { name: /Standup/ })
    grab(btn)
    press(btn, 'ArrowUp')
    press(btn, 'Enter')
    expect(onEventDrop.mock.calls[0]![0]).toMatchObject({
      start: localizer.add({ value: one[0]!.start, amount: -7, unit: 'day' }),
    })
  })

  it('Shift+ArrowUp resizes the end edge back one week via onEventResize', () => {
    const onEventResize = vi.fn()
    // Use a 2-week event so the end has room to shrink by 7 days without clamping to start.
    // The event spans 2 calendar weeks so it renders as 2 segments; grab the first one.
    const twoWeek: Event[] = [
      { id: 1, title: 'Standup', start: '2026-06-15T09:00:00.000Z', end: '2026-06-22T10:00:00.000Z' },
    ]
    render(
      <CalendarProvider<Event>
        localizer={localizer}
        defaultDate="2026-06-15"
        defaultView={Views.MONTH}
        events={twoWeek}
        onEventResize={onEventResize}
      >
        <MonthView />
      </CalendarProvider>,
    )
    const btns = screen.getAllByRole('button', { name: /Standup/ })
    grab(btns[0]!)
    press(btns[0]!, 'ArrowUp', true) // Shift+↑ → grabResize({ days: -7 })
    press(btns[0]!, 'Enter')
    expect(onEventResize).toHaveBeenCalledTimes(1)
    expect(onEventResize.mock.calls[0]![0]).toMatchObject({
      start: twoWeek[0]!.start,
      end: localizer.add({ value: twoWeek[0]!.end, amount: -7, unit: 'day' }),
    })
  })

  it('Shift+ArrowDown grows the end edge one week via onEventResize', () => {
    const onEventResize = vi.fn()
    renderMonth({ onEventResize })
    const btn = screen.getByRole('button', { name: /Standup/ })
    grab(btn)
    press(btn, 'ArrowDown', true) // Shift+↓ grows end by 7 days
    press(btn, 'Enter')
    expect(onEventResize).toHaveBeenCalledTimes(1)
    expect(onEventResize.mock.calls[0]![0]).toMatchObject({
      start: one[0]!.start,
      end: localizer.add({ value: one[0]!.end, amount: 7, unit: 'day' }),
    })
  })
})
