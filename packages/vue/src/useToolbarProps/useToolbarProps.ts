import type { NavigateDirection, ViewKey } from '@big-calendar/core'
import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import { useCalendarContext } from '../CalendarProvider'
import type { ToolbarProps } from '../components.type'
import { useSignalRef } from '../internal/useSignalRef'

/**
 * Build {@link ToolbarProps} from context: the live label, view, and enabled-
 * views list (subscribed via signals), the resolved messages, and stable
 * navigate/view handlers bound to the store. Behavior lives here so the
 * toolbar components stay render-first.
 */
export function useToolbarProps(): ComputedRef<ToolbarProps> {
  const { store, messages } = useCalendarContext()
  const labelRef = useSignalRef(store.label)
  const viewRef = useSignalRef(store.view)
  const viewsRef = useSignalRef(store.enabledViews)

  const onNavigate = (direction: NavigateDirection): void => store.navigate({ direction })
  const onView = (next: ViewKey): void => store.setView({ view: next })

  return computed<ToolbarProps>(() => ({
    label: labelRef.value,
    view: viewRef.value,
    views: viewsRef.value,
    messages,
    onNavigate,
    onView,
  }))
}
