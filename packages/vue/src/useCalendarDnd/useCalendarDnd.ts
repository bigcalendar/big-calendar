import { Views } from '@big-calendar/core'
import type { MoveMode, ViewKey } from '@big-calendar/core'
import { bindCalendarDnd } from '@big-calendar/dnd'
import { watchEffect } from 'vue'
import type { ShallowRef } from 'vue'
import { useCalendarContext } from '../CalendarProvider'
import { useSignalRef } from '../internal/useSignalRef'

function moveModeForView(view: ViewKey): MoveMode | null {
  if (view === Views.MONTH) return 'day'
  if (view === Views.WEEK || view === Views.WORK_WEEK || view === Views.DAY) return 'time'
  return null
}

/**
 * Enable event drag-to-move for the calendar rendered inside `containerRef`,
 * using the optional `@big-calendar/dnd` package. Binds whenever the active
 * view supports DnD, rebinds on view change, and tears the binding down on unmount.
 *
 * `containerRef` can point at any element wrapping the calendar — the controller
 * scans its subtree for `data-bc-event` drag sources and the drop cells the views
 * already render (`data-date` in month, `data-bc-instant` in the time grid).
 *
 * Must be called inside a `<CalendarProvider>`. A move fires the store's
 * `onEventDrop`; the calendar does not mutate `events` — apply the new bounds
 * to your own data.
 *
 * `@big-calendar/dnd` is an **optional** peer dependency. The composable is a
 * no-op when the `dnd` package is absent (tree-shaken in the default bundle).
 */
export function useCalendarDnd<TEvent = unknown, TResource = unknown>(
  containerRef: ShallowRef<HTMLElement | null>,
): void {
  const { store } = useCalendarContext<TEvent, TResource>()
  const viewRef = useSignalRef(store.view)

  watchEffect((onCleanup) => {
    const root = containerRef.value
    if (root == null) return
    const mode = moveModeForView(viewRef.value)
    if (mode == null) return
    store.dndEnabled.value = true
    const cleanup = bindCalendarDnd<TEvent>({ root, store, mode })
    onCleanup(() => {
      cleanup()
      store.dndEnabled.value = false
    })
  })
}
