import { Views } from '@big-calendar/core'
import type { MoveMode, ViewKey } from '@big-calendar/core'
import { bindCalendarDnd } from '@big-calendar/dnd'
import { useEffect } from 'react'
import type { RefObject } from 'react'
import { useCalendarContext } from '../CalendarProvider/useCalendarContext'
import { useSignalValue } from '../internal/useSignalValue'

/**
 * Map the active view to a {@link MoveMode}, or `null` when event-move is not yet
 * wired for it. Month drags are whole-day shifts; the time-grid views need the
 * slot instant (not just the day) and are enabled in a later slice.
 */
function moveModeForView(view: ViewKey): MoveMode | null {
  return view === Views.MONTH ? 'day' : null
}

/**
 * Enable event drag-to-move for the calendar rendered inside `containerRef`,
 * using the optional `@big-calendar/dnd` controller. Binds whenever the active
 * view supports it, rebinds on view change, and tears the binding down on unmount.
 *
 * `containerRef` can point at any element wrapping the calendar — the controller
 * scans its subtree for the `data-bc-event` / `data-date` nodes the views already
 * render. Must be called inside a `<CalendarProvider>`. A move fires the store's
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
