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
})
