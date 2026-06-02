import { describe, expect, it, vi } from 'vitest'
import { Navigate, Views } from '../constants/views.constant'
import type { CalendarConfig } from '../types/config.type'
import { createCalendarStore } from './createCalendarStore.function'
import { makeFakeLocalizer } from './navigateDate.function.test'

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
