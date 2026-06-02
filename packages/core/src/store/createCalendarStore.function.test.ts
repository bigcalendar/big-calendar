import type { LocalizerContract } from '@big-calendar/localizer'
import { describe, expect, it, vi } from 'vitest'
import { Navigate, Views } from '../constants/views.constant'
import { makeTimeLocalizer } from '../timegrid/slotMetrics.function.test'
import type { CalendarConfig } from '../types/config.type'
import { createCalendarStore } from './createCalendarStore.function'
import { makeFakeLocalizer } from './navigateDate.function.test'
import { makeRangeLocalizer } from './viewRange.function.test'

// A localizer that supports both the visible-range math (week/month/day) and the
// minute-level slot math the view-model builders need.
const fullLocalizer = {
  ...makeTimeLocalizer(),
  ...makeRangeLocalizer(1),
} as unknown as LocalizerContract

interface Event {
  id: number
  title: string
  start: string
  end: string
}

const localizer = makeFakeLocalizer()
const isoPattern = /^\d{4}-\d{2}-\d{2}T/

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
      date: '2026-06-15T00:00:00.000Z',
      view: Views.MONTH,
      onNavigate,
    })
    store.navigate({ direction: Navigate.NEXT })
    expect(store.date.value).toBe('2026-07-15T00:00:00.000Z')
    expect(onNavigate).toHaveBeenCalledWith({
      date: '2026-07-15T00:00:00.000Z',
      view: Views.MONTH,
    })
  })

  it('navigate TODAY uses getNow and DATE jumps to the target', () => {
    const store = createCalendarStore<Event>({
      localizer,
      date: '2026-06-15T00:00:00.000Z',
      getNow: () => '2026-01-20T00:00:00.000Z',
    })
    store.navigate({ direction: Navigate.TODAY })
    expect(store.date.value).toBe('2026-01-20T00:00:00.000Z')
    store.navigate({ direction: Navigate.DATE, date: '2027-03-01T00:00:00.000Z' })
    expect(store.date.value).toBe('2027-03-01T00:00:00.000Z')
  })

  it('navigate works without an onNavigate callback', () => {
    const store = createCalendarStore<Event>({ localizer, date: '2026-06-15T00:00:00.000Z' })
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

  it('select sets and clears the selection and fires onSelect', () => {
    const onSelect = vi.fn()
    const store = createCalendarStore<Event>({ localizer, onSelect })
    store.select({ id: 42 })
    expect(store.selected.value).toBe(42)
    store.select({ id: null })
    expect(store.selected.value).toBeNull()
    expect(onSelect).toHaveBeenNthCalledWith(1, { id: 42 })
    expect(onSelect).toHaveBeenNthCalledWith(2, { id: null })
  })

  it('select works without an onSelect callback', () => {
    const store = createCalendarStore<Event>({ localizer })
    expect(() => store.select({ id: 1 })).not.toThrow()
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
  const rangeLocalizer = makeRangeLocalizer(1)
  const monday = '2026-06-15T00:00:00.000Z'

  it('exposes a derived visible range that tracks date + view', () => {
    const store = createCalendarStore<Event>({
      localizer: rangeLocalizer,
      date: monday,
      view: Views.WEEK,
    })
    expect(store.range.value.days).toHaveLength(7)
    store.setView({ view: Views.DAY })
    expect(store.range.value.days).toEqual([monday])
  })

  it('fires onRangeChange on change but not on init', () => {
    const onRangeChange = vi.fn()
    const store = createCalendarStore<Event>({
      localizer: rangeLocalizer,
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
      localizer: rangeLocalizer,
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
      localizer: rangeLocalizer,
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
      localizer: rangeLocalizer,
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
      localizer: rangeLocalizer,
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
      localizer: rangeLocalizer,
      date: monday,
      view: Views.MONTH,
      getDrilldownView: () => Views.WEEK,
    })
    resolved.drilldown({ date: '2026-06-20T00:00:00.000Z' })
    expect(resolved.view.value).toBe(Views.WEEK)

    const disabled = createCalendarStore<Event>({
      localizer: rangeLocalizer,
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
  const monday = '2026-06-15T00:00:00.000Z'

  it('derives a month model in the month view', () => {
    const store = createCalendarStore<Event>({ localizer: fullLocalizer, date: monday, view: Views.MONTH })
    expect(store.viewModel.value.kind).toBe('month')
  })

  it('derives a time-grid model with one column per visible day', () => {
    const dayStore = createCalendarStore<Event>({ localizer: fullLocalizer, date: monday, view: Views.DAY })
    const dayVm = dayStore.viewModel.value
    expect(dayVm.kind).toBe('time')
    if (dayVm.kind === 'time') expect(dayVm.timeGrid.columns).toHaveLength(1)

    const weekStore = createCalendarStore<Event>({ localizer: fullLocalizer, date: monday, view: Views.WEEK })
    const weekVm = weekStore.viewModel.value
    if (weekVm.kind === 'time') expect(weekVm.timeGrid.columns).toHaveLength(7)
  })

  it('recomputes the view model when the view changes', () => {
    const store = createCalendarStore<Event>({ localizer: fullLocalizer, date: monday, view: Views.DAY })
    expect(store.viewModel.value.kind).toBe('time')
    store.setView({ view: Views.AGENDA })
    expect(store.viewModel.value.kind).toBe('agenda')
  })

  it('applies the configured time window to time-grid columns', () => {
    const store = createCalendarStore<Event>({
      localizer: fullLocalizer,
      date: monday,
      view: Views.DAY,
      min: '2026-06-15T08:00:00.000Z',
      max: '2026-06-15T18:00:00.000Z',
      events: [{ id: 1, title: 'e1', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T10:00:00.000Z' }],
    })
    const vm = store.viewModel.value
    if (vm.kind === 'time') {
      expect(vm.timeGrid.columns[0]?.min).toBe('2026-06-15T08:00:00.000Z')
      expect(vm.timeGrid.columns[0]?.events[0]?.top).toBeCloseTo(0.1)
    }
  })
})
