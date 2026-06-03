import { Navigate, Views } from '@big-calendar/core'
import type { ViewKey } from '@big-calendar/core'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { CalendarProps } from './useCalendar'
import { useCalendar } from './useCalendar'

interface Event {
  id: number
  title: string
  start: string
  end: string
}

// The store only touches the localizer when range/viewModel are read; these
// hook tests read state signals + call actions, so a stub localizer suffices.
const localizer = { getMinutesFromMidnight: () => 0 } as unknown as CalendarProps<Event>['localizer']

describe('useCalendar', () => {
  it('seeds an uncontrolled view from defaultView', () => {
    const { result } = renderHook(() => useCalendar<Event>({ localizer, defaultView: Views.WEEK }))
    expect(result.current.view.value).toBe(Views.WEEK)
  })

  it('reflects a controlled view and follows prop changes', () => {
    const { result, rerender } = renderHook((p: { view: ViewKey }) => useCalendar<Event>({ localizer, view: p.view }), {
      initialProps: { view: Views.DAY as ViewKey },
    })
    expect(result.current.view.value).toBe(Views.DAY)
    rerender({ view: Views.MONTH })
    expect(result.current.view.value).toBe(Views.MONTH)
  })

  it('syncs the events prop into the store when it changes', () => {
    const a: Event[] = [{ id: 1, title: 'a', start: 's', end: 'e' }]
    const b: Event[] = [{ id: 2, title: 'b', start: 's', end: 'e' }]
    const { result, rerender } = renderHook((p: { events: Event[] }) => useCalendar<Event>({ localizer, events: p.events }), {
      initialProps: { events: a },
    })
    expect(result.current.events.value).toBe(a)
    rerender({ events: b })
    expect(result.current.events.value).toBe(b)
  })

  it('runs uncontrolled actions and fires the latest callback', () => {
    const onNavigate = vi.fn()
    const { result } = renderHook(() =>
      useCalendar<Event>({ localizer, defaultDate: '2026-06-15T00:00:00.000Z', view: undefined, onNavigate }),
    )
    act(() => {
      result.current.navigate({ direction: Navigate.DATE, date: '2027-01-01T00:00:00.000Z' })
    })
    expect(result.current.date.value).toBe('2027-01-01T00:00:00.000Z')
    expect(onNavigate).toHaveBeenCalledWith({ date: '2027-01-01T00:00:00.000Z', view: Views.MONTH })
  })

  it('forwards every store callback to the latest props', () => {
    const onView = vi.fn()
    const onSelect = vi.fn()
    const onDrillDown = vi.fn()
    const onRangeChange = vi.fn()
    // Day view only needs startOf(day) for its range, so this stub is enough.
    const lz = {
      startOf: ({ value }: { value: string }) => value,
      getMinutesFromMidnight: () => 0,
    } as unknown as CalendarProps<Event>['localizer']

    const { result } = renderHook(() =>
      useCalendar<Event>({
        localizer: lz,
        view: Views.DAY,
        date: '2026-06-15T00:00:00.000Z',
        onView,
        onSelect,
        onDrillDown,
        onRangeChange,
      }),
    )

    act(() => result.current.setView({ view: Views.DAY }))
    expect(onView).toHaveBeenCalledWith({ view: Views.DAY })

    act(() => result.current.select({ id: 1 }))
    expect(onSelect).toHaveBeenCalledWith({ id: 1 })

    act(() => result.current.drilldown({ date: '2026-06-20T00:00:00.000Z' }))
    expect(onDrillDown).toHaveBeenCalledWith({ date: '2026-06-20T00:00:00.000Z', view: Views.DAY })

    act(() => result.current.navigate({ direction: Navigate.DATE, date: '2026-07-01T00:00:00.000Z' }))
    expect(onRangeChange).toHaveBeenCalled()
  })

  it('keeps a single store instance across rerenders and tears down on unmount', () => {
    const { result, rerender, unmount } = renderHook(() => useCalendar<Event>({ localizer }))
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
    const destroy = vi.spyOn(first, 'destroy')
    unmount()
    expect(destroy).toHaveBeenCalled()
  })
})
