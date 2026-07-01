import type { SelectionMode } from '@big-calendar/core'
import { onUnmounted } from 'vue'
import { useCalendarContext } from '../CalendarProvider'

/** Movement past this many pixels turns a press into a drag (not a click). */
const DRAG_THRESHOLD_PX = 4
/** Single- vs double-click disambiguation window (ms). */
const DOUBLE_CLICK_MS = 250

interface SlotCoord {
  slot: number
  date: string
  resourceId?: string | undefined
}

function slotFromElement(el: EventTarget | null): SlotCoord | null {
  const cell = el instanceof Element ? el.closest<HTMLElement>('[data-slot-index]') : null
  if (cell == null) return null
  const { date, slotIndex } = cell.dataset
  if (date == null || slotIndex == null) return null
  const resourceId =
    cell.closest<HTMLElement>('[data-bc-resource]')?.getAttribute('data-bc-resource') ?? undefined
  return { slot: Number(slotIndex), date, resourceId }
}

function isOverEvent(el: EventTarget | null): boolean {
  return el instanceof Element && el.closest('[data-bc-event]') != null
}

/**
 * Pointer-driven slot selection for one surface (`'time'` body or `'day'`
 * month / all-day row). Returns an `onPointerdown` handler to spread on the
 * selection surface. Mirrors the React `useSlotSelection` hook.
 *
 * - press + drag → `start` → `to` → `complete`
 * - press without drag → debounced `click` / `doubleClick`
 * - touch: gated behind a long-press so a finger can still scroll
 */
export function useSlotSelection(
  mode: SelectionMode,
  slotCount?: number,
): (e: PointerEvent) => void {
  const { store } = useCalendarContext()

  let tap: { slot: number; date: string; at: number; timer: ReturnType<typeof setTimeout> } | null =
    null
  let activeTeardown: (() => void) | null = null

  onUnmounted(() => {
    if (tap !== null) clearTimeout(tap.timer)
    activeTeardown?.()
  })

  return (e: PointerEvent): void => {
    if (store.selectable === false) return
    if (e.button !== 0) return
    if (isOverEvent(e.target)) return
    const anchor = slotFromElement(e.target)
    if (anchor == null) return

    activeTeardown?.()

    const touch = e.pointerType === 'touch'
    const pointerId = e.pointerId
    const surface = e.currentTarget as Element
    const startX = e.clientX
    const startY = e.clientY
    let started = false
    let captured = false
    let longPress: ReturnType<typeof setTimeout> | null = null

    const begin = (): void => {
      started = true
      store.selection.start({
        slot: anchor.slot,
        date: anchor.date,
        mode,
        slotCount,
        resourceId: anchor.resourceId,
      })
    }

    const extendTo = (clientX: number, clientY: number): void => {
      const coord = slotFromElement(document.elementFromPoint(clientX, clientY))
      if (coord != null) store.selection.to({ slot: coord.slot })
    }

    const preventScroll = (ev: TouchEvent): void => {
      if (started) ev.preventDefault()
    }

    const teardown = (): void => {
      if (longPress != null) clearTimeout(longPress)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
      window.removeEventListener('touchmove', preventScroll)
      if (captured) {
        try {
          surface.releasePointerCapture(pointerId)
        } catch {
          // pointer already released
        }
      }
      activeTeardown = null
    }

    const onMove = (ev: PointerEvent): void => {
      const moved =
        Math.abs(ev.clientX - startX) > DRAG_THRESHOLD_PX ||
        Math.abs(ev.clientY - startY) > DRAG_THRESHOLD_PX
      if (!started) {
        if (touch) {
          if (moved) teardown()
          return
        }
        if (!moved) return
        begin()
      }
      extendTo(ev.clientX, ev.clientY)
    }

    const onUp = (): void => {
      const wasDrag = started
      teardown()
      if (wasDrag) {
        store.selection.complete()
        return
      }
      const { slot, date } = anchor
      const now = Date.now()
      const prev = tap
      if (
        prev != null &&
        prev.slot === slot &&
        prev.date === date &&
        now - prev.at < DOUBLE_CLICK_MS
      ) {
        clearTimeout(prev.timer)
        tap = null
        store.selection.doubleClick({ slot, date, mode, slotCount, resourceId: anchor.resourceId })
        return
      }
      if (prev != null) clearTimeout(prev.timer)
      const timer = setTimeout(() => {
        tap = null
        store.selection.click({ slot, date, mode, slotCount, resourceId: anchor.resourceId })
      }, DOUBLE_CLICK_MS)
      tap = { slot, date, at: now, timer }
    }

    const onCancel = (): void => {
      const wasDrag = started
      teardown()
      if (wasDrag) store.selection.cancel()
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)

    if (touch) {
      longPress = setTimeout(() => {
        longPress = null
        if (started) return
        begin()
        try {
          surface.setPointerCapture(pointerId)
          captured = true
        } catch {
          // capture not available
        }
        window.addEventListener('touchmove', preventScroll, { passive: false })
      }, store.longPressThreshold)
    }

    activeTeardown = teardown
  }
}
