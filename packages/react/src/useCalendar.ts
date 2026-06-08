import type { CalendarConfig, CalendarStore, ViewKey } from '@big-calendar/core'
import { createCalendarStore } from '@big-calendar/core'
import { useEffect, useRef } from 'react'

/**
 * Props for the headless {@link useCalendar} hook and the `<Calendar>`
 * component. Hybrid controlled/uncontrolled (Cutter, 2026-06-02):
 *
 * - Omit `view`/`date` to run **uncontrolled** — the store owns them, seeded by
 *   `defaultView`/`defaultDate`.
 * - Pass `view`/`date` to run **controlled** — the calendar reflects the prop;
 *   wire `onView`/`onNavigate` to update it.
 * - `events`/`backgroundEvents`/`resources` are data inputs and always sync to
 *   the store when they change.
 */
export interface CalendarProps<TEvent = unknown, TResource = unknown>
  extends Omit<CalendarConfig<TEvent, TResource>, 'view' | 'date'> {
  /** Initial view (uncontrolled). Ignored when `view` is set. */
  defaultView?: ViewKey | undefined
  /** Initial focus date (uncontrolled). Ignored when `date` is set. */
  defaultDate?: string | undefined
  /** Controlled view. */
  view?: ViewKey | undefined
  /** Controlled focus date (RFC 3339/9557). */
  date?: string | undefined
  // Event-interaction callbacks (`onEventClick` / `onEventDoubleClick` /
  // `onEventRightClick` / `onEventMiddleClick` / `onEventSelect`) and slot
  // callbacks (`onSlot*`) are inherited from {@link CalendarConfig} — the shared,
  // framework-agnostic surface. Right/middle receive the native DOM `MouseEvent`.
}

/**
 * Create (once) and reactively bind a calendar store from props. Returns the
 * store; read its signals through {@link useSignalValue} and call its actions.
 *
 * The store is created a single time; later prop changes are synced in:
 * controlled `view`/`date` are written straight to the signals (no callback
 * re-fire), and `events`/`backgroundEvents`/`resources` are pushed on change.
 * Callbacks always read the latest props. The store is torn down on unmount.
 */
export function useCalendar<TEvent = unknown, TResource = unknown>(
  props: CalendarProps<TEvent, TResource>,
): CalendarStore<TEvent, TResource> {
  const propsRef = useRef(props)
  propsRef.current = props

  const storeRef = useRef<CalendarStore<TEvent, TResource> | null>(null)
  if (storeRef.current === null) {
    const initial: CalendarConfig<TEvent, TResource> = {
      ...props,
      view: props.view ?? props.defaultView,
      date: props.date ?? props.defaultDate,
      onNavigate: (args) => propsRef.current.onNavigate?.(args),
      onView: (args) => propsRef.current.onView?.(args),
      onEventSelect: (args) => propsRef.current.onEventSelect?.(args),
      onDrillDown: (args) => propsRef.current.onDrillDown?.(args),
      // Event interaction. Wrap-when-provided so core's `eventHandlers.has` (and
      // the per-handler presence flags) reflect what the app actually passed —
      // an omitted right/middle handler wires no listener at all. The wrapper
      // keeps a stable identity while reading the latest prop via the ref.
      onEventClick: props.onEventClick
        ? (event) => propsRef.current.onEventClick?.(event)
        : undefined,
      onEventDoubleClick: props.onEventDoubleClick
        ? (event) => propsRef.current.onEventDoubleClick?.(event)
        : undefined,
      onEventRightClick: props.onEventRightClick
        ? (event, domEvent) => propsRef.current.onEventRightClick?.(event, domEvent)
        : undefined,
      onEventMiddleClick: props.onEventMiddleClick
        ? (event, domEvent) => propsRef.current.onEventMiddleClick?.(event, domEvent)
        : undefined,
      // Event drag-and-drop + resize. Wrap-when-provided so the latest handler
      // runs — a drop/resize handler closes over the app's current `events` (for
      // optimistic update + rollback), so calling a stale one would revert against
      // the wrong snapshot. Every new CalendarConfig callback must be wrapped here.
      onEventDrop: props.onEventDrop
        ? (args) => propsRef.current.onEventDrop?.(args)
        : undefined,
      onEventResize: props.onEventResize
        ? (args) => propsRef.current.onEventResize?.(args)
        : undefined,
      // Drop-from-outside / drag-out (5d). Same latest-ref reasoning: a
      // drop-from-outside handler closes over the app's current `events` to append
      // the new event, so a stale closure would add against the wrong snapshot.
      onDropFromOutside: props.onDropFromOutside
        ? (args) => propsRef.current.onDropFromOutside?.(args)
        : undefined,
      onEventDragStart: props.onEventDragStart
        ? (args) => propsRef.current.onEventDragStart?.(args)
        : undefined,
      // Slot selection. Wrap only when provided so the store doesn't wire the
      // callbacks (and their per-move translation) for calendars that never use them.
      onSlotSelecting: props.onSlotSelecting
        ? (args) => propsRef.current.onSlotSelecting?.(args)
        : undefined,
      onSlotClick: props.onSlotClick
        ? (args) => propsRef.current.onSlotClick?.(args)
        : undefined,
      onSlotDoubleClick: props.onSlotDoubleClick
        ? (args) => propsRef.current.onSlotDoubleClick?.(args)
        : undefined,
      onSlotSelect: props.onSlotSelect
        ? (args) => propsRef.current.onSlotSelect?.(args)
        : undefined,
      // Wrap only when provided: an always-present handler would force the
      // store's range effect (and a full localizer) even when unused.
      onRangeChange: props.onRangeChange
        ? (args) => propsRef.current.onRangeChange?.(args)
        : undefined,
    }
    storeRef.current = createCalendarStore<TEvent, TResource>(initial)
  }
  const store = storeRef.current

  // Controlled view/date: write the signal directly so we don't re-fire callbacks.
  useEffect(() => {
    if (props.view !== undefined) store.view.value = props.view
  }, [props.view, store])
  useEffect(() => {
    if (props.date !== undefined) store.date.value = props.date
  }, [props.date, store])

  // Data inputs always reflect the latest props.
  useEffect(() => {
    store.events.value = props.events ?? []
  }, [props.events, store])
  useEffect(() => {
    store.backgroundEvents.value = props.backgroundEvents ?? []
  }, [props.backgroundEvents, store])
  useEffect(() => {
    store.resources.value = props.resources
  }, [props.resources, store])

  // Tear down the store's internal subscriptions on unmount.
  useEffect(() => () => store.destroy(), [store])

  return store
}
