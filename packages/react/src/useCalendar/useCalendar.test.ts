import { Navigate, Views } from '@big-calendar/core'
import type { ViewKey } from '@big-calendar/core'
import { act, renderHook } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import { useCalendar } from '.'

interface Event {
  id: number
  title: string
  start: string
  end: string
}

describe.each(LOCALIZER_CASES)('useCalendar [$name]', ({ create }) => {
  let localizer: Awaited<ReturnType<typeof create>>
  beforeAll(async () => {
    localizer = await create()
  })

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
    const onEventSelect = vi.fn()
    const onDrillDown = vi.fn()
    const onRangeChange = vi.fn()

    const { result } = renderHook(() =>
      useCalendar<Event>({
        localizer,
        view: Views.DAY,
        date: '2026-06-15T00:00:00.000Z',
        onView,
        onEventSelect,
        onDrillDown,
        onRangeChange,
      }),
    )

    act(() => result.current.setView({ view: Views.DAY }))
    expect(onView).toHaveBeenCalledWith({ view: Views.DAY })

    act(() => result.current.selectEvent({ id: 1 }))
    expect(onEventSelect).toHaveBeenCalledWith({ id: 1 })

    act(() => result.current.drilldown({ date: '2026-06-20T00:00:00.000Z' }))
    expect(onDrillDown).toHaveBeenCalledWith({ date: '2026-06-20T00:00:00.000Z', view: Views.DAY })

    act(() => result.current.navigate({ direction: Navigate.DATE, date: '2026-07-01T00:00:00.000Z' }))
    expect(onRangeChange).toHaveBeenCalled()
  })

  it('calls the LATEST onEventDrop, not the one captured at store creation', () => {
    // Regression: a stale onEventDrop closes over the app's initial `events`, so
    // an optimistic-update + rollback handler would revert against the wrong
    // snapshot (every failure undoing every prior move).
    const events: Event[] = [
      { id: 1, title: 'A', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T10:00:00.000Z' },
    ]
    const first = vi.fn()
    const second = vi.fn()
    const { result, rerender } = renderHook(
      (p: { onEventDrop: (args: unknown) => void }) =>
        useCalendar<Event>({ localizer, events, onEventDrop: p.onEventDrop }),
      { initialProps: { onEventDrop: first } },
    )
    rerender({ onEventDrop: second })
    act(() => result.current.moveEvent({ id: 1, target: '2026-06-18T00:00:00.000Z', mode: 'day' }))
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('calls the LATEST onEventResize, not the one captured at store creation', () => {
    // Same stale-closure regression as onEventDrop: a resize handler doing
    // optimistic-update + rollback closes over the app's current `events`.
    const events: Event[] = [
      { id: 1, title: 'A', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T10:00:00.000Z' },
    ]
    const first = vi.fn()
    const second = vi.fn()
    const { result, rerender } = renderHook(
      (p: { onEventResize: (args: unknown) => void }) =>
        useCalendar<Event>({ localizer, events, onEventResize: p.onEventResize }),
      { initialProps: { onEventResize: first } },
    )
    rerender({ onEventResize: second })
    act(() => result.current.resizeEvent({ id: 1, edge: 'end', target: '2026-06-15T11:00:00.000Z' }))
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('calls the LATEST onDropFromOutside, not the one captured at store creation', () => {
    // Same stale-closure regression: a drop-from-outside handler appends the new
    // event to the app's current `events`, so a stale closure adds to a stale list.
    const first = vi.fn()
    const second = vi.fn()
    const { result, rerender } = renderHook(
      (p: { onDropFromOutside: (args: unknown) => void }) =>
        useCalendar<Event>({ localizer, onDropFromOutside: p.onDropFromOutside }),
      { initialProps: { onDropFromOutside: first } },
    )
    rerender({ onDropFromOutside: second })
    act(() => result.current.dropExternal({ target: '2026-06-15T09:00:00.000Z', durationMinutes: 60 }))
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('calls the LATEST onEventDragStart, not the one captured at store creation', () => {
    const events: Event[] = [
      { id: 1, title: 'A', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T10:00:00.000Z' },
    ]
    const first = vi.fn()
    const second = vi.fn()
    const { result, rerender } = renderHook(
      (p: { onEventDragStart: (args: unknown) => void }) =>
        useCalendar<Event>({ localizer, events, onEventDragStart: p.onEventDragStart }),
      { initialProps: { onEventDragStart: first } },
    )
    rerender({ onEventDragStart: second })
    act(() => result.current.eventDragStart({ id: 1 }))
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('flows the views prop into store.enabledViews', () => {
    const { result } = renderHook(() =>
      useCalendar<Event>({ localizer, views: ['month', 'agenda'] }),
    )
    expect(result.current.enabledViews.value).toEqual(['month', 'agenda'])
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
