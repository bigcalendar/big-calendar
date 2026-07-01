import type { CalendarStore } from '@big-calendar/core'
import { createCalendarStore } from '@big-calendar/core'
import { onDestroy } from 'svelte'
import type { CalendarProps } from './calendarProps.type'

/**
 * Create (once) and reactively bind a calendar store from Svelte 5 props.
 *
 * Designed to be called inside a component's `<script>` block where `$effect`
 * and `onDestroy` are valid. Pass a getter function (or `$props()` destructure)
 * so that reactive reads inside `$effect` always use the latest values.
 *
 * Callback handling mirrors the React and Vue adapters: callbacks absent at
 * mount time are not wired (preserving `store.eventHandlers.has*` flags); those
 * present forward to the latest prop value via closure over the reactive getter.
 */
export function useCalendarStore<TEvent = unknown, TResource = unknown>(
  getProps: () => CalendarProps<TEvent, TResource>,
): CalendarStore<TEvent, TResource> {
  const initial = getProps()
  const {
    defaultView,
    defaultDate,
    views,
    view: initialView,
    date: initialDate,
    ...baseConfig
  } = initial

  const store = createCalendarStore<TEvent, TResource>({
    ...baseConfig,
    view: initialView ?? defaultView,
    date: initialDate ?? defaultDate,
    enabledViews: views,
    onNavigate: initial.onNavigate
      ? (args) => getProps().onNavigate?.(args)
      : undefined,
    onView: initial.onView
      ? (args) => getProps().onView?.(args)
      : undefined,
    onEventSelect: initial.onEventSelect
      ? (args) => getProps().onEventSelect?.(args)
      : undefined,
    onDrillDown: initial.onDrillDown
      ? (args) => getProps().onDrillDown?.(args)
      : undefined,
    onEventClick: initial.onEventClick
      ? (event, domEvent) => getProps().onEventClick?.(event, domEvent)
      : undefined,
    onEventDoubleClick: initial.onEventDoubleClick
      ? (event, domEvent) => getProps().onEventDoubleClick?.(event, domEvent)
      : undefined,
    onEventRightClick: initial.onEventRightClick
      ? (event, domEvent) => getProps().onEventRightClick?.(event, domEvent)
      : undefined,
    onEventMiddleClick: initial.onEventMiddleClick
      ? (event, domEvent) => getProps().onEventMiddleClick?.(event, domEvent)
      : undefined,
    // Always create these wrappers so the store's drop/resize callbacks are
    // never null. The core checks for null and silently skips if absent.
    onEventDrop: (args) => getProps().onEventDrop?.(args),
    onEventResize: (args) => getProps().onEventResize?.(args),
    onDropFromOutside: initial.onDropFromOutside
      ? (args) => getProps().onDropFromOutside?.(args)
      : undefined,
    onEventDragStart: initial.onEventDragStart
      ? (args) => getProps().onEventDragStart?.(args)
      : undefined,
    onSlotSelecting: initial.onSlotSelecting
      ? (args) => getProps().onSlotSelecting?.(args)
      : undefined,
    onSlotClick: initial.onSlotClick
      ? (args) => getProps().onSlotClick?.(args)
      : undefined,
    onSlotDoubleClick: initial.onSlotDoubleClick
      ? (args) => getProps().onSlotDoubleClick?.(args)
      : undefined,
    onSlotSelect: initial.onSlotSelect
      ? (args) => getProps().onSlotSelect?.(args)
      : undefined,
    onRangeChange: initial.onRangeChange
      ? (args) => getProps().onRangeChange?.(args)
      : undefined,
  })

  // Controlled view/date — write the signal directly to avoid re-firing callbacks.
  $effect(() => {
    const p = getProps()
    if (p.view !== undefined) store.view.value = p.view
  })
  $effect(() => {
    const p = getProps()
    if (p.date !== undefined) store.date.value = p.date
  })

  // Localizer swap — recomputes range/label/viewModel without remounting.
  $effect(() => {
    store.setLocalizer({ localizer: getProps().localizer })
  })

  // Layout algorithm.
  $effect(() => {
    store.dayLayoutAlgorithm.value = getProps().dayLayoutAlgorithm
  })

  // Data inputs always reflect the latest props.
  $effect(() => {
    store.events.value = getProps().events ?? []
  })
  $effect(() => {
    store.backgroundEvents.value = getProps().backgroundEvents ?? []
  })
  $effect(() => {
    store.resources.value = getProps().resources
  })

  onDestroy(() => store.destroy())

  return store
}
