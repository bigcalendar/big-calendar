import type { CalendarStore } from '@big-calendar/core'
import { createCalendarStore } from '@big-calendar/core'
import { onUnmounted, watchEffect } from 'vue'
import type { CalendarProps } from './calendarProps.type'

/**
 * Create (once) and reactively bind a calendar store from props. Returns the
 * raw store; read its signals through {@link useSignalRef} and call its actions.
 *
 * Designed to be called inside a component's `setup()` — lifecycle hooks
 * (`watchEffect`, `onUnmounted`) are wired automatically. Pass the reactive
 * `props` object from `defineProps` so that controlled-prop syncing and
 * callback forwarding always use the latest values.
 *
 * Callback handling mirrors the React adapter: callbacks that are absent at
 * mount time are not wired (preserving `store.eventHandlers.has*` flags);
 * callbacks that are present always forward to the latest prop value via
 * closure over the reactive proxy.
 */
export function useCalendarStore<TEvent = unknown, TResource = unknown>(
  props: CalendarProps<TEvent, TResource>,
): CalendarStore<TEvent, TResource> {
  const {
    defaultView,
    defaultDate,
    views,
    view: initialView,
    date: initialDate,
    ...baseConfig
  } = props

  const store = createCalendarStore<TEvent, TResource>({
    ...baseConfig,
    view: initialView ?? defaultView,
    date: initialDate ?? defaultDate,
    enabledViews: views,
    // Wrap every callback so the closure reads the latest prop via the reactive
    // proxy — same as React adapter's propsRef pattern (§10-2).
    onNavigate: props.onNavigate
      ? (args) => props.onNavigate?.(args)
      : undefined,
    onView: props.onView
      ? (args) => props.onView?.(args)
      : undefined,
    onEventSelect: props.onEventSelect
      ? (args) => props.onEventSelect?.(args)
      : undefined,
    onDrillDown: props.onDrillDown
      ? (args) => props.onDrillDown?.(args)
      : undefined,
    onEventClick: props.onEventClick
      ? (event) => props.onEventClick?.(event)
      : undefined,
    onEventDoubleClick: props.onEventDoubleClick
      ? (event) => props.onEventDoubleClick?.(event)
      : undefined,
    onEventRightClick: props.onEventRightClick
      ? (event, domEvent) => props.onEventRightClick?.(event, domEvent)
      : undefined,
    onEventMiddleClick: props.onEventMiddleClick
      ? (event, domEvent) => props.onEventMiddleClick?.(event, domEvent)
      : undefined,
    // Always create these wrappers (no conditional guard) so config.onEventDrop /
    // config.onEventResize are never null. The core checks `if (drop == null) return`
    // which would silently skip the commit if the callback wasn't present at store
    // creation time. Reading via the reactive attrs proxy at *call time* ensures we
    // always reach the latest callback even if attrs was not fully settled during setup.
    onEventDrop: (args) => props.onEventDrop?.(args),
    onEventResize: (args) => props.onEventResize?.(args),
    onDropFromOutside: props.onDropFromOutside
      ? (args) => props.onDropFromOutside?.(args)
      : undefined,
    onEventDragStart: props.onEventDragStart
      ? (args) => props.onEventDragStart?.(args)
      : undefined,
    onSlotSelecting: props.onSlotSelecting
      ? (args) => props.onSlotSelecting?.(args)
      : undefined,
    onSlotClick: props.onSlotClick
      ? (args) => props.onSlotClick?.(args)
      : undefined,
    onSlotDoubleClick: props.onSlotDoubleClick
      ? (args) => props.onSlotDoubleClick?.(args)
      : undefined,
    onSlotSelect: props.onSlotSelect
      ? (args) => props.onSlotSelect?.(args)
      : undefined,
    onRangeChange: props.onRangeChange
      ? (args) => props.onRangeChange?.(args)
      : undefined,
  })

  // Controlled view/date: write the signal directly so we don't re-fire callbacks.
  watchEffect(() => {
    if (props.view !== undefined) store.view.value = props.view
  })
  watchEffect(() => {
    if (props.date !== undefined) store.date.value = props.date
  })

  // Localizer swap: recomputes range/label/viewModel without remounting.
  watchEffect(() => {
    store.setLocalizer({ localizer: props.localizer })
  })

  // Layout algorithm: live changes recompute the time-grid view model.
  watchEffect(() => {
    store.dayLayoutAlgorithm.value = props.dayLayoutAlgorithm
  })

  // Data inputs always reflect the latest props.
  watchEffect(() => {
    store.events.value = props.events ?? []
  })
  watchEffect(() => {
    store.backgroundEvents.value = props.backgroundEvents ?? []
  })
  watchEffect(() => {
    store.resources.value = props.resources
  })

  onUnmounted(() => store.destroy())

  return store
}
