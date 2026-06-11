import { Views } from '@big-calendar/core'
import { fireEvent, render } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { CalendarProvider } from '../CalendarProvider'
import type { CalendarProviderProps } from '../CalendarProvider'
import { LOCALIZER_CASES } from '../testing/localizers'
import type { Direction } from '.'
import { useRovingSelection } from '.'

const DAY = '2026-06-15T00:00:00.000Z'
const { create } = LOCALIZER_CASES[0]!

interface Event {
  id: number
  title: string
  start: string
  end: string
}

/**
 * A minimal day-mode selection surface: a 4-column grid of `count` cells plus a
 * stray event button (no slot index). The grid is linear (left/right ±1, up/down
 * ±4), like the month day grid.
 */
function Surface({ count = 8 }: { count?: number }) {
  const COLS = 4
  const neighbor = (i: number, dir: Direction): number | null => {
    switch (dir) {
      case 'left':
        return i % COLS > 0 ? i - 1 : null
      case 'right':
        return i % COLS < COLS - 1 && i + 1 < count ? i + 1 : null
      case 'up':
        return i - COLS >= 0 ? i - COLS : null
      case 'down':
        return i + COLS < count ? i + COLS : null
    }
  }
  const roving = useRovingSelection({ mode: 'day', count, neighbor })
  return (
    <div
      data-testid="surface"
      ref={roving.containerRef}
      onKeyDown={roving.onKeyDown}
      onFocusCapture={roving.onFocusCapture}
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          data-testid={`cell${i}`}
          data-date={DAY}
          data-slot-index={i}
          tabIndex={roving.cellTabIndex(i)}
        />
      ))}
      <button data-testid="eventbtn" data-bc-event="1" />
    </div>
  )
}

describe('useRovingSelection', () => {
  let localizer: Awaited<ReturnType<typeof create>>
  beforeAll(async () => {
    localizer = await create()
  })

  function renderSurface(extra?: Partial<CalendarProviderProps<Event>>, count?: number) {
    return render(
      <CalendarProvider<Event>
        localizer={localizer}
        defaultDate={DAY}
        defaultView={Views.MONTH}
        {...extra}
      >
        <Surface {...(count === undefined ? {} : { count })} />
      </CalendarProvider>,
    )
  }

  /**
   * Committed slot callbacks are split per gesture (`onSlotClick` /
   * `onSlotDoubleClick` / `onSlotSelect`); the payload no longer carries
   * `action`. Fan the three into one spy and re-inject `action` so the gesture
   * assertions stay expressive.
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

  it('keeps one tab stop and moves focus + the tab stop with the arrows', () => {
    const { getByTestId } = renderSurface({ selectable: true })
    expect(getByTestId('cell0').tabIndex).toBe(0)
    expect(getByTestId('cell1').tabIndex).toBe(-1)

    getByTestId('cell0').focus()
    fireEvent.keyDown(getByTestId('cell0'), { key: 'ArrowRight' })
    expect(document.activeElement).toBe(getByTestId('cell1'))
    expect(getByTestId('cell1').tabIndex).toBe(0)
    expect(getByTestId('cell0').tabIndex).toBe(-1)

    // Down steps a whole row; left/up step back; covers every neighbor branch.
    fireEvent.keyDown(getByTestId('cell1'), { key: 'ArrowDown' })
    expect(document.activeElement).toBe(getByTestId('cell5'))
    fireEvent.keyDown(getByTestId('cell5'), { key: 'ArrowUp' })
    expect(document.activeElement).toBe(getByTestId('cell1'))
    fireEvent.keyDown(getByTestId('cell1'), { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(getByTestId('cell0'))
  })

  it('consumes an arrow at an edge without moving focus', () => {
    const { getByTestId } = renderSurface({ selectable: true })
    getByTestId('cell0').focus()
    fireEvent.keyDown(getByTestId('cell0'), { key: 'ArrowLeft' }) // no left neighbor
    expect(document.activeElement).toBe(getByTestId('cell0'))
    fireEvent.keyDown(getByTestId('cell0'), { key: 'ArrowUp' }) // no up neighbor
    expect(document.activeElement).toBe(getByTestId('cell0'))
  })

  it('extends a selection with Shift+Arrow and commits it with Enter', () => {
    const { fn: onSelectSlot, props: slotProps } = slotSpy()
    const { getByTestId } = renderSurface({ selectable: true, ...slotProps })
    getByTestId('cell0').focus()
    fireEvent.keyDown(getByTestId('cell0'), { key: 'ArrowRight', shiftKey: true })
    fireEvent.keyDown(getByTestId('cell1'), { key: 'ArrowRight', shiftKey: true })
    expect(onSelectSlot).not.toHaveBeenCalled() // still selecting
    fireEvent.keyDown(getByTestId('cell2'), { key: 'Enter' })

    expect(onSelectSlot).toHaveBeenCalledTimes(1)
    const arg = onSelectSlot.mock.calls[0]![0] as { action: string; slots: string[]; allDay: boolean }
    expect(arg.action).toBe('select')
    expect(arg.slots).toHaveLength(3) // days 0..2
    expect(arg.allDay).toBe(true)
  })

  it('clicks the focused cell with Space when not selecting', () => {
    const { fn: onSelectSlot, props: slotProps } = slotSpy()
    const { getByTestId } = renderSurface({ selectable: true, ...slotProps })
    getByTestId('cell2').focus() // onFocusCapture syncs the active cell
    fireEvent.keyDown(getByTestId('cell2'), { key: ' ' })
    expect(onSelectSlot).toHaveBeenCalledTimes(1)
    expect((onSelectSlot.mock.calls[0]![0] as { action: string }).action).toBe('click')
  })

  it('cancels an in-progress selection with Esc (no commit)', () => {
    const { fn: onSelectSlot, props: slotProps } = slotSpy()
    const { getByTestId } = renderSurface({ selectable: true, ...slotProps })
    getByTestId('cell0').focus()
    fireEvent.keyDown(getByTestId('cell0'), { key: 'ArrowRight', shiftKey: true })
    fireEvent.keyDown(getByTestId('cell1'), { key: 'Escape' })
    // Selection is gone → Enter now clicks instead of completing.
    fireEvent.keyDown(getByTestId('cell1'), { key: 'Enter' })
    expect(onSelectSlot).toHaveBeenCalledTimes(1)
    expect((onSelectSlot.mock.calls[0]![0] as { action: string }).action).toBe('click')
  })

  it('ignores keys from an event button on the surface', () => {
    const { fn: onSelectSlot, props: slotProps } = slotSpy()
    const { getByTestId } = renderSurface({ selectable: true, ...slotProps })
    getByTestId('eventbtn').focus()
    fireEvent.keyDown(getByTestId('eventbtn'), { key: 'Enter' })
    fireEvent.keyDown(getByTestId('eventbtn'), { key: 'ArrowRight' })
    expect(onSelectSlot).not.toHaveBeenCalled()
  })

  it('does nothing when selection is disabled', () => {
    const { fn: onSelectSlot, props: slotProps } = slotSpy()
    const { getByTestId } = renderSurface({ ...slotProps }) // selectable defaults to false
    getByTestId('cell0').focus()
    fireEvent.keyDown(getByTestId('cell0'), { key: 'Enter' })
    fireEvent.keyDown(getByTestId('cell0'), { key: 'ArrowRight' })
    expect(onSelectSlot).not.toHaveBeenCalled()
  })

  it('ignores keys it does not handle', () => {
    const { fn: onSelectSlot, props: slotProps } = slotSpy()
    const { getByTestId } = renderSurface({ selectable: true, ...slotProps })
    getByTestId('cell0').focus()
    fireEvent.keyDown(getByTestId('cell0'), { key: 'Tab' })
    fireEvent.keyDown(getByTestId('cell0'), { key: 'a' })
    fireEvent.keyDown(getByTestId('cell0'), { key: 'Escape' }) // not selecting → no-op
    expect(onSelectSlot).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(getByTestId('cell0'))
  })

  it('renders an empty grid without crashing', () => {
    const { queryByTestId } = renderSurface({ selectable: true }, 0)
    expect(queryByTestId('cell0')).toBeNull()
  })
})
