import type { NavigateDirection, ViewKey } from '@big-calendar/core'
import { useCalendarContext } from '../CalendarProvider'
import type { ToolbarProps } from '../components.type'
import { fromSignal } from '../internal/fromSignal.svelte'

export function useToolbarProps(): { readonly current: ToolbarProps } {
  const { store, messages } = useCalendarContext()
  const labelSignal = fromSignal(store.label)
  const viewSignal = fromSignal(store.view)
  const viewsSignal = fromSignal(store.enabledViews)

  const onNavigate = (direction: NavigateDirection): void => store.navigate({ direction })
  const onView = (next: ViewKey): void => store.setView({ view: next })

  const props = $derived.by((): ToolbarProps => ({
    label: labelSignal.current,
    view: viewSignal.current,
    views: viewsSignal.current,
    messages,
    onNavigate,
    onView,
  }))

  return { get current() { return props } }
}
