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
  /** Owning resource column id (resource grids), else `undefined`. */
  resourceId?: string | undefined
}

/** Read the slot coordinate from the nearest hit cell, or `null` when none. */
function slotFromElement(el: EventTarget | null): SlotCoord | null {
  const cell = el instanceof Element ? el.closest<HTMLElement>('[data-slot-index]') : null
  if (cell == null) return null
  const { date, slotIndex } = cell.dataset
  if (date == null || slotIndex == null) return null
  const resourceId = cell.closest<HTMLElement>('[data-bc-resource]')?.getAttribute('data-bc-resource') ?? undefined
  return { slot: Number(slotIndex), date, resourceId }
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
 * **Mouse / pen** start a drag immediately (movement past the threshold). **Touch**
 * is gated behind a long-press so a finger can still scroll the calendar body:
 * the selection only begins once the finger is held still for
 * `store.longPressThreshold` ms; movement before then is read as a scroll and the
 * gesture is abandoned. Once a touch selection engages, the pointer is captured and
 * a non-passive `touchmove` `preventDefault` suppresses native scroll for the rest
 * of the drag (`touch-action: pan-y` on the scroll body keeps normal scrolling
 * before the hold).
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

  // Pending single-vs-double-click timer; persists across gestures so a second
  // tap can upgrade the first. The live gesture's teardown is stored separately
  // so an unmount mid-drag can detach its window listeners.
  const tap = useRef<{ slot: number; date: string; at: number; timer: ReturnType<typeof setTimeout> } | null>(null)
  const activeTeardown = useRef<(() => void) | null>(null)

  useEffect(
    () => () => {
      if (tap.current !== null) clearTimeout(tap.current.timer)
      activeTeardown.current?.()
    },
    [],
  )

  return useCallback(
    (e: ReactPointerEvent) => {
      if (store.selectable === false) return
      if (e.button !== 0) return // primary button only
      if (isOverEvent(e.target)) return // events own their pointer interaction
      const anchor = slotFromElement(e.target)
      if (anchor == null) return

      // Tear down any previous in-flight gesture before starting a new one.
      activeTeardown.current?.()

      const touch = e.pointerType === 'touch'
      const pointerId = e.pointerId
      const surface = e.currentTarget
      const startX = e.clientX
      const startY = e.clientY
      let started = false
      let captured = false
      let longPress: ReturnType<typeof setTimeout> | null = null

      const begin = () => {
        started = true
        store.selection.start({ slot: anchor.slot, date: anchor.date, mode, slotCount, resourceId: anchor.resourceId })
      }
      const extendTo = (clientX: number, clientY: number) => {
        const coord = slotFromElement(document.elementFromPoint(clientX, clientY))
        if (coord != null) store.selection.to({ slot: coord.slot })
      }
      // Non-passive so it can cancel native scroll while an engaged touch drags.
      const preventScroll = (ev: TouchEvent) => {
        if (started) ev.preventDefault()
      }

      const teardown = () => {
        if (longPress != null) clearTimeout(longPress)
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onCancel)
        window.removeEventListener('touchmove', preventScroll)
        if (captured) {
          try {
            surface.releasePointerCapture(pointerId)
          } catch {
            // pointer already released (e.g. capture never took) — nothing to do.
          }
        }
        activeTeardown.current = null
      }

      const onMove = (ev: PointerEvent) => {
        const moved =
          Math.abs(ev.clientX - startX) > DRAG_THRESHOLD_PX ||
          Math.abs(ev.clientY - startY) > DRAG_THRESHOLD_PX
        if (!started) {
          if (touch) {
            // Movement before the long-press fires = the user is scrolling, not
            // selecting. Abandon silently and let the browser scroll.
            if (moved) teardown()
            return
          }
          // Mouse / pen: a drag past the threshold promotes the press to a range.
          if (!moved) return
          begin()
        }
        extendTo(ev.clientX, ev.clientY)
      }

      const onUp = () => {
        const wasDrag = started
        teardown()
        if (wasDrag) {
          store.selection.complete()
          return
        }
        // No drag → a tap. Debounce single vs double on the same slot.
        const { slot, date } = anchor
        const now = Date.now()
        const prev = tap.current
        if (prev != null && prev.slot === slot && prev.date === date && now - prev.at < DOUBLE_CLICK_MS) {
          clearTimeout(prev.timer)
          tap.current = null
          store.selection.doubleClick({ slot, date, mode, slotCount, resourceId: anchor.resourceId })
          return
        }
        if (prev != null) clearTimeout(prev.timer)
        const timer = setTimeout(() => {
          tap.current = null
          store.selection.click({ slot, date, mode, slotCount, resourceId: anchor.resourceId })
        }, DOUBLE_CLICK_MS)
        tap.current = { slot, date, at: now, timer }
      }

      // The browser revoked the pointer (e.g. it took over to scroll). Detach and
      // abort any in-progress range so no stale highlight or commit is left behind.
      const onCancel = () => {
        const wasDrag = started
        teardown()
        if (wasDrag) store.selection.cancel()
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onCancel)

      if (touch) {
        // Defer the selection until the finger has been held still long enough.
        longPress = setTimeout(() => {
          longPress = null
          if (started) return
          begin()
          try {
            surface.setPointerCapture(pointerId)
            captured = true
          } catch {
            // Capture unsupported/unavailable — extend still works via window moves.
          }
          window.addEventListener('touchmove', preventScroll, { passive: false })
        }, store.longPressThreshold)
      }

      activeTeardown.current = teardown
    },
    [store, mode, slotCount],
  )
}
