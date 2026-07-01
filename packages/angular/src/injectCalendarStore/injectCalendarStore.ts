import type { CalendarStore } from '@big-calendar/core'
import { createCalendarStore } from '@big-calendar/core'
import { DestroyRef, effect, inject, untracked } from '@angular/core'
import type { CalendarProps } from './calendarProps.type'

/**
 * Create (once) and reactively bind a calendar store from Angular signals.
 *
 * `getProps` is a getter function that reads Angular signals (e.g. component
 * input signals) to return the current `CalendarProps`. The getter is called
 * inside an Angular `effect()`, so any Angular signal read inside it is
 * automatically tracked — the store's preact signals are re-synced whenever
 * any tracked input changes.
 *
 * Must be called in an Angular injection context (constructor, class field
 * initializer, or inside `runInInjectionContext`).
 *
 * Callback handling mirrors the React and Vue adapters: callbacks absent at
 * mount time are not wired (preserving `store.eventHandlers.has*` flags);
 * callbacks present always forward to the latest value via the getter.
 *
 * @example
 * ```ts
 * @Component({ ... })
 * export class CalendarProviderComponent<TEvent, TResource> {
 *   localizer = input.required<LocalizerContract>()
 *   events    = input<TEvent[]>([])
 *
 *   store = injectCalendarStore(() => ({
 *     localizer: this.localizer(),
 *     events:    this.events(),
 *   }))
 * }
 * ```
 */
export function injectCalendarStore<TEvent = unknown, TResource = unknown>(
  getProps: () => CalendarProps<TEvent, TResource>,
): CalendarStore<TEvent, TResource> {
  const destroyRef = inject(DestroyRef)

  const {
    defaultView,
    defaultDate,
    views: initialViews,
    view: initialView,
    date: initialDate,
    ...baseConfig
  } = untracked(getProps)

  const store = createCalendarStore<TEvent, TResource>({
    ...baseConfig,
    view: initialView ?? defaultView,
    date: initialDate ?? defaultDate,
    enabledViews: initialViews,
    // Callback wrappers that always forward to the latest prop via the getter.
    onNavigate: baseConfig.onNavigate
      ? (args) => getProps().onNavigate?.(args)
      : undefined,
    onView: baseConfig.onView
      ? (args) => getProps().onView?.(args)
      : undefined,
    onEventSelect: baseConfig.onEventSelect
      ? (args) => getProps().onEventSelect?.(args)
      : undefined,
    onDrillDown: baseConfig.onDrillDown
      ? (args) => getProps().onDrillDown?.(args)
      : undefined,
    onEventClick: baseConfig.onEventClick
      ? (event, domEvent) => getProps().onEventClick?.(event, domEvent)
      : undefined,
    onEventDoubleClick: baseConfig.onEventDoubleClick
      ? (event, domEvent) => getProps().onEventDoubleClick?.(event, domEvent)
      : undefined,
    onEventRightClick: baseConfig.onEventRightClick
      ? (event, domEvent) => getProps().onEventRightClick?.(event, domEvent)
      : undefined,
    onEventMiddleClick: baseConfig.onEventMiddleClick
      ? (event, domEvent) => getProps().onEventMiddleClick?.(event, domEvent)
      : undefined,
    // Always create these wrappers (no conditional guard) so core's
    // onEventDrop / onEventResize are never null at store creation. The
    // guards in these wrappers match the Vue adapter's strategy (§10-2).
    onEventDrop: (args) => getProps().onEventDrop?.(args),
    onEventResize: (args) => getProps().onEventResize?.(args),
    onDropFromOutside: baseConfig.onDropFromOutside
      ? (args) => getProps().onDropFromOutside?.(args)
      : undefined,
    onEventDragStart: baseConfig.onEventDragStart
      ? (args) => getProps().onEventDragStart?.(args)
      : undefined,
    onSlotSelecting: baseConfig.onSlotSelecting
      ? (args) => getProps().onSlotSelecting?.(args)
      : undefined,
    onSlotClick: baseConfig.onSlotClick
      ? (args) => getProps().onSlotClick?.(args)
      : undefined,
    onSlotDoubleClick: baseConfig.onSlotDoubleClick
      ? (args) => getProps().onSlotDoubleClick?.(args)
      : undefined,
    onSlotSelect: baseConfig.onSlotSelect
      ? (args) => getProps().onSlotSelect?.(args)
      : undefined,
    onRangeChange: baseConfig.onRangeChange
      ? (args) => getProps().onRangeChange?.(args)
      : undefined,
  })

  const effectRef = effect(() => {
    const p = getProps()
    if (p.view !== undefined) store.view.value = p.view
    if (p.date !== undefined) store.date.value = p.date
    store.setLocalizer({ localizer: p.localizer })
    store.dayLayoutAlgorithm.value = p.dayLayoutAlgorithm
    store.events.value = p.events ?? []
    store.backgroundEvents.value = p.backgroundEvents ?? []
    store.resources.value = p.resources
  })

  destroyRef.onDestroy(() => {
    effectRef.destroy()
    store.destroy()
  })

  return store
}
