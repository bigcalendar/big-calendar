import { Views } from '@big-calendar/core'
import type { CalendarStore, LocalizerContract } from '@big-calendar/core'
import { defineComponent, nextTick, reactive } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import type { CalendarProps } from './calendarProps.type'
import { useCalendarStore } from './useCalendarStore'

/**
 * Mount a component that calls `useCalendarStore` with a reactive props object.
 * Returns the store instance and helpers to mutate props and unmount.
 */
function withStore<TEvent = unknown, TResource = unknown>(
  initialProps: CalendarProps<TEvent, TResource>,
) {
  let store!: CalendarStore<TEvent, TResource>
  const reactiveProps = reactive(initialProps) as CalendarProps<TEvent, TResource>

  const wrapper = mount(
    defineComponent({
      setup() {
        store = useCalendarStore<TEvent, TResource>(reactiveProps)
        return () => null
      },
    }),
  )

  return {
    store,
    wrapper,
    setProps(patch: Partial<CalendarProps<TEvent, TResource>>) {
      Object.assign(reactiveProps, patch)
    },
  }
}

describe.each(LOCALIZER_CASES)('useCalendarStore [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  it('creates the store with the correct initial view', () => {
    const { store } = withStore({ localizer, defaultView: Views.WEEK })
    expect(store.view.value).toBe(Views.WEEK)
  })

  it('falls back to the store default when no view is supplied', () => {
    const { store } = withStore({ localizer })
    expect(store.view.value).toBe(Views.MONTH)
  })

  it('seeds the store with defaultDate when provided', () => {
    const { store } = withStore({ localizer, defaultDate: '2025-03-15T00:00:00Z' })
    expect(store.date.value).toBe('2025-03-15T00:00:00Z')
  })

  it('syncs a controlled view prop change into the store signal', async () => {
    const { store, setProps } = withStore({ localizer, view: Views.MONTH })
    expect(store.view.value).toBe(Views.MONTH)

    setProps({ view: Views.WEEK })
    await nextTick()

    expect(store.view.value).toBe(Views.WEEK)
  })

  it('syncs a controlled date prop change into the store signal', async () => {
    const date1 = '2025-01-01T00:00:00Z'
    const date2 = '2025-06-01T00:00:00Z'
    const { store, setProps } = withStore({ localizer, date: date1 })
    expect(store.date.value).toBe(date1)

    setProps({ date: date2 })
    await nextTick()

    expect(store.date.value).toBe(date2)
  })

  it('syncs events prop changes into the store signal', async () => {
    type Ev = { id: number }
    const { store, setProps } = withStore<Ev>({ localizer, events: [{ id: 1 }] })
    expect(store.events.value).toEqual([{ id: 1 }])

    setProps({ events: [{ id: 2 }, { id: 3 }] })
    await nextTick()

    expect(store.events.value).toEqual([{ id: 2 }, { id: 3 }])
  })

  it('defaults to an empty events array when events prop is absent', () => {
    const { store } = withStore({ localizer })
    expect(store.events.value).toEqual([])
  })

  it('syncs backgroundEvents prop changes', async () => {
    type Ev = { id: number }
    const { store, setProps } = withStore<Ev>({ localizer, backgroundEvents: [{ id: 10 }] })

    setProps({ backgroundEvents: [{ id: 20 }] })
    await nextTick()

    expect(store.backgroundEvents.value).toEqual([{ id: 20 }])
  })

  it('calls destroy on unmount', async () => {
    const { store, wrapper } = withStore({ localizer })
    const destroySpy = vi.spyOn(store, 'destroy')

    await wrapper.unmount()

    expect(destroySpy).toHaveBeenCalledOnce()
  })

  it('forwards onNavigate callback using the latest prop', async () => {
    const onNavigate = vi.fn()
    const { store, setProps } = withStore({ localizer, onNavigate })

    const onNavigate2 = vi.fn()
    setProps({ onNavigate: onNavigate2 })
    await nextTick()

    store.navigate({ direction: 'NEXT' })
    // First callback should not have fired; the latest one runs via closure.
    expect(onNavigate).not.toHaveBeenCalled()
    expect(onNavigate2).toHaveBeenCalledOnce()
  })
})
