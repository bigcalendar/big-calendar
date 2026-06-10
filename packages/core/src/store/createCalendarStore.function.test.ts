import { beforeAll, describe, expect, it, vi } from 'vitest'
import { Navigate, Views } from '../constants/views.constant'
import { LOCALIZER_CASES } from '../testing/localizers'
import type { CalendarConfig } from '../types/config.type'
import { createCalendarStore } from './createCalendarStore.function'

interface Event {
  id: number
  title: string
  start: string
  end: string
}

const isoPattern = /^\d{4}-\d{2}-\d{2}T/
const monday = '2026-06-15T00:00:00.000Z'

describe.each(LOCALIZER_CASES)('createCalendarStore [$name]', ({ create }) => {
  let localizer: Awaited<ReturnType<typeof create>>
  beforeAll(async () => {
    // One real localizer covers every role this store exercises: visible-range
    // math, slot/minute math, navigation, and label formatting.
    localizer = await create()
  })

  describe('createCalendarStore', () => {
    it('throws when no localizer is provided', () => {
      expect(() =>
        createCalendarStore({ localizer: undefined } as unknown as CalendarConfig),
      ).toThrow(/localizer/)
    })

    it('applies defaults from a minimal config', () => {
      const store = createCalendarStore<Event>({ localizer })
      expect(store.view.value).toBe(Views.MONTH)
      expect(store.date.value).toMatch(isoPattern)
      expect(store.selected.value).toBeNull()
      expect(store.events.value).toEqual([])
      expect(store.backgroundEvents.value).toEqual([])
      expect(store.resources.value).toBeUndefined()
      expect(store.localizer).toBe(localizer)
      expect(store.accessors.title).toBe('title')
    })

    it('seeds state from a full config', () => {
      const events: Event[] = [{ id: 1, title: 'A', start: 's', end: 'e' }]
      const store = createCalendarStore<Event, { id: number }>({
        localizer,
        date: '2026-06-15T00:00:00.000Z',
        view: Views.WEEK,
        events,
        backgroundEvents: [{ id: 2, title: 'bg', start: 's', end: 'e' }],
        resources: [{ id: 9 }],
        accessors: { title: (e) => e.title.toUpperCase() },
        getNow: () => '2026-01-20T00:00:00.000Z',
        length: 7,
      })
      expect(store.date.value).toBe('2026-06-15T00:00:00.000Z')
      expect(store.view.value).toBe(Views.WEEK)
      expect(store.events.value).toBe(events)
      expect(store.resources.value).toEqual([{ id: 9 }])
      expect(typeof store.accessors.title).toBe('function')
    })

    it('navigate NEXT advances the date and fires onNavigate', () => {
      const onNavigate = vi.fn()
      const store = createCalendarStore<Event>({
        localizer,
        date: monday,
        view: Views.MONTH,
        onNavigate,
      })
      // One month forward, read back from the localizer (serialization included).
      const next = localizer.add({ value: monday, amount: 1, unit: 'month' })
      store.navigate({ direction: Navigate.NEXT })
      expect(store.date.value).toBe(next)
      expect(onNavigate).toHaveBeenCalledWith({ date: next, view: Views.MONTH })
    })

    it('navigate TODAY uses getNow and DATE jumps to the target', () => {
      const store = createCalendarStore<Event>({
        localizer,
        date: monday,
        getNow: () => '2026-01-20T00:00:00.000Z',
      })
      store.navigate({ direction: Navigate.TODAY })
      expect(store.date.value).toBe('2026-01-20T00:00:00.000Z')
      store.navigate({ direction: Navigate.DATE, date: '2027-03-01T00:00:00.000Z' })
      expect(store.date.value).toBe('2027-03-01T00:00:00.000Z')
    })

    it('navigate works without an onNavigate callback', () => {
      const store = createCalendarStore<Event>({ localizer, date: monday })
      expect(() => store.navigate({ direction: Navigate.NEXT })).not.toThrow()
    })

    it('setView updates the view and fires onView', () => {
      const onView = vi.fn()
      const store = createCalendarStore<Event>({ localizer, onView })
      store.setView({ view: Views.DAY })
      expect(store.view.value).toBe(Views.DAY)
      expect(onView).toHaveBeenCalledWith({ view: Views.DAY })
    })

    it('setView works without an onView callback', () => {
      const store = createCalendarStore<Event>({ localizer })
      expect(() => store.setView({ view: Views.AGENDA })).not.toThrow()
      expect(store.view.value).toBe(Views.AGENDA)
    })

    it('setDate sets the focus date directly', () => {
      const store = createCalendarStore<Event>({ localizer })
      store.setDate({ date: '2030-12-31T00:00:00.000Z' })
      expect(store.date.value).toBe('2030-12-31T00:00:00.000Z')
    })

    it('selectEvent sets and clears the selection and fires onEventSelect', () => {
      const onEventSelect = vi.fn()
      const store = createCalendarStore<Event>({ localizer, onEventSelect })
      store.selectEvent({ id: 42 })
      expect(store.selected.value).toBe(42)
      store.selectEvent({ id: null })
      expect(store.selected.value).toBeNull()
      expect(onEventSelect).toHaveBeenNthCalledWith(1, { id: 42 })
      expect(onEventSelect).toHaveBeenNthCalledWith(2, { id: null })
    })

    it('selectEvent works without an onEventSelect callback', () => {
      const store = createCalendarStore<Event>({ localizer })
      expect(() => store.selectEvent({ id: 1 })).not.toThrow()
    })

    it('eventHandlers fire only the configured callbacks (no noop fabrication)', () => {
      const onEventClick = vi.fn()
      const onEventDoubleClick = vi.fn()
      const onEventRightClick = vi.fn()
      const onEventMiddleClick = vi.fn()
      const store = createCalendarStore<Event>({
        localizer,
        onEventClick,
        onEventDoubleClick,
        onEventRightClick,
        onEventMiddleClick,
      })
      const ev: Event = { id: 7, title: 'X', start: 's', end: 'e' }
      const domEvent = {} as MouseEvent
      expect(store.eventHandlers.has).toBe(true)
      expect(store.eventHandlers.hasRightClick).toBe(true)
      expect(store.eventHandlers.hasMiddleClick).toBe(true)
      // click fires the callback but does NOT select (selection is composed separately)
      store.eventHandlers.click(ev)
      expect(onEventClick).toHaveBeenCalledWith(ev)
      expect(store.selected.value).toBeNull()
      store.eventHandlers.doubleClick(ev)
      expect(onEventDoubleClick).toHaveBeenCalledWith(ev)
      store.eventHandlers.rightClick(ev, domEvent)
      expect(onEventRightClick).toHaveBeenCalledWith(ev, domEvent)
      store.eventHandlers.middleClick(ev, domEvent)
      expect(onEventMiddleClick).toHaveBeenCalledWith(ev, domEvent)
    })

    it('eventHandlers report no presence and never throw when nothing is configured', () => {
      const store = createCalendarStore<Event>({ localizer })
      const ev: Event = { id: 1, title: 'X', start: 's', end: 'e' }
      expect(store.eventHandlers.has).toBe(false)
      expect(store.eventHandlers.hasRightClick).toBe(false)
      expect(store.eventHandlers.hasMiddleClick).toBe(false)
      expect(() => {
        store.eventHandlers.click(ev)
        store.eventHandlers.doubleClick(ev)
        store.eventHandlers.rightClick(ev, {} as MouseEvent)
        store.eventHandlers.middleClick(ev, {} as MouseEvent)
      }).not.toThrow()
    })

    it('eventHandlers.has is true when only one handler is configured', () => {
      const store = createCalendarStore<Event>({ localizer, onEventRightClick: () => {} })
      expect(store.eventHandlers.has).toBe(true)
      expect(store.eventHandlers.hasRightClick).toBe(true)
      expect(store.eventHandlers.hasMiddleClick).toBe(false)
    })

    it('replaces event, background-event and resource lists', () => {
      const store = createCalendarStore<Event, { id: number }>({ localizer })
      const next: Event[] = [{ id: 5, title: 'X', start: 's', end: 'e' }]
      store.setEvents({ events: next })
      store.setBackgroundEvents({ events: next })
      store.setResources({ resources: [{ id: 3 }] })
      expect(store.events.value).toBe(next)
      expect(store.backgroundEvents.value).toBe(next)
      expect(store.resources.value).toEqual([{ id: 3 }])
    })

    it('destroy is safe to call repeatedly', () => {
      const store = createCalendarStore<Event>({ localizer })
      expect(() => {
        store.destroy()
        store.destroy()
      }).not.toThrow()
    })
  })

  describe('createCalendarStore — range + drilldown', () => {
    it('exposes a derived visible range that tracks date + view', () => {
      const store = createCalendarStore<Event>({
        localizer,
        date: monday,
        view: Views.WEEK,
      })
      expect(store.range.value.days).toHaveLength(7)
      store.setView({ view: Views.DAY })
      expect(store.range.value.days).toEqual([localizer.startOf({ value: monday, unit: 'day' })])
    })

    it('fires onRangeChange on change but not on init', () => {
      const onRangeChange = vi.fn()
      const store = createCalendarStore<Event>({
        localizer,
        date: monday,
        view: Views.WEEK,
        onRangeChange,
      })
      expect(onRangeChange).not.toHaveBeenCalled()
      store.navigate({ direction: Navigate.NEXT })
      expect(onRangeChange).toHaveBeenCalledTimes(1)
      expect(onRangeChange).toHaveBeenLastCalledWith({
        range: store.range.value,
        view: Views.WEEK,
      })
    })

    it('stops emitting onRangeChange after destroy', () => {
      const onRangeChange = vi.fn()
      const store = createCalendarStore<Event>({
        localizer,
        date: monday,
        onRangeChange,
      })
      store.destroy()
      store.setDate({ date: '2026-07-01T00:00:00.000Z' })
      expect(onRangeChange).not.toHaveBeenCalled()
    })

    it('drilldown defaults to the day view, switching view + date', () => {
      const onView = vi.fn()
      const onNavigate = vi.fn()
      const store = createCalendarStore<Event>({
        localizer,
        date: monday,
        view: Views.MONTH,
        onView,
        onNavigate,
      })
      store.drilldown({ date: '2026-06-20T00:00:00.000Z' })
      expect(store.view.value).toBe(Views.DAY)
      expect(store.date.value).toBe('2026-06-20T00:00:00.000Z')
      expect(onView).toHaveBeenCalledWith({ view: Views.DAY })
      expect(onNavigate).toHaveBeenCalledWith({ date: '2026-06-20T00:00:00.000Z', view: Views.DAY })
    })

    it('drilldown into the current view skips onView but still moves the date', () => {
      const onView = vi.fn()
      const store = createCalendarStore<Event>({
        localizer,
        date: monday,
        view: Views.DAY,
        onView,
      })
      store.drilldown({ date: '2026-06-20T00:00:00.000Z' })
      expect(store.date.value).toBe('2026-06-20T00:00:00.000Z')
      expect(onView).not.toHaveBeenCalled()
    })

    it('drilldown delegates to onDrillDown without mutating state', () => {
      const onDrillDown = vi.fn()
      const store = createCalendarStore<Event>({
        localizer,
        date: monday,
        view: Views.MONTH,
        onDrillDown,
      })
      store.drilldown({ date: '2026-06-20T00:00:00.000Z' })
      expect(onDrillDown).toHaveBeenCalledWith({ date: '2026-06-20T00:00:00.000Z', view: Views.DAY })
      expect(store.view.value).toBe(Views.MONTH)
      expect(store.date.value).toBe(monday)
    })

    it('drilldown honours getDrilldownView and is a no-op when disabled', () => {
      const resolved = createCalendarStore<Event>({
        localizer,
        date: monday,
        view: Views.MONTH,
        getDrilldownView: () => Views.WEEK,
      })
      resolved.drilldown({ date: '2026-06-20T00:00:00.000Z' })
      expect(resolved.view.value).toBe(Views.WEEK)

      const disabled = createCalendarStore<Event>({
        localizer,
        date: monday,
        view: Views.MONTH,
        drilldownView: null,
      })
      disabled.drilldown({ date: '2026-06-20T00:00:00.000Z' })
      expect(disabled.view.value).toBe(Views.MONTH)
      expect(disabled.date.value).toBe(monday)
    })
  })

  describe('createCalendarStore — viewModel', () => {
    it('derives a month model in the month view', () => {
      const store = createCalendarStore<Event>({ localizer, date: monday, view: Views.MONTH })
      expect(store.viewModel.value.kind).toBe('month')
    })

    it('derives a time-grid model with one column per visible day', () => {
      const dayStore = createCalendarStore<Event>({ localizer, date: monday, view: Views.DAY })
      const dayVm = dayStore.viewModel.value
      expect(dayVm.kind).toBe('time')
      if (dayVm.kind === 'time') expect(dayVm.timeGrid.columns).toHaveLength(1)

      const weekStore = createCalendarStore<Event>({ localizer, date: monday, view: Views.WEEK })
      const weekVm = weekStore.viewModel.value
      if (weekVm.kind === 'time') expect(weekVm.timeGrid.columns).toHaveLength(7)
    })

    it('recomputes the view model when the view changes', () => {
      const store = createCalendarStore<Event>({ localizer, date: monday, view: Views.DAY })
      expect(store.viewModel.value.kind).toBe('time')
      store.setView({ view: Views.AGENDA })
      expect(store.viewModel.value.kind).toBe('agenda')
    })

    it('applies the configured time window to time-grid columns', () => {
      const store = createCalendarStore<Event>({
        localizer,
        date: monday,
        view: Views.DAY,
        min: '2026-06-15T08:00:00.000Z',
        max: '2026-06-15T18:00:00.000Z',
        events: [{ id: 1, title: 'e1', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T10:00:00.000Z' }],
      })
      const vm = store.viewModel.value
      if (vm.kind === 'time') {
        expect(vm.timeGrid.columns[0]?.min).toBe(localizer.getSlotDate({ date: monday, minutesFromMidnight: 8 * 60 }))
        expect(vm.timeGrid.columns[0]?.events[0]?.top).toBeCloseTo(0.1)
      }
    })
  })

  describe('createCalendarStore — label', () => {
    it('derives a localized label from the active view + focus date', () => {
      const store = createCalendarStore<Event>({ localizer, date: monday, view: Views.MONTH })
      expect(store.label.value).toBe(localizer.format({ value: monday, format: 'monthHeader' }))
      store.setView({ view: Views.DAY })
      expect(store.label.value).toBe(localizer.format({ value: monday, format: 'dayHeader' }))
    })
  })

  describe('createCalendarStore — slot selection', () => {
    const slot = (min: number) => localizer.getSlotDate({ date: monday, minutesFromMidnight: min })

    it('exposes longPressThreshold (default 500, overridable)', () => {
      const base = createCalendarStore<Event>({ localizer, date: monday, view: Views.DAY })
      expect(base.longPressThreshold).toBe(500)
      const custom = createCalendarStore<Event>({ localizer, date: monday, view: Views.DAY, longPressThreshold: 800 })
      expect(custom.longPressThreshold).toBe(800)
    })

    it('is disabled by default (no selectable)', () => {
      const onSlotSelect = vi.fn()
      const onSlotClick = vi.fn()
      const store = createCalendarStore<Event>({ localizer, date: monday, view: Views.DAY, onSlotSelect, onSlotClick })
      store.selection.start({ slot: 2, date: monday, mode: 'time' })
      store.selection.complete()
      store.selection.click({ slot: 3, date: monday, mode: 'time' })
      expect(store.selection.range.value).toBeNull()
      expect(onSlotSelect).not.toHaveBeenCalled()
      expect(onSlotClick).not.toHaveBeenCalled()
    })

    it('tracks a time-mode drag in slot-index space and commits translated dates', () => {
      const onSlotSelect = vi.fn()
      const store = createCalendarStore<Event>({
        localizer,
        date: monday,
        view: Views.DAY,
        selectable: true,
        onSlotSelect,
      })
      store.selection.start({ slot: 2, date: monday, mode: 'time' })
      store.selection.to({ slot: 4 })
      // Live range stays in index space for the overlay.
      expect(store.selection.range.value).toEqual({ start: 2, end: 4 })
      store.selection.complete()
      // step defaults to 30 → slots 2..4 are 01:00 / 01:30 / 02:00; exclusive end 02:30.
      expect(onSlotSelect).toHaveBeenCalledWith({
        start: slot(60),
        end: slot(150),
        slots: [slot(60), slot(90), slot(120)],
        allDay: false,
      })
      expect(store.selection.range.value).toBeNull()
    })

    it('marks a cross-day time drag allDay while keeping its instant start/end times', () => {
      const onSlotSelect = vi.fn()
      const store = createCalendarStore<Event>({
        localizer,
        date: monday,
        view: Views.WEEK,
        selectable: true,
        onSlotSelect,
      })
      const days = store.range.value.days
      // Full-day window → 48 slots/column. Anchor day 0 slot 10, drag to day 2 slot 5.
      const slotCount = 48
      store.selection.start({ slot: 0 * slotCount + 10, date: days[0]!, mode: 'time', slotCount })
      store.selection.to({ slot: 2 * slotCount + 5 })
      store.selection.complete()
      const arg = onSlotSelect.mock.calls[0]![0]
      // All-day span, but with real instant times (step 30: slot 10 = 05:00).
      expect(arg.allDay).toBe(true)
      expect(arg.start).toBe(localizer.getSlotDate({ date: days[0]!, minutesFromMidnight: 10 * 30 }))
      // Exclusive end on day 2: the slot just past slot 5 → 03:00.
      expect(arg.end).toBe(localizer.getSlotDate({ date: days[2]!, minutesFromMidnight: 6 * 30 }))
      // Every slot from day0/10 through day2/5 inclusive (38 + 48 + 6).
      expect(arg.slots).toHaveLength(2 * 48 + 5 - 10 + 1)
      expect(arg.slots[0]).toBe(arg.start)
      expect(arg.slots.at(-1)).toBe(localizer.getSlotDate({ date: days[2]!, minutesFromMidnight: 5 * 30 }))
    })

    it('treats an entire-day same-day drag as an all-day selection (midnight → 23:59:59)', () => {
      const onSlotSelect = vi.fn()
      const store = createCalendarStore<Event>({
        localizer,
        date: monday,
        view: Views.DAY,
        selectable: true,
        onSlotSelect,
      })
      const days = store.range.value.days
      // Full midnight→end-of-day window → 48 slots; select slot 0 through 47.
      store.selection.start({ slot: 0, date: days[0]!, mode: 'time', slotCount: 48 })
      store.selection.to({ slot: 47 })
      store.selection.complete()
      expect(onSlotSelect).toHaveBeenCalledWith({
        start: days[0],
        end: localizer.endOf({ value: days[0]!, unit: 'day' }),
        slots: [days[0]],
        allDay: true,
      })
    })

    it('ends a drag on the last slot of a full day at end-of-day, not next-day midnight', () => {
      const onSlotSelect = vi.fn()
      const store = createCalendarStore<Event>({
        localizer,
        date: monday,
        view: Views.DAY,
        selectable: true,
        onSlotSelect,
      })
      const days = store.range.value.days
      // 10:00 → last slot of the day: a timed selection (not the whole day).
      store.selection.start({ slot: 20, date: days[0]!, mode: 'time', slotCount: 48 })
      store.selection.to({ slot: 47 })
      store.selection.complete()
      const arg = onSlotSelect.mock.calls[0]![0]
      expect(arg.allDay).toBe(false)
      expect(arg.start).toBe(localizer.getSlotDate({ date: days[0]!, minutesFromMidnight: 20 * 30 }))
      expect(arg.end).toBe(localizer.endOf({ value: days[0]!, unit: 'day' }))
    })

    it('vetoes a time-mode start when onSlotSelecting returns false (dates passed through)', () => {
      const onSlotSelecting = vi.fn(() => false)
      const store = createCalendarStore<Event>({
        localizer,
        date: monday,
        view: Views.DAY,
        selectable: true,
        onSlotSelecting,
      })
      store.selection.start({ slot: 2, date: monday, mode: 'time' })
      expect(onSlotSelecting).toHaveBeenCalledWith({ start: slot(60), end: slot(90), allDay: false })
      expect(store.selection.range.value).toBeNull()
    })

    it('routes a click to onSlotClick and a double-click to onSlotDoubleClick, each a single slot', () => {
      const onSlotClick = vi.fn()
      const onSlotDoubleClick = vi.fn()
      const store = createCalendarStore<Event>({
        localizer,
        date: monday,
        view: Views.DAY,
        selectable: true,
        onSlotClick,
        onSlotDoubleClick,
      })
      store.selection.click({ slot: 3, date: monday, mode: 'time' })
      store.selection.doubleClick({ slot: 3, date: monday, mode: 'time' })
      expect(onSlotClick).toHaveBeenCalledWith({
        start: slot(90),
        end: slot(120),
        slots: [slot(90)],
        allDay: false,
      })
      expect(onSlotDoubleClick).toHaveBeenCalledWith({
        start: slot(90),
        end: slot(120),
        slots: [slot(90)],
        allDay: false,
      })
    })

    it('carries the anchor resourceId into the committed selection payload', () => {
      const onSlotClick = vi.fn()
      const onSlotSelect = vi.fn()
      const store = createCalendarStore<Event>({
        localizer,
        date: monday,
        view: Views.DAY,
        selectable: true,
        onSlotClick,
        onSlotSelect,
      })
      store.selection.click({ slot: 3, date: monday, mode: 'time', resourceId: 'room-a' })
      expect(onSlotClick.mock.calls[0]![0].resourceId).toBe('room-a')
      store.selection.start({ slot: 2, date: monday, mode: 'time', resourceId: 'room-b' })
      store.selection.to({ slot: 4 })
      store.selection.complete()
      expect(onSlotSelect.mock.calls[0]![0].resourceId).toBe('room-b')
    })

    it('translates day-mode indices into visible days, ending at end-of-day', () => {
      const onSlotSelect = vi.fn()
      const store = createCalendarStore<Event>({
        localizer,
        date: monday,
        view: Views.MONTH,
        selectable: true,
        onSlotSelect,
      })
      const days = store.range.value.days
      store.selection.start({ slot: 0, date: days[0]!, mode: 'day' })
      store.selection.to({ slot: 2 })
      store.selection.complete()
      expect(onSlotSelect).toHaveBeenCalledWith({
        start: days[0],
        end: localizer.endOf({ value: days[2]!, unit: 'day' }),
        slots: [days[0], days[1], days[2]],
        allDay: true,
      })
    })

    it('cancels an in-progress drag on view change', () => {
      const store = createCalendarStore<Event>({ localizer, date: monday, view: Views.DAY, selectable: true })
      store.selection.start({ slot: 1, date: monday, mode: 'time' })
      expect(store.selection.range.value).toEqual({ start: 1, end: 1 })
      store.setView({ view: Views.WEEK })
      expect(store.selection.range.value).toBeNull()
    })

    it('cancels an in-progress drag on navigate', () => {
      const store = createCalendarStore<Event>({ localizer, date: monday, view: Views.DAY, selectable: true })
      store.selection.start({ slot: 1, date: monday, mode: 'time' })
      store.navigate({ direction: Navigate.NEXT })
      expect(store.selection.range.value).toBeNull()
    })
  })

  describe('event drag-and-drop (moveEvent)', () => {
    const events: Event[] = [
      { id: 1, title: 'A', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T10:00:00.000Z' },
    ]

    it('fires onEventDrop with the time-snapped bounds', () => {
      const onEventDrop = vi.fn()
      const store = createCalendarStore<Event>({ localizer, events, onEventDrop })
      const target = '2026-06-16T13:00:00.000Z'
      const durationMs = localizer.diff({ a: events[0]!.end, b: events[0]!.start, unit: 'millisecond' })
      store.moveEvent({ id: 1, target, mode: 'time' })
      expect(onEventDrop).toHaveBeenCalledWith({
        event: events[0],
        start: target,
        end: localizer.add({ value: target, amount: durationMs, unit: 'millisecond' }),
        allDay: false,
      })
    })

    it('fires onEventDrop with a whole-day shift in day mode', () => {
      const onEventDrop = vi.fn()
      const store = createCalendarStore<Event>({ localizer, events, onEventDrop })
      store.moveEvent({ id: 1, target: '2026-06-18T23:00:00.000Z', mode: 'day' })
      expect(onEventDrop).toHaveBeenCalledWith({
        event: events[0],
        start: localizer.add({ value: events[0]!.start, amount: 3, unit: 'day' }),
        end: localizer.add({ value: events[0]!.end, amount: 3, unit: 'day' }),
        allDay: false,
      })
    })

    it('is a no-op when the id matches no event', () => {
      const onEventDrop = vi.fn()
      const store = createCalendarStore<Event>({ localizer, events, onEventDrop })
      store.moveEvent({ id: 999, target: '2026-06-16T13:00:00.000Z', mode: 'time' })
      expect(onEventDrop).not.toHaveBeenCalled()
    })

    it('is a no-op (no throw) when no onEventDrop is configured', () => {
      const store = createCalendarStore<Event>({ localizer, events })
      expect(() =>
        store.moveEvent({ id: 1, target: '2026-06-16T13:00:00.000Z', mode: 'time' }),
      ).not.toThrow()
    })

    it('getEvent resolves an event by id, else undefined', () => {
      const store = createCalendarStore<Event>({ localizer, events })
      expect(store.getEvent({ id: 1 })).toBe(events[0])
      expect(store.getEvent({ id: 999 })).toBeUndefined()
    })

    it('previewMove sets dragPreview to the proposed bounds without firing onEventDrop', () => {
      const onEventDrop = vi.fn()
      const store = createCalendarStore<Event>({ localizer, events, onEventDrop })
      const target = '2026-06-16T13:00:00.000Z'
      const durationMs = localizer.diff({ a: events[0]!.end, b: events[0]!.start, unit: 'millisecond' })
      store.previewMove({ id: 1, target, mode: 'time' })
      expect(store.dragPreview.value).toEqual({
        start: target,
        end: localizer.add({ value: target, amount: durationMs, unit: 'millisecond' }),
      })
      expect(onEventDrop).not.toHaveBeenCalled()
    })

    it('previewMove previews a whole-day shift in day mode', () => {
      const store = createCalendarStore<Event>({ localizer, events, onEventDrop: vi.fn() })
      store.previewMove({ id: 1, target: '2026-06-18T23:00:00.000Z', mode: 'day' })
      expect(store.dragPreview.value).toEqual({
        start: localizer.add({ value: events[0]!.start, amount: 3, unit: 'day' }),
        end: localizer.add({ value: events[0]!.end, amount: 3, unit: 'day' }),
      })
    })

    it('previewMove clears the preview when the id matches no event', () => {
      const store = createCalendarStore<Event>({ localizer, events, onEventDrop: vi.fn() })
      store.previewMove({ id: 1, target: '2026-06-16T13:00:00.000Z', mode: 'time' })
      expect(store.dragPreview.value).not.toBeNull()
      store.previewMove({ id: 999, target: '2026-06-16T13:00:00.000Z', mode: 'time' })
      expect(store.dragPreview.value).toBeNull()
    })

    it('committing a move clears the preview', () => {
      const store = createCalendarStore<Event>({ localizer, events, onEventDrop: vi.fn() })
      store.previewMove({ id: 1, target: '2026-06-16T13:00:00.000Z', mode: 'time' })
      expect(store.dragPreview.value).not.toBeNull()
      store.moveEvent({ id: 1, target: '2026-06-16T13:00:00.000Z', mode: 'time' })
      expect(store.dragPreview.value).toBeNull()
    })

    it('reports the landing resourceId on onEventDrop when given one', () => {
      const onEventDrop = vi.fn()
      const store = createCalendarStore<Event>({ localizer, events, onEventDrop })
      store.moveEvent({ id: 1, target: '2026-06-16T13:00:00.000Z', mode: 'time', resourceId: 42 })
      expect(onEventDrop.mock.calls[0]![0].resourceId).toBe(42)
    })

    it('promote:true forces allDay:true in onEventDrop (timed→all-day promotion)', () => {
      const onEventDrop = vi.fn()
      const store = createCalendarStore<Event>({ localizer, events, onEventDrop })
      store.moveEvent({ id: 1, target: '2026-06-15T00:00:00.000Z', mode: 'day', promote: true })
      expect(onEventDrop.mock.calls[0]![0].allDay).toBe(true)
    })
  })

  describe('event resize (resizeEvent)', () => {
    const events: Event[] = [
      { id: 1, title: 'A', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T10:00:00.000Z' },
    ]

    it('fires onEventResize moving the start edge to the dropped slot', () => {
      const onEventResize = vi.fn()
      const store = createCalendarStore<Event>({ localizer, events, onEventResize })
      const target = '2026-06-15T08:30:00.000Z'
      store.resizeEvent({ id: 1, edge: 'start', target })
      expect(onEventResize).toHaveBeenCalledWith({
        event: events[0],
        start: target,
        end: events[0]!.end,
        allDay: false,
      })
    })

    it('fires onEventResize moving the end edge to the slot end (target + step)', () => {
      const onEventResize = vi.fn()
      const store = createCalendarStore<Event>({ localizer, events, onEventResize, step: 30 })
      const target = '2026-06-15T11:00:00.000Z'
      store.resizeEvent({ id: 1, edge: 'end', target })
      expect(onEventResize).toHaveBeenCalledWith({
        event: events[0],
        start: events[0]!.start,
        end: localizer.add({ value: target, amount: 30, unit: 'minute' }),
        allDay: false,
      })
    })

    it('is a no-op when the id matches no event', () => {
      const onEventResize = vi.fn()
      const store = createCalendarStore<Event>({ localizer, events, onEventResize })
      store.resizeEvent({ id: 999, edge: 'end', target: '2026-06-15T11:00:00.000Z' })
      expect(onEventResize).not.toHaveBeenCalled()
    })

    it('is a no-op (no throw) when no onEventResize is configured', () => {
      const store = createCalendarStore<Event>({ localizer, events })
      expect(() => store.resizeEvent({ id: 1, edge: 'end', target: '2026-06-15T11:00:00.000Z' })).not.toThrow()
    })

    it('previewResize sets dragPreview to the proposed bounds without firing the callback', () => {
      const onEventResize = vi.fn()
      const store = createCalendarStore<Event>({ localizer, events, onEventResize, step: 30 })
      const target = '2026-06-15T11:00:00.000Z'
      store.previewResize({ id: 1, edge: 'end', target })
      expect(store.dragPreview.value).toEqual({
        start: events[0]!.start,
        end: localizer.add({ value: target, amount: 30, unit: 'minute' }),
      })
      expect(onEventResize).not.toHaveBeenCalled()
    })

    it('previewResize clears the preview when the id matches no event', () => {
      const store = createCalendarStore<Event>({ localizer, events, onEventResize: vi.fn() })
      store.previewResize({ id: 1, edge: 'end', target: '2026-06-15T11:00:00.000Z' })
      expect(store.dragPreview.value).not.toBeNull()
      store.previewResize({ id: 999, edge: 'end', target: '2026-06-15T11:00:00.000Z' })
      expect(store.dragPreview.value).toBeNull()
    })

    it('committing a resize clears the preview', () => {
      const store = createCalendarStore<Event>({ localizer, events, onEventResize: vi.fn() })
      store.previewResize({ id: 1, edge: 'end', target: '2026-06-15T11:00:00.000Z' })
      expect(store.dragPreview.value).not.toBeNull()
      store.resizeEvent({ id: 1, edge: 'end', target: '2026-06-15T11:00:00.000Z' })
      expect(store.dragPreview.value).toBeNull()
    })

    it('clearDragPreview resets the preview', () => {
      const store = createCalendarStore<Event>({ localizer, events, onEventResize: vi.fn() })
      store.previewResize({ id: 1, edge: 'start', target: '2026-06-15T08:30:00.000Z' })
      expect(store.dragPreview.value).not.toBeNull()
      store.clearDragPreview()
      expect(store.dragPreview.value).toBeNull()
    })

    it('resizes by whole days in day mode (month), keeping the untouched edge', () => {
      const adEvents: Event[] = [
        { id: 1, title: 'A', start: '2026-06-15T00:00:00.000Z', end: localizer.endOf({ value: '2026-06-17T00:00:00.000Z', unit: 'day' }) },
      ]
      const onEventResize = vi.fn()
      const store = createCalendarStore<Event>({ localizer, events: adEvents, onEventResize })
      const target = '2026-06-20T00:00:00.000Z'
      store.resizeEvent({ id: 1, edge: 'end', target, mode: 'day' })
      const call = onEventResize.mock.calls[0]![0]
      expect(call.start).toBe(adEvents[0]!.start)
      expect(localizer.startOf({ value: call.end, unit: 'day' })).toBe(localizer.startOf({ value: target, unit: 'day' }))
    })

    it('reports the landing resourceId on onEventResize when given one', () => {
      const onEventResize = vi.fn()
      const store = createCalendarStore<Event>({ localizer, events, onEventResize })
      store.resizeEvent({ id: 1, edge: 'start', target: '2026-06-15T08:30:00.000Z', resourceId: 7 })
      expect(onEventResize.mock.calls[0]![0].resourceId).toBe(7)
    })
  })

  describe('drop-from-outside (dropExternal / previewExternal)', () => {
    const target = '2026-06-15T09:00:00.000Z'

    it('fires onDropFromOutside with the payload duration', () => {
      const onDropFromOutside = vi.fn()
      const store = createCalendarStore<Event>({ localizer, onDropFromOutside, step: 30 })
      store.dropExternal({ target, durationMinutes: 90 })
      expect(onDropFromOutside).toHaveBeenCalledWith({
        start: target,
        end: localizer.add({ value: target, amount: 90, unit: 'minute' }),
        allDay: false,
      })
    })

    it('defaults to a one-slot event when the payload omits a duration (native drag)', () => {
      const onDropFromOutside = vi.fn()
      const store = createCalendarStore<Event>({ localizer, onDropFromOutside, step: 30 })
      store.dropExternal({ target })
      expect(onDropFromOutside).toHaveBeenCalledWith({
        start: target,
        end: localizer.add({ value: target, amount: 30, unit: 'minute' }),
        allDay: false,
      })
    })

    it('carries the allDay flag through', () => {
      const onDropFromOutside = vi.fn()
      const store = createCalendarStore<Event>({ localizer, onDropFromOutside, step: 30 })
      store.dropExternal({ target, durationMinutes: 60, allDay: true })
      expect(onDropFromOutside.mock.calls[0]![0].allDay).toBe(true)
    })

    it('is a no-op (no throw) when no onDropFromOutside is configured', () => {
      const store = createCalendarStore<Event>({ localizer })
      expect(() => store.dropExternal({ target, durationMinutes: 60 })).not.toThrow()
    })

    it('previewExternal sets dragPreview without firing the callback', () => {
      const onDropFromOutside = vi.fn()
      const store = createCalendarStore<Event>({ localizer, onDropFromOutside, step: 30 })
      store.previewExternal({ target, durationMinutes: 90 })
      expect(store.dragPreview.value).toEqual({
        start: target,
        end: localizer.add({ value: target, amount: 90, unit: 'minute' }),
      })
      expect(onDropFromOutside).not.toHaveBeenCalled()
    })

    it('previewExternal falls back to a single slot without a duration', () => {
      const store = createCalendarStore<Event>({ localizer, step: 30 })
      store.previewExternal({ target })
      expect(store.dragPreview.value).toEqual({
        start: target,
        end: localizer.add({ value: target, amount: 30, unit: 'minute' }),
      })
    })

    it('dropExternal clears any live preview', () => {
      const store = createCalendarStore<Event>({ localizer, onDropFromOutside: vi.fn(), step: 30 })
      store.previewExternal({ target, durationMinutes: 90 })
      expect(store.dragPreview.value).not.toBeNull()
      store.dropExternal({ target, durationMinutes: 90 })
      expect(store.dragPreview.value).toBeNull()
    })

    it('day mode with no template fires onDropFromOutside as a whole-day event on the dropped day', () => {
      const onDropFromOutside = vi.fn()
      const day = '2026-06-15T00:00:00.000Z'
      const store = createCalendarStore<Event>({ localizer, onDropFromOutside, step: 30 })
      store.dropExternal({ target: day, mode: 'day' })
      expect(onDropFromOutside).toHaveBeenCalledWith({
        start: localizer.startOf({ value: day, unit: 'day' }),
        end: localizer.endOf({ value: day, unit: 'day' }),
        allDay: true,
      })
    })

    it('day mode with a start/end template re-dates it onto the dropped day', () => {
      const onDropFromOutside = vi.fn()
      const store = createCalendarStore<Event>({ localizer, onDropFromOutside, step: 30 })
      store.dropExternal({
        target: '2026-06-15T00:00:00.000Z',
        mode: 'day',
        start: '2026-02-03T09:00:00.000Z',
        end: '2026-02-03T10:30:00.000Z',
      })
      const call = onDropFromOutside.mock.calls[0]![0]
      expect(localizer.startOf({ value: call.start, unit: 'day' })).toBe(localizer.startOf({ value: '2026-06-15T00:00:00.000Z', unit: 'day' }))
      expect(localizer.getMinutesFromMidnight(call.start)).toBe(9 * 60)
      expect(localizer.diff({ a: call.end, b: call.start, unit: 'minute' })).toBe(90)
      expect(call.allDay).toBe(false)
    })

    it('reports the landing resourceId on onDropFromOutside when given one', () => {
      const onDropFromOutside = vi.fn()
      const store = createCalendarStore<Event>({ localizer, onDropFromOutside, step: 30 })
      store.dropExternal({ target, durationMinutes: 60, resourceId: 3 })
      expect(onDropFromOutside.mock.calls[0]![0].resourceId).toBe(3)
    })
  })

  describe('drag-out (getEventTransfer / eventDragStart)', () => {
    const events: Event[] = [
      { id: 1, title: 'A', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T10:00:00.000Z' },
    ]

    it('getEventTransfer serializes the event for a native transfer', () => {
      const store = createCalendarStore<Event>({ localizer, events })
      expect(store.getEventTransfer({ id: 1 })).toEqual({
        id: '1',
        title: 'A',
        start: events[0]!.start,
        end: events[0]!.end,
        allDay: false,
      })
    })

    it('getEventTransfer returns null when the id matches no event', () => {
      const store = createCalendarStore<Event>({ localizer, events })
      expect(store.getEventTransfer({ id: 999 })).toBeNull()
    })

    it('eventDragStart fires onEventDragStart with the dragged event', () => {
      const onEventDragStart = vi.fn()
      const store = createCalendarStore<Event>({ localizer, events, onEventDragStart })
      store.eventDragStart({ id: 1 })
      expect(onEventDragStart).toHaveBeenCalledWith({ event: events[0] })
    })

    it('eventDragStart is a no-op for an unknown id or with no handler', () => {
      const onEventDragStart = vi.fn()
      const store = createCalendarStore<Event>({ localizer, events, onEventDragStart })
      store.eventDragStart({ id: 999 })
      expect(onEventDragStart).not.toHaveBeenCalled()
      const bare = createCalendarStore<Event>({ localizer, events })
      expect(() => bare.eventDragStart({ id: 1 })).not.toThrow()
    })
  })

  describe('keyboard drag (grab / move / resize / commit / cancel)', () => {
    const events: Event[] = [
      { id: 1, title: 'A', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T10:00:00.000Z' },
    ]

    it('grabEvent seeds the grab + preview from the event bounds', () => {
      const store = createCalendarStore<Event>({ localizer, events })
      expect(store.grabEvent({ id: 1 })).toBe(true)
      expect(store.keyboardDrag.value).toEqual({
        id: 1,
        start: events[0]!.start,
        end: events[0]!.end,
        allDay: false,
      })
      expect(store.dragPreview.value).toEqual({ start: events[0]!.start, end: events[0]!.end })
    })

    it('grabEvent returns false for an unknown id and starts nothing', () => {
      const store = createCalendarStore<Event>({ localizer, events })
      expect(store.grabEvent({ id: 999 })).toBe(false)
      expect(store.keyboardDrag.value).toBeNull()
    })

    it('grabMove shifts both ends, preserving duration', () => {
      const store = createCalendarStore<Event>({ localizer, events, step: 30 })
      store.grabEvent({ id: 1 })
      store.grabMove({ minutes: 30 }) // one slot later
      store.grabMove({ days: 1 }) // next day
      const expectedStart = localizer.add({
        value: localizer.add({ value: events[0]!.start, amount: 30, unit: 'minute' }),
        amount: 1,
        unit: 'day',
      })
      expect(store.keyboardDrag.value!.start).toBe(expectedStart)
      expect(localizer.diff({ a: store.keyboardDrag.value!.end, b: store.keyboardDrag.value!.start, unit: 'minute' })).toBe(60)
      expect(store.dragPreview.value!.start).toBe(expectedStart)
    })

    it('grabResize moves the end edge and clamps to a one-slot minimum', () => {
      const store = createCalendarStore<Event>({ localizer, events, step: 30 })
      store.grabEvent({ id: 1 })
      store.grabResize({ minutes: 30 }) // grow end by a slot → 90 min
      expect(localizer.diff({ a: store.keyboardDrag.value!.end, b: store.keyboardDrag.value!.start, unit: 'minute' })).toBe(90)
      // Shrink well past the start → clamps to exactly one slot.
      store.grabResize({ minutes: -1000 })
      expect(localizer.diff({ a: store.keyboardDrag.value!.end, b: store.keyboardDrag.value!.start, unit: 'minute' })).toBe(30)
    })

    it('grabResize moves the end edge by whole days (month) and clamps to a one-day minimum', () => {
      // A 3-day all-day event.
      const adEvents: Event[] = [
        { id: 1, title: 'A', start: '2026-06-15T00:00:00.000Z', end: localizer.endOf({ value: '2026-06-17T00:00:00.000Z', unit: 'day' }) },
      ]
      const store = createCalendarStore<Event>({ localizer, events: adEvents })
      store.grabEvent({ id: 1 })
      store.grabResize({ days: 2 }) // end → 19th
      expect(localizer.startOf({ value: store.keyboardDrag.value!.end, unit: 'day' })).toBe(
        localizer.startOf({ value: '2026-06-19T00:00:00.000Z', unit: 'day' }),
      )
      // Shrink well below the start → clamps to a one-day event (end day == start day).
      store.grabResize({ days: -50 })
      expect(localizer.startOf({ value: store.keyboardDrag.value!.end, unit: 'day' })).toBe(
        localizer.startOf({ value: adEvents[0]!.start, unit: 'day' }),
      )
    })

    it('grabResize edge=start moves the start edge and clamps to a one-slot minimum', () => {
      const store = createCalendarStore<Event>({ localizer, events, step: 30 })
      store.grabEvent({ id: 1 })
      // Move start earlier by one slot → event grows (start is earlier, end stays).
      store.grabResize({ minutes: -30, edge: 'start' })
      expect(store.keyboardDrag.value!.start).toBe(localizer.add({ value: events[0]!.start, amount: -30, unit: 'minute' }))
      expect(store.keyboardDrag.value!.end).toBe(events[0]!.end)
      // Push start forward well past the end → clamps to exactly one slot before end.
      store.grabResize({ minutes: 10000, edge: 'start' })
      expect(localizer.diff({ a: store.keyboardDrag.value!.end, b: store.keyboardDrag.value!.start, unit: 'minute' })).toBe(30)
    })

    it('grabResize edge=start moves the start edge by whole days (month) and clamps to a one-day minimum', () => {
      const adEvents: Event[] = [
        { id: 1, title: 'A', start: '2026-06-15T00:00:00.000Z', end: localizer.endOf({ value: '2026-06-17T00:00:00.000Z', unit: 'day' }) },
      ]
      const store = createCalendarStore<Event>({ localizer, events: adEvents })
      store.grabEvent({ id: 1 })
      // Move start earlier by 2 days → start on 13th, end still on 17th.
      store.grabResize({ days: -2, edge: 'start' })
      expect(localizer.startOf({ value: store.keyboardDrag.value!.start, unit: 'day' })).toBe(
        localizer.startOf({ value: '2026-06-13T00:00:00.000Z', unit: 'day' }),
      )
      expect(localizer.startOf({ value: store.keyboardDrag.value!.end, unit: 'day' })).toBe(
        localizer.startOf({ value: '2026-06-17T00:00:00.000Z', unit: 'day' }),
      )
      // Push start forward well past end → clamps to same day as end (one-day event).
      store.grabResize({ days: 50, edge: 'start' })
      expect(localizer.startOf({ value: store.keyboardDrag.value!.start, unit: 'day' })).toBe(
        localizer.startOf({ value: adEvents[0]!.end, unit: 'day' }),
      )
    })

    it('grabMove steps by whole weeks (month ↑/↓)', () => {
      const store = createCalendarStore<Event>({ localizer, events })
      store.grabEvent({ id: 1 })
      store.grabMove({ days: 7 })
      expect(store.keyboardDrag.value!.start).toBe(localizer.add({ value: events[0]!.start, amount: 7, unit: 'day' }))
    })

    it('grabCommit after a move fires onEventDrop with the proposed bounds', () => {
      const onEventDrop = vi.fn()
      const onEventResize = vi.fn()
      const store = createCalendarStore<Event>({ localizer, events, onEventDrop, onEventResize, step: 30 })
      store.grabEvent({ id: 1 })
      store.grabMove({ minutes: 30 })
      const bounds = store.keyboardDrag.value!
      store.grabCommit()
      expect(onEventDrop).toHaveBeenCalledWith({ event: events[0], start: bounds.start, end: bounds.end, allDay: false })
      expect(onEventResize).not.toHaveBeenCalled()
      expect(store.keyboardDrag.value).toBeNull()
      expect(store.dragPreview.value).toBeNull()
    })

    it('grabCommit after a pure resize fires onEventResize', () => {
      const onEventDrop = vi.fn()
      const onEventResize = vi.fn()
      const store = createCalendarStore<Event>({ localizer, events, onEventDrop, onEventResize, step: 30 })
      store.grabEvent({ id: 1 })
      store.grabResize({ minutes: 30 })
      const bounds = store.keyboardDrag.value!
      store.grabCommit()
      expect(onEventResize).toHaveBeenCalledWith({ event: events[0], start: bounds.start, end: bounds.end, allDay: false })
      expect(onEventDrop).not.toHaveBeenCalled()
    })

    it('a move-then-resize commit reports once through onEventDrop (carries both ends)', () => {
      const onEventDrop = vi.fn()
      const onEventResize = vi.fn()
      const store = createCalendarStore<Event>({ localizer, events, onEventDrop, onEventResize, step: 30 })
      store.grabEvent({ id: 1 })
      store.grabMove({ minutes: 30 })
      store.grabResize({ minutes: 30 })
      store.grabCommit()
      expect(onEventDrop).toHaveBeenCalledTimes(1)
      expect(onEventResize).not.toHaveBeenCalled()
    })

    it('grabCancel clears the grab + preview without firing a callback', () => {
      const onEventDrop = vi.fn()
      const store = createCalendarStore<Event>({ localizer, events, onEventDrop, step: 30 })
      store.grabEvent({ id: 1 })
      store.grabMove({ minutes: 30 })
      store.grabCancel()
      expect(store.keyboardDrag.value).toBeNull()
      expect(store.dragPreview.value).toBeNull()
      expect(onEventDrop).not.toHaveBeenCalled()
    })

    it('grabMove / grabResize / grabCommit are no-ops when nothing is grabbed', () => {
      const onEventDrop = vi.fn()
      const store = createCalendarStore<Event>({ localizer, events, onEventDrop })
      expect(() => {
        store.grabMove({ minutes: 30 })
        store.grabResize({ minutes: 30 })
        store.grabCommit()
      }).not.toThrow()
      expect(store.keyboardDrag.value).toBeNull()
      expect(onEventDrop).not.toHaveBeenCalled()
    })

    it('grabEvent returns false and starts nothing when the event is not draggable', () => {
      const store = createCalendarStore<Event>({ localizer, events, draggableAccessor: () => false })
      expect(store.grabEvent({ id: 1 })).toBe(false)
      expect(store.keyboardDrag.value).toBeNull()
      expect(store.dragPreview.value).toBeNull()
    })

    it('grabResize is a no-op when the grabbed event is not resizable', () => {
      const store = createCalendarStore<Event>({ localizer, events, resizableAccessor: () => false })
      store.grabEvent({ id: 1 })
      const beforeEnd = store.keyboardDrag.value?.end
      store.grabResize({ minutes: 30 })
      expect(store.keyboardDrag.value?.end).toBe(beforeEnd)
    })
  })

  describe('isResizable', () => {
    interface ResizableEvent extends Event {
      resizable?: boolean
    }
    const event: ResizableEvent = { id: 1, title: 'A', start: 's', end: 'e' }

    it('defaults to every event being resizable', () => {
      const store = createCalendarStore<ResizableEvent>({ localizer })
      expect(store.isResizable(event)).toBe(true)
    })

    it('respects a function resizableAccessor', () => {
      const store = createCalendarStore<ResizableEvent>({ localizer, resizableAccessor: (e) => e.id !== 2 })
      expect(store.isResizable({ ...event, id: 1 })).toBe(true)
      expect(store.isResizable({ ...event, id: 2 })).toBe(false)
    })

    it('reads a string resizableAccessor, defaulting an unset field to resizable', () => {
      const store = createCalendarStore<ResizableEvent>({ localizer, resizableAccessor: 'resizable' })
      expect(store.isResizable({ ...event, resizable: false })).toBe(false)
      // field absent → accessor resolves null → defaults to resizable
      expect(store.isResizable(event)).toBe(true)
    })
  })

  describe('isDraggable', () => {
    interface DraggableEvent extends Event {
      draggable?: boolean
    }
    const event: DraggableEvent = { id: 1, title: 'A', start: 's', end: 'e' }

    it('defaults to every event being draggable', () => {
      const store = createCalendarStore<DraggableEvent>({ localizer })
      expect(store.isDraggable(event)).toBe(true)
    })

    it('respects a function draggableAccessor', () => {
      const store = createCalendarStore<DraggableEvent>({ localizer, draggableAccessor: (e) => e.id !== 2 })
      expect(store.isDraggable({ ...event, id: 1 })).toBe(true)
      expect(store.isDraggable({ ...event, id: 2 })).toBe(false)
    })

    it('reads a string draggableAccessor, defaulting an unset field to draggable', () => {
      const store = createCalendarStore<DraggableEvent>({ localizer, draggableAccessor: 'draggable' })
      expect(store.isDraggable({ ...event, draggable: false })).toBe(false)
      // field absent → accessor resolves null → defaults to draggable
      expect(store.isDraggable(event)).toBe(true)
    })
  })
})
