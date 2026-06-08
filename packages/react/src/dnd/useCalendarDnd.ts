import { Views } from '@big-calendar/core'
import type { MoveMode, ViewKey } from '@big-calendar/core'
import { bindCalendarDnd } from '@big-calendar/dnd'
import { useEffect } from 'react'
import type { RefObject } from 'react'
import { useCalendarContext } from '../CalendarProvider/useCalendarContext'
import { useSignalValue } from '../internal/useSignalValue'

/**
 * Map the active view to a {@link MoveMode}, or `null` when event-move is not
 * wired for it (agenda). Month drags are whole-day shifts (`'day'`); the
 * time-grid views snap the event's start to the dropped slot (`'time'`).
 */
function moveModeForView(view: ViewKey): MoveMode | null {
  if (view === Views.MONTH) return 'day'
  if (view === Views.WEEK || view === Views.WORK_WEEK || view === Views.DAY) return 'time'
  return null
}

/**
 * Enable event drag-to-move for the calendar rendered inside `containerRef`,
 * using the optional `@big-calendar/dnd` controller. Binds whenever the active
 * view supports it, rebinds on view change, and tears the binding down on unmount.
 *
 * `containerRef` can point at any element wrapping the calendar — the controller
 * scans its subtree for the `data-bc-event` drag sources and the drop cells the
 * views already render (`data-date` in month, `data-bc-instant` in the time grid).
 * Must be called inside a `<CalendarProvider>`. A move fires the store's
 * `onEventDrop`; the calendar does not mutate `events`, so apply the new bounds
 * to your own data.
 */
export function useCalendarDnd<TEvent = unknown, TResource = unknown>(
  containerRef: RefObject<HTMLElement | null>,
): void {
  const { store } = useCalendarContext<TEvent, TResource>()
  const view = useSignalValue(store.view)
  useEffect(() => {
    const root = containerRef.current
    if (root == null) return
    const mode = moveModeForView(view)
    if (mode == null) return
    return bindCalendarDnd<TEvent>({ root, store, mode })
  }, [containerRef, store, view])
}
