import type { SelectionMode } from '@big-calendar/core'
import { useCallback, useRef, useState } from 'react'
import type { FocusEvent as ReactFocusEvent, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useCalendarContext } from './CalendarProvider'

/** A keyboard arrow direction over a selection surface. */
export type Direction = 'up' | 'down' | 'left' | 'right'

const ARROW_DIRECTION: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

/** What {@link useRovingSelection} returns for the surface + its cells. */
export interface RovingSelection {
  /** Attach to the selection surface (the cells' common ancestor). */
  containerRef: (node: HTMLElement | null) => void
  /** Key handler for the surface — drives focus movement + selection. */
  onKeyDown: (e: ReactKeyboardEvent) => void
  /** Focus sync for the surface — keeps the active cell in step with real focus. */
  onFocusCapture: (e: ReactFocusEvent) => void
  /** The roving `tabIndex` for the cell at `index` (one tab stop per group). */
  cellTabIndex: (index: number) => 0 | -1
}

/**
 * Keyboard roving-tabindex + selection for one slot surface (§8.1). The cells are
 * a single tab stop: exactly one carries `tabIndex={0}` (the active cell), the
 * rest `-1`, and arrow keys move focus among them via the view-supplied
 * {@link RovingSelection} `neighbor` map (so each view owns its own geometry —
 * time columns are vertical, month/all-day rows are horizontal). On top of plain
 * navigation it drives the store's selection controller:
 *
 * - **Arrow** moves the active cell (focus only).
 * - **Shift+Arrow** extends the selection: the first one `start()`s at the active
 *   cell, each one `to()`s the new cell.
 * - **Enter / Space** commits — `complete()` while selecting, else `click()` the
 *   active cell.
 * - **Esc** cancels an in-progress selection.
 *
 * Cells expose their coordinate via `data-slot-index` (the same global/linear
 * index the pointer path uses) and `data-date`; the hook reads them from the DOM
 * so it stays view-agnostic. `slotCount` (time mode) is forwarded to the store so
 * a global time index decodes to day + in-day slot. Whether selection is active
 * is read from the store each keystroke, so a reset elsewhere can't desync it.
 */
export function useRovingSelection(opts: {
  mode: SelectionMode
  /** Total number of cells in the group. */
  count: number
  /** Slot rows per day column (time mode only); omit for day mode. */
  slotCount?: number | undefined
  /** Neighbor index in a direction, or `null` at an edge. */
  neighbor: (index: number, direction: Direction) => number | null
}): RovingSelection {
  const { mode, count, slotCount, neighbor } = opts
  const { store } = useCalendarContext()
  const [active, setActive] = useState(0)
  const container = useRef<HTMLElement | null>(null)

  // The active index can outlive a shrinking grid (e.g. week → day in the time
  // view, which keeps the surface mounted); clamp before use.
  const safeActive = count > 0 ? Math.min(active, count - 1) : 0

  const containerRef = useCallback((node: HTMLElement | null) => {
    container.current = node
  }, [])

  /** The cell element for an index, if rendered. */
  const cellAt = (index: number): HTMLElement | null =>
    container.current?.querySelector<HTMLElement>(`[data-slot-index="${index}"]`) ?? null

  const move = useCallback((index: number) => {
    setActive(index)
    cellAt(index)?.focus()
  }, [])

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent) => {
      if (store.selectable === false) return
      // The focused cell is the source of truth (not React state, which can lag a
      // just-moved focus). Event buttons share this surface and own their own keys
      // (Enter/Space/F2); their keydown bubbles here, so ignore anything that
      // didn't originate on a `[data-slot-index]` cell.
      const cell = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-slot-index]') : null
      if (cell == null) return
      const current = Number(cell.dataset.slotIndex)
      if (!Number.isFinite(current)) return
      const date = cell.dataset.date ?? ''

      const direction = ARROW_DIRECTION[e.key]
      if (direction !== undefined) {
        const target = neighbor(current, direction)
        e.preventDefault() // own arrows even at an edge (no surface scroll)
        if (target === null) return
        if (e.shiftKey) {
          if (store.selection.state.value.status !== 'selecting') {
            store.selection.start({ slot: current, date, mode, slotCount })
          }
          store.selection.to({ slot: target })
        }
        move(target)
        return
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (store.selection.state.value.status === 'selecting') {
          store.selection.complete()
        } else {
          store.selection.click({ slot: current, date, mode, slotCount })
        }
        return
      }
      if (e.key === 'Escape' && store.selection.state.value.status === 'selecting') {
        e.preventDefault()
        store.selection.cancel()
      }
    },
    [store, neighbor, move, mode, slotCount],
  )

  const onFocusCapture = useCallback((e: ReactFocusEvent) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-slot-index]')
    if (cell == null || !container.current?.contains(cell)) return
    const index = Number(cell.dataset.slotIndex)
    if (Number.isFinite(index)) setActive(index)
  }, [])

  const cellTabIndex = useCallback(
    (index: number): 0 | -1 => (index === safeActive ? 0 : -1),
    [safeActive],
  )

  return { containerRef, onKeyDown, onFocusCapture, cellTabIndex }
}
