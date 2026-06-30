import { Views } from '@big-calendar/core'
import type { CalendarStore, LocalizerContract } from '@big-calendar/core'
import {
  EnvironmentInjector,
  createEnvironmentInjector,
  runInInjectionContext,
  signal,
} from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import type { CalendarProps } from './calendarProps.type'
import { injectCalendarStore } from './injectCalendarStore'

function withStore<TEvent = unknown, TResource = unknown>(
  initialProps: CalendarProps<TEvent, TResource>,
) {
  const propsSignal = signal<CalendarProps<TEvent, TResource>>(initialProps)
  const parentInjector = TestBed.inject(EnvironmentInjector)
  const envInjector = createEnvironmentInjector([], parentInjector)

  let store!: CalendarStore<TEvent, TResource>
  runInInjectionContext(envInjector, () => {
    store = injectCalendarStore(() => propsSignal())
  })

  return {
    store,
    envInjector,
    setProps(patch: Partial<CalendarProps<TEvent, TResource>>) {
      propsSignal.set({ ...propsSignal(), ...patch })
    },
  }
}

describe.each(LOCALIZER_CASES)('injectCalendarStore [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  it('creates the store with the correct initial view', () => {
    const { store } = withStore({ localizer, defaultView: Views.WEEK })
    expect(store.view.value).toBe(Views.WEEK)
  })

  it('falls back to MONTH view when no view is supplied', () => {
    const { store } = withStore({ localizer })
    expect(store.view.value).toBe(Views.MONTH)
  })

  it('seeds the store with defaultDate when provided', () => {
    const { store } = withStore({ localizer, defaultDate: '2025-03-15T00:00:00Z' })
    expect(store.date.value).toBe('2025-03-15T00:00:00Z')
  })

  it('syncs a controlled view prop change into the store signal', () => {
    const { store, setProps } = withStore({ localizer, view: Views.MONTH })
    expect(store.view.value).toBe(Views.MONTH)

    setProps({ view: Views.WEEK })
    TestBed.flushEffects()

    expect(store.view.value).toBe(Views.WEEK)
  })

  it('syncs a controlled date prop change into the store signal', () => {
    const date1 = '2025-01-01T00:00:00Z'
    const date2 = '2025-06-01T00:00:00Z'
    const { store, setProps } = withStore({ localizer, date: date1 })
    expect(store.date.value).toBe(date1)

    setProps({ date: date2 })
    TestBed.flushEffects()

    expect(store.date.value).toBe(date2)
  })

  it('syncs events prop changes into the store signal', () => {
    type Ev = { id: number }
    const { store, setProps } = withStore<Ev>({ localizer, events: [{ id: 1 }] })
    expect(store.events.value).toEqual([{ id: 1 }])

    setProps({ events: [{ id: 2 }, { id: 3 }] })
    TestBed.flushEffects()

    expect(store.events.value).toEqual([{ id: 2 }, { id: 3 }])
  })

  it('defaults to an empty events array when events prop is absent', () => {
    const { store } = withStore({ localizer })
    expect(store.events.value).toEqual([])
  })

  it('syncs backgroundEvents prop changes', () => {
    type Ev = { id: number }
    const { store, setProps } = withStore<Ev>({ localizer, backgroundEvents: [{ id: 10 }] })

    setProps({ backgroundEvents: [{ id: 20 }] })
    TestBed.flushEffects()

    expect(store.backgroundEvents.value).toEqual([{ id: 20 }])
  })

  it('calls store.destroy and effect.destroy when the injector is destroyed', () => {
    const { store, envInjector } = withStore({ localizer })
    const destroySpy = vi.spyOn(store, 'destroy')

    envInjector.destroy()

    expect(destroySpy).toHaveBeenCalledOnce()
  })

  it('forwards onNavigate callback using the latest prop', () => {
    const onNavigate = vi.fn()
    const { store, setProps } = withStore({ localizer, onNavigate })

    const onNavigate2 = vi.fn()
    setProps({ onNavigate: onNavigate2 })
    TestBed.flushEffects()

    store.navigate({ direction: 'NEXT' })

    expect(onNavigate).not.toHaveBeenCalled()
    expect(onNavigate2).toHaveBeenCalledOnce()
  })

  it('forwards onView callback when setView is called', () => {
    const onView = vi.fn()
    const { store } = withStore({ localizer, defaultView: Views.MONTH, onView })
    store.setView({ view: Views.WEEK })
    expect(onView).toHaveBeenCalledOnce()
  })

  it('does not wire onView when omitted at creation', () => {
    const { store } = withStore({ localizer, defaultView: Views.MONTH })
    // No onView prop — store.eventHandlers.hasOnView should be false (no throw)
    expect(() => store.setView({ view: Views.WEEK })).not.toThrow()
  })

  it('covers the always-created onEventDrop wrapper via keyboard-drag drop', () => {
    const onEventDrop = vi.fn()
    const eventObj = { id: 'd1', title: 'E', start: '2024-06-15T10:00:00.000Z', end: '2024-06-15T11:00:00.000Z', draggable: true }
    const { store } = withStore({ localizer, onEventDrop, events: [eventObj] })
    const grabbed = store.grabEvent({ id: 'd1' })
    expect(grabbed).toBe(true)
    store.grabMove({ days: 1 })
    store.grabCommit()
    expect(onEventDrop).toHaveBeenCalled()
  })

  it('covers the always-created onEventResize wrapper via keyboard-drag resize', () => {
    const onEventResize = vi.fn()
    // resizable: true is required — the store's isResizable accessor reads event.resizable
    const eventObj = { id: 'r1', title: 'E', start: '2024-06-15T10:00:00.000Z', end: '2024-06-15T11:00:00.000Z', draggable: true, resizable: true }
    const { store } = withStore({ localizer, onEventResize, events: [eventObj] })
    store.grabEvent({ id: 'r1' })
    store.grabResize({ days: 1, edge: 'end' })
    store.grabCommit()
    expect(onEventResize).toHaveBeenCalled()
  })

  it('syncs resources prop changes', () => {
    type Res = { id: string; title: string }
    const { store, setProps } = withStore<unknown, Res>({ localizer, resources: [{ id: 'r1', title: 'Room A' }] })
    expect(store.resources.value).toEqual([{ id: 'r1', title: 'Room A' }])

    setProps({ resources: [{ id: 'r2', title: 'Room B' }] })
    TestBed.flushEffects()

    expect(store.resources.value).toEqual([{ id: 'r2', title: 'Room B' }])
  })

  it('forwards onView callback when setView is called', () => {
    const onView = vi.fn()
    const { store } = withStore({ localizer, defaultView: Views.MONTH, onView })
    store.setView({ view: Views.WEEK })
    expect(onView).toHaveBeenCalledWith({ view: Views.WEEK })
  })

  it('forwards onRangeChange callback when navigating', () => {
    const onRangeChange = vi.fn()
    const { store } = withStore({ localizer, onRangeChange })
    store.navigate({ direction: 'NEXT' })
    expect(onRangeChange).toHaveBeenCalled()
  })

  it('forwards onDrillDown callback when drilldown is called', () => {
    const onDrillDown = vi.fn()
    const { store } = withStore({ localizer, defaultView: Views.MONTH, onDrillDown })
    store.drilldown({ date: '2024-02-01' })
    expect(onDrillDown).toHaveBeenCalled()
  })

  it('forwards onEventSelect callback when selectEvent is called', () => {
    const onEventSelect = vi.fn()
    const { store } = withStore({
      localizer,
      onEventSelect,
      events: [{ id: '1', title: 'E', start: '2024-01-15T10:00:00Z', end: '2024-01-15T11:00:00Z' }],
    })
    store.selectEvent({ id: '1' })
    expect(onEventSelect).toHaveBeenCalled()
  })

  it('forwards onSlotClick callback when selection.click is called', () => {
    const onSlotClick = vi.fn()
    const { store } = withStore({ localizer, onSlotClick, selectable: true })
    store.selection.click({ slot: 0, date: '2024-01-01', mode: 'day' })
    expect(onSlotClick).toHaveBeenCalled()
  })

  it('does not wire onView when omitted at creation', () => {
    const { store } = withStore({ localizer, defaultView: Views.MONTH })
    expect(() => store.setView({ view: Views.WEEK })).not.toThrow()
  })

  it('does not wire onEventSelect when omitted', () => {
    const { store } = withStore({ localizer })
    expect(() => store.selectEvent({ id: null })).not.toThrow()
  })

  it('does not wire onRangeChange when omitted', () => {
    const { store } = withStore({ localizer })
    expect(() => store.navigate({ direction: 'NEXT' })).not.toThrow()
  })

  it('forwards onEventClick callback when eventHandlers.click is called', () => {
    const onEventClick = vi.fn()
    const eventObj = { id: '1', title: 'E', start: '2024-01-15T10:00:00Z', end: '2024-01-15T11:00:00Z' }
    const { store } = withStore({ localizer, onEventClick, events: [eventObj] })
    store.eventHandlers.click(eventObj as never, new MouseEvent('click'))
    expect(onEventClick).toHaveBeenCalled()
  })

  it('forwards onEventDoubleClick callback when eventHandlers.doubleClick is called', () => {
    const onEventDoubleClick = vi.fn()
    const eventObj = { id: '2', title: 'E', start: '2024-01-15T10:00:00Z', end: '2024-01-15T11:00:00Z' }
    const { store } = withStore({ localizer, onEventDoubleClick, events: [eventObj] })
    store.eventHandlers.doubleClick(eventObj as never, new MouseEvent('dblclick'))
    expect(onEventDoubleClick).toHaveBeenCalled()
  })

  it('forwards onEventRightClick callback when eventHandlers.rightClick is called', () => {
    const onEventRightClick = vi.fn()
    const eventObj = { id: '3', title: 'E', start: '2024-01-15T10:00:00Z', end: '2024-01-15T11:00:00Z' }
    const { store } = withStore({ localizer, onEventRightClick, events: [eventObj] })
    store.eventHandlers.rightClick(eventObj as never, new MouseEvent('contextmenu'))
    expect(onEventRightClick).toHaveBeenCalled()
  })

  it('forwards onEventMiddleClick callback when eventHandlers.middleClick is called', () => {
    const onEventMiddleClick = vi.fn()
    const eventObj = { id: '4', title: 'E', start: '2024-01-15T10:00:00Z', end: '2024-01-15T11:00:00Z' }
    const { store } = withStore({ localizer, onEventMiddleClick, events: [eventObj] })
    store.eventHandlers.middleClick(eventObj as never, new MouseEvent('auxclick'))
    expect(onEventMiddleClick).toHaveBeenCalled()
  })

  it('forwards onDropFromOutside callback when dropExternal is called', () => {
    const onDropFromOutside = vi.fn()
    const { store } = withStore({ localizer, onDropFromOutside })
    store.dropExternal({ target: '2024-01-15T10:00:00Z' })
    expect(onDropFromOutside).toHaveBeenCalled()
  })

  it('forwards onEventDragStart callback when eventDragStart is called', () => {
    const onEventDragStart = vi.fn()
    const eventObj = { id: '5', title: 'E', start: '2024-01-15T10:00:00Z', end: '2024-01-15T11:00:00Z' }
    const { store } = withStore({ localizer, onEventDragStart, events: [eventObj] })
    store.eventDragStart({ id: '5' })
    expect(onEventDragStart).toHaveBeenCalled()
  })

  it('forwards onSlotDoubleClick callback when selection.doubleClick is called', () => {
    const onSlotDoubleClick = vi.fn()
    const { store } = withStore({ localizer, onSlotDoubleClick, selectable: true })
    store.selection.doubleClick({ slot: 0, date: '2024-01-01', mode: 'day' })
    expect(onSlotDoubleClick).toHaveBeenCalled()
  })

  it('forwards onSlotSelect callback when selection is completed after a drag', () => {
    const onSlotSelect = vi.fn()
    const { store } = withStore({ localizer, onSlotSelect, selectable: true })
    store.selection.start({ slot: 0, date: '2024-01-01', mode: 'day' })
    store.selection.to({ slot: 2 })
    store.selection.complete()
    expect(onSlotSelect).toHaveBeenCalled()
  })

  it('forwards onSlotSelecting callback when selection.to is called during a drag', () => {
    const onSlotSelecting = vi.fn()
    const { store } = withStore({ localizer, onSlotSelecting, selectable: true })
    store.selection.start({ slot: 0, date: '2024-01-01', mode: 'day' })
    store.selection.to({ slot: 1 })
    expect(onSlotSelecting).toHaveBeenCalled()
  })
})
