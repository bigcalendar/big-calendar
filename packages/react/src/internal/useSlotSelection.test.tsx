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

  /**
   * The committed slot callbacks were split per gesture (`onSlotClick` /
   * `onSlotDoubleClick` / `onSlotSelect`) and the payload dropped its `action`
   * field. This fans all three into one spy and re-injects `action` (from which
   * callback fired) so the gesture assertions below stay expressive.
   */
  function slotSpy() {
    const fn = vi.fn()
    const props: Partial<CalendarProviderProps<Event>> = {
      onSlotClick: (s) => fn({ action: 'click', ...s }),
      onSlotDoubleClick: (s) => fn({ action: 'doubleClick', ...s }),
      onSlotSelect: (s) => fn({ action: 'select', ...s }),
    }
    return { fn, props }
  }

  it('drag-selects across slots and commits a range', () => {
    const { fn: onSelectSlot, props: slotProps } = slotSpy()
    const { getByTestId } = renderSurface({ selectable: true, ...slotProps })
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
    const { fn: onSelectSlot, props: slotProps } = slotSpy()
    const { getByTestId } = renderSurface({ selectable: true, ...slotProps })
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
    const { fn: onSelectSlot, props: slotProps } = slotSpy()
    const { getByTestId } = renderSurface({ selectable: true, ...slotProps })
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

  it('a second tap on a different slot supersedes the first pending click', () => {
    vi.useFakeTimers()
    const { fn: onSelectSlot, props: slotProps } = slotSpy()
    const { getByTestId } = renderSurface({ selectable: true, ...slotProps })
    fireEvent.pointerDown(getByTestId('slot1'), { button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerUp(window)
    act(() => {
      vi.advanceTimersByTime(100) // within the double-click window, but a different slot next
    })
    fireEvent.pointerDown(getByTestId('slot2'), { button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerUp(window)
    act(() => {
      vi.advanceTimersByTime(DOUBLE_CLICK_MS)
    })
    // Only the second slot clicks; the first pending click was discarded.
    expect(onSelectSlot).toHaveBeenCalledTimes(1)
    const arg = onSelectSlot.mock.calls[0]![0] as { action: string; start: string }
    expect(arg.action).toBe('click')
  })

  it('ignores presses over an event (events own their interaction)', () => {
    vi.useFakeTimers()
    const { fn: onSelectSlot, props: slotProps } = slotSpy()
    const { getByTestId } = renderSurface({ selectable: true, ...slotProps })
    fireEvent.pointerDown(getByTestId('event'), { button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerUp(window)
    act(() => {
      vi.advanceTimersByTime(DOUBLE_CLICK_MS)
    })
    expect(onSelectSlot).not.toHaveBeenCalled()
  })

  it('ignores presses that miss a slot cell and non-primary buttons', () => {
    const { fn: onSelectSlot, props: slotProps } = slotSpy()
    const { getByTestId } = renderSurface({ selectable: true, ...slotProps })
    fireEvent.pointerDown(getByTestId('nocell'), { button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerDown(getByTestId('slot1'), { button: 2, clientX: 0, clientY: 0 }) // right-click
    fireEvent.pointerUp(window)
    expect(onSelectSlot).not.toHaveBeenCalled()
  })

  it('does nothing when selection is disabled', () => {
    vi.useFakeTimers()
    const { fn: onSelectSlot, props: slotProps } = slotSpy()
    const { getByTestId } = renderSurface({ ...slotProps }) // selectable defaults to false
    fireEvent.pointerDown(getByTestId('slot1'), { button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerUp(window)
    act(() => {
      vi.advanceTimersByTime(DOUBLE_CLICK_MS)
    })
    expect(onSelectSlot).not.toHaveBeenCalled()
  })

  // --- touch: selection is gated behind a long-press so a finger can still scroll ---
  const LONG_PRESS_MS = 500 // default longPressThreshold

  it('starts a touch selection only after the long-press, then drag-commits a range', () => {
    vi.useFakeTimers()
    const { fn: onSelectSlot, props: slotProps } = slotSpy()
    const { getByTestId } = renderSurface({ selectable: true, ...slotProps })
    stubPoint(getByTestId('slot3'))

    fireEvent.pointerDown(getByTestId('slot1'), { button: 0, clientX: 0, clientY: 0, pointerType: 'touch', pointerId: 1 })
    // Before the hold elapses there is no selection yet (a quick finger lift = tap).
    act(() => {
      vi.advanceTimersByTime(LONG_PRESS_MS - 1)
    })
    fireEvent.pointerMove(window, { clientX: 0, clientY: 60 })
    expect(onSelectSlot).not.toHaveBeenCalled()

    // Hold elapses → selection engages; a move now extends it.
    fireEvent.pointerDown(getByTestId('slot1'), { button: 0, clientX: 0, clientY: 0, pointerType: 'touch', pointerId: 2 })
    act(() => {
      vi.advanceTimersByTime(LONG_PRESS_MS)
    })
    fireEvent.pointerMove(window, { clientX: 0, clientY: 60 })
    fireEvent.pointerUp(window)

    expect(onSelectSlot).toHaveBeenCalledTimes(1)
    const arg = onSelectSlot.mock.calls[0]![0] as { action: string; slots: string[] }
    expect(arg.action).toBe('select')
    expect(arg.slots).toHaveLength(3) // slots 1, 2, 3
  })

  it('abandons a touch gesture (no selection, no click) when the finger moves before the hold', () => {
    vi.useFakeTimers()
    const { fn: onSelectSlot, props: slotProps } = slotSpy()
    const { getByTestId } = renderSurface({ selectable: true, ...slotProps })
    fireEvent.pointerDown(getByTestId('slot1'), { button: 0, clientX: 0, clientY: 0, pointerType: 'touch', pointerId: 1 })
    // A scroll: the finger moves past the threshold before the long-press fires.
    fireEvent.pointerMove(window, { clientX: 0, clientY: 60 })
    act(() => {
      vi.advanceTimersByTime(LONG_PRESS_MS + DOUBLE_CLICK_MS)
    })
    fireEvent.pointerUp(window)
    act(() => {
      vi.advanceTimersByTime(DOUBLE_CLICK_MS)
    })
    expect(onSelectSlot).not.toHaveBeenCalled()
  })

  it('treats a quick touch tap (lift before the hold) as a click', () => {
    vi.useFakeTimers()
    const { fn: onSelectSlot, props: slotProps } = slotSpy()
    const { getByTestId } = renderSurface({ selectable: true, ...slotProps })
    fireEvent.pointerDown(getByTestId('slot2'), { button: 0, clientX: 0, clientY: 0, pointerType: 'touch', pointerId: 1 })
    fireEvent.pointerUp(window)
    act(() => {
      vi.advanceTimersByTime(DOUBLE_CLICK_MS)
    })
    expect(onSelectSlot).toHaveBeenCalledTimes(1)
    expect((onSelectSlot.mock.calls[0]![0] as { action: string }).action).toBe('click')
  })

  it('suppresses native scroll while an engaged touch drag is in progress', () => {
    vi.useFakeTimers()
    const { getByTestId } = renderSurface({ selectable: true, ...slotSpy().props })
    fireEvent.pointerDown(getByTestId('slot2'), { button: 0, clientX: 0, clientY: 0, pointerType: 'touch', pointerId: 1 })
    act(() => {
      vi.advanceTimersByTime(LONG_PRESS_MS) // engage → non-passive touchmove guard attaches
    })
    const ev = new Event('touchmove', { bubbles: true, cancelable: true })
    window.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(true)
    fireEvent.pointerUp(window)
  })

  it('aborts an engaged touch selection on pointercancel (no commit, no stale range)', () => {
    vi.useFakeTimers()
    const { fn: onSelectSlot, props: slotProps } = slotSpy()
    const { getByTestId } = renderSurface({ selectable: true, ...slotProps })
    fireEvent.pointerDown(getByTestId('slot2'), { button: 0, clientX: 0, clientY: 0, pointerType: 'touch', pointerId: 1 })
    act(() => {
      vi.advanceTimersByTime(LONG_PRESS_MS) // engage
    })
    fireEvent.pointerCancel(window)
    fireEvent.pointerUp(window) // listeners already detached → no-op
    act(() => {
      vi.advanceTimersByTime(DOUBLE_CLICK_MS)
    })
    expect(onSelectSlot).not.toHaveBeenCalled()
  })

  it('captures and releases the pointer when the platform supports it', () => {
    vi.useFakeTimers()
    const proto = HTMLDivElement.prototype as unknown as {
      setPointerCapture: (id: number) => void
      releasePointerCapture: (id: number) => void
    }
    const origSet = proto.setPointerCapture
    const origRel = proto.releasePointerCapture
    const setCap = vi.fn()
    const relCap = vi.fn()
    proto.setPointerCapture = setCap
    proto.releasePointerCapture = relCap
    try {
      const { fn: onSelectSlot, props: slotProps } = slotSpy()
      const { getByTestId } = renderSurface({ selectable: true, ...slotProps })
      stubPoint(getByTestId('slot3'))
      fireEvent.pointerDown(getByTestId('slot1'), { button: 0, clientX: 0, clientY: 0, pointerType: 'touch', pointerId: 7 })
      act(() => {
        vi.advanceTimersByTime(LONG_PRESS_MS) // engage → captures pointer 7
      })
      expect(setCap).toHaveBeenCalledWith(7)
      fireEvent.pointerMove(window, { clientX: 0, clientY: 60 })
      fireEvent.pointerUp(window) // complete → releases the captured pointer
      expect(relCap).toHaveBeenCalledWith(7)
      expect(onSelectSlot).toHaveBeenCalledTimes(1)
    } finally {
      proto.setPointerCapture = origSet
      proto.releasePointerCapture = origRel
    }
  })

  it('honours a custom longPressThreshold', () => {
    vi.useFakeTimers()
    const { fn: onSelectSlot, props: slotProps } = slotSpy()
    const { getByTestId } = renderSurface({ selectable: true, longPressThreshold: 100, ...slotProps })
    fireEvent.pointerDown(getByTestId('slot2'), { button: 0, clientX: 0, clientY: 0, pointerType: 'touch', pointerId: 1 })
    act(() => {
      vi.advanceTimersByTime(100)
    })
    fireEvent.pointerUp(window) // engaged → completes as a (single-slot) range, not a click
    expect(onSelectSlot).toHaveBeenCalledTimes(1)
    expect((onSelectSlot.mock.calls[0]![0] as { action: string }).action).toBe('select')
  })
})
