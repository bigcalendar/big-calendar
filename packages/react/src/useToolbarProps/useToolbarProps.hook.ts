import type { NavigateDirection, ViewKey } from '@big-calendar/core'
import { useCallback, useMemo } from 'react'
import { useCalendarContext } from '../CalendarProvider'
import type { ToolbarProps } from '../components.type'
import { useSignalValue } from '../internal/useSignalValue'

/**
 * Build {@link ToolbarProps} from context: the live label + view (subscribed via
 * signals), the resolved messages, and stable navigate/view handlers bound to
 * the store. Behavior lives here so the toolbar components stay render-first.
 */
export function useToolbarProps(): ToolbarProps {
  const { store, messages } = useCalendarContext()
  const label = useSignalValue(store.label)
  const view = useSignalValue(store.view)
  const views = useSignalValue(store.enabledViews)

  const onNavigate = useCallback(
    (direction: NavigateDirection) => store.navigate({ direction }),
    [store],
  )
  const onView = useCallback((next: ViewKey) => store.setView({ view: next }), [store])

  return useMemo(
    () => ({ label, view, views, messages, onNavigate, onView }),
    [label, view, views, messages, onNavigate, onView],
  )
}
