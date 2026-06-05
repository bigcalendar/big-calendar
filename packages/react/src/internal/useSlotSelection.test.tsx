import { Views } from '@big-calendar/core'
import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { CalendarProvider } from '../CalendarProvider'
import type { CalendarProviderProps } from '../CalendarProvider'
import { LOCALIZER_CASES } from '../testing/localizers'
import { useSlotSelection } from './useSlotSelection'

const DAY = '2026-06-15T00:00:00.000Z'
const DOUBLE_CLICK_MS = 250
const { create } = LOCALIZER_CASES[0]!

interface Event {
  id: number
  title: string
  start: string
  end: string
}

/** A minimal selection surface with four slot cells; cell 0 also holds an event. */
function Surface() {
  const onPointerDown = useSlotSelection('time')
  return (
    <div data-testid="surface" onPointerDown={onPointerDown}>
      <div data-date={DAY} data-slot-index="0">
        <button data-bc-event="1" data-testid="event">
          evt
        </button>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} data-date={DAY} data-slot-index={i} data-testid={`slot${i}`} />
      ))}
      <div data-testid="nocell" />
    </div>
  )
}

describe('useSlotSelection', () => {
  let localizer: Awaited<ReturnType<typeof create>>
  beforeAll(async () => {
    localizer = await create()
  })
  afterEach(() => {
    vi.useRealTimers()
    // jsdom has no layout, so elementFromPoint is undefined; drop any test stub.
    delete (document as { elementFromPoint?: unknown }).elementFromPoint
  })

  /** Stub elementFromPoint (absent in jsdom) to resolve to a given hit cell. */
  function stubPoint(el: Element) {
    document.elementFromPoint = () => el
  }

  function renderSurface(extra?: Partial<CalendarProviderProps<Event>>) {
    return render(
      <CalendarProvider<Event> localizer={localizer} defaultDate={DAY} defaultView={Views.DAY} {...extra}>
        <Surface />
      </CalendarProvider>,
    )
  }

  it('drag-selects across slots and commits a range', () => {
    const onSelectSlot = vi.fn()
    const { getByTestId } = renderSurface({ selectable: true, onSelectSlot })
    stubPoint(getByTestId('slot3'))

    fireEvent.pointerDown(getByTestId('slot1'), { button: 0, clientX: 0, clientY: 0 })
    // Tiny move stays under the drag threshold (no selection yet).
    fireEvent.pointerMove(window, { clientX: 1, clientY: 1 })
    expect(onSelectSlot).not.toHaveBeenCalled()
    // A real move past the threshold starts + extends the drag.
    fireEvent.pointerMove(window, { clientX: 0, clientY: 60 })
    fireEvent.pointerUp(window)

    expect(onSelectSlot).toHaveBeenCalledTimes(1)
    const arg = onSelectSlot.mock.calls[0]![0] as { action: string; slots: string[] }
    expect(arg.action).toBe('select')
    expect(arg.slots).toHaveLength(3) // slots 1, 2, 3
  })

  it('treats a press without a drag as a click after the double-click window', () => {
    vi.useFakeTimers()
    const onSelectSlot = vi.fn()
    const { getByTestId } = renderSurface({ selectable: true, onSelectSlot })
    fireEvent.pointerDown(getByTestId('slot2'), { button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerUp(window)
    expect(onSelectSlot).not.toHaveBeenCalled() // waiting to rule out a double
    act(() => {
      vi.advanceTimersByTime(DOUBLE_CLICK_MS)
    })
    expect(onSelectSlot).toHaveBeenCalledTimes(1)
    expect((onSelectSlot.mock.calls[0]![0] as { action: string }).action).toBe('click')
  })

  it('upgrades two quick presses on the same slot to a double-click', () => {
    vi.useFakeTimers()
    const onSelectSlot = vi.fn()
    const { getByTestId } = renderSurface({ selectable: true, onSelectSlot })
    fireEvent.pointerDown(getByTestId('slot2'), { button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerUp(window)
    act(() => {
      vi.advanceTimersByTime(100)
    })
    fireEvent.pointerDown(getByTestId('slot2'), { button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerUp(window)
    act(() => {
      vi.advanceTimersByTime(DOUBLE_CLICK_MS)
    })
    expect(onSelectSlot).toHaveBeenCalledTimes(1)
    expect((onSelectSlot.mock.calls[0]![0] as { action: string }).action).toBe('doubleClick')
  })

  it('ignores presses over an event (events own their interaction)', () => {
    vi.useFakeTimers()
    const onSelectSlot = vi.fn()
    const { getByTestId } = renderSurface({ selectable: true, onSelectSlot })
    fireEvent.pointerDown(getByTestId('event'), { button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerUp(window)
    act(() => {
      vi.advanceTimersByTime(DOUBLE_CLICK_MS)
    })
    expect(onSelectSlot).not.toHaveBeenCalled()
  })

  it('ignores presses that miss a slot cell and non-primary buttons', () => {
    const onSelectSlot = vi.fn()
    const { getByTestId } = renderSurface({ selectable: true, onSelectSlot })
    fireEvent.pointerDown(getByTestId('nocell'), { button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerDown(getByTestId('slot1'), { button: 2, clientX: 0, clientY: 0 }) // right-click
    fireEvent.pointerUp(window)
    expect(onSelectSlot).not.toHaveBeenCalled()
  })

  it('does nothing when selection is disabled', () => {
    vi.useFakeTimers()
    const onSelectSlot = vi.fn()
    const { getByTestId } = renderSurface({ onSelectSlot }) // selectable defaults to false
    fireEvent.pointerDown(getByTestId('slot1'), { button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerUp(window)
    act(() => {
      vi.advanceTimersByTime(DOUBLE_CLICK_MS)
    })
    expect(onSelectSlot).not.toHaveBeenCalled()
  })
})
