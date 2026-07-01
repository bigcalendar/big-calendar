import { Views } from '@big-calendar/core'
import type { MoveMode, ViewKey } from '@big-calendar/core'
import { bindCalendarDnd } from '@big-calendar/dnd'
import { useCalendarContext } from '../CalendarProvider'
import { fromSignal } from '../internal/fromSignal.svelte'

function moveModeForView(view: ViewKey): MoveMode | null {
  if (view === Views.MONTH) return 'day'
  if (view === Views.WEEK || view === Views.WORK_WEEK || view === Views.DAY) return 'time'
  return null
}

/**
 * Enable event drag-to-move for the calendar rendered inside `getContainer()`.
 * Uses the optional `@big-calendar/dnd` package. Binds whenever the active
 * view supports DnD, rebinds on view change, and tears down on unmount.
 *
 * Must be called inside a `<CalendarProvider>`.
 */
export function useCalendarDnd<TEvent = unknown, TResource = unknown>(
  getContainer: () => HTMLElement | null,
): void {
  const { store } = useCalendarContext<TEvent, TResource>()
  const viewSignal = fromSignal(store.view)

  $effect(() => {
    const root = getContainer()
    if (root == null) return
    const mode = moveModeForView(viewSignal.current)
    if (mode == null) return
    store.dndEnabled.value = true
    const cleanup = bindCalendarDnd<TEvent>({ root, store, mode })
    return () => {
      cleanup()
      store.dndEnabled.value = false
    }
  })
}
