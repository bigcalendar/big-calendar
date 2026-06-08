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
})
