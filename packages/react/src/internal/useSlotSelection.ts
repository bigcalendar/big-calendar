import type { SelectionMode } from '@big-calendar/core'
import { useCallback, useEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useCalendarContext } from '../CalendarProvider'

/** Movement past this many pixels turns a press into a drag (not a click). */
const DRAG_THRESHOLD_PX = 4
/** Single- vs double-click disambiguation window (ms) — matches EventButton (§8.2). */
const DOUBLE_CLICK_MS = 250

/** A resolved slot coordinate read from a `[data-slot-index]` hit cell. */
interface SlotCoord {
  slot: number
  date: string
}

/** Read the slot coordinate from the nearest hit cell, or `null` when none. */
function slotFromElement(el: EventTarget | null): SlotCoord | null {
  const cell = el instanceof Element ? el.closest<HTMLElement>('[data-slot-index]') : null
  if (cell == null) return null
  const { date, slotIndex } = cell.dataset
  if (date == null || slotIndex == null) return null
  return { slot: Number(slotIndex), date }
}

/** Whether the pointer is over an event (events own their own interaction). */
function isOverEvent(el: EventTarget | null): boolean {
  return el instanceof Element && el.closest('[data-bc-event]') != null
}

/**
 * Pointer-driven slot selection for one surface (time body = `'time'`, month /
 * all-day = `'day'`). Returns an `onPointerDown` to spread on the selection
 * surface; the surface's `[data-slot-index]`/`[data-date]` hit cells supply the
 * coordinates and the store's selection controller does the rest:
 *
 * - a **press + drag** past {@link DRAG_THRESHOLD_PX} runs `start`→`to`→
 *   `complete` (a range selection);
 * - a **press without a drag** is a tap: `click`, upgraded to `doubleClick` when
 *   a second tap on the same slot lands within {@link DOUBLE_CLICK_MS} (so the
 *   two never both fire);
 * - presses **over an event** are ignored (the event handles them); both
 *   `selectable: true` and `'ignoreEvents'` defer to events (§8.2).
 *
 * Non-primary buttons and disabled selection are ignored. Move/up are tracked on
 * `window` so a drag that leaves the surface still completes.
 *
 * `slotCount` (time mode only) is the number of slot rows per day column; it lets
 * the store decode the **global** slot index (`dayIndex*slotCount + slot`) carried
 * by the time-grid hit cells, so a drag can span day columns (a cross-day drag
 * promotes to a whole-day / all-day selection). Omit it for `'day'` mode.
 */
export function useSlotSelection(
  mode: SelectionMode,
  slotCount?: number,
): (e: ReactPointerEvent) => void {
  const { store } = useCalendarContext()

  const drag = useRef<{ anchor: SlotCoord; startX: number; startY: number; started: boolean } | null>(null)
  const tap = useRef<{ slot: number; date: string; at: number; timer: ReturnType<typeof setTimeout> } | null>(null)

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const state = drag.current
      if (state == null) return
      if (!state.started) {
        const moved =
          Math.abs(e.clientX - state.startX) > DRAG_THRESHOLD_PX ||
          Math.abs(e.clientY - state.startY) > DRAG_THRESHOLD_PX
        if (!moved) return
        state.started = true
        store.selection.start({ slot: state.anchor.slot, date: state.anchor.date, mode, slotCount })
      }
      const coord = slotFromElement(document.elementFromPoint(e.clientX, e.clientY))
      if (coord != null) store.selection.to({ slot: coord.slot })
    },
    [store, mode, slotCount],
  )

  const onPointerUp = useCallback(() => {
    const state = drag.current
    if (state == null) return
    drag.current = null
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)

    if (state.started) {
      store.selection.complete()
      return
    }

    // No drag → a tap. Debounce single vs double on the same slot.
    const { slot, date } = state.anchor
    const now = Date.now()
    const prev = tap.current
    if (prev != null && prev.slot === slot && prev.date === date && now - prev.at < DOUBLE_CLICK_MS) {
      clearTimeout(prev.timer)
      tap.current = null
      store.selection.doubleClick({ slot, date, mode, slotCount })
      return
    }
    if (prev != null) clearTimeout(prev.timer)
    const timer = setTimeout(() => {
      tap.current = null
      store.selection.click({ slot, date, mode, slotCount })
    }, DOUBLE_CLICK_MS)
    tap.current = { slot, date, at: now, timer }
  }, [store, mode, slotCount, onPointerMove])

  // Drop a pending tap timer and any live drag listeners if we unmount mid-gesture.
  useEffect(
    () => () => {
      if (tap.current !== null) clearTimeout(tap.current.timer)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    },
    [onPointerMove, onPointerUp],
  )

  return useCallback(
    (e: ReactPointerEvent) => {
      if (store.selectable === false) return
      if (e.button !== 0) return // primary button only
      if (isOverEvent(e.target)) return // events own their pointer interaction
      const anchor = slotFromElement(e.target)
      if (anchor == null) return
      drag.current = { anchor, startX: e.clientX, startY: e.clientY, started: false }
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
    },
    [store, onPointerMove, onPointerUp],
  )
}
