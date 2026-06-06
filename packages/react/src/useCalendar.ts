import type { CalendarConfig, CalendarStore, ViewKey } from '@big-calendar/core'
import { createCalendarStore } from '@big-calendar/core'
import type { MouseEvent as ReactMouseEvent } from 'react'
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
  /**
   * Event primary action: fired on click / Enter / Space, after the event is
   * selected. Receives the full event. Defaults to a noop.
   */
  onEventClick?: ((event: TEvent) => void) | undefined
  /**
   * Event secondary action: fired on double-click / F2. Receives the full event.
   * Defaults to a noop. (There is no keyboard double-click; F2 is the parity key
   * per WCAG 2.1.1.)
   */
  onEventDoubleClick?: ((event: TEvent) => void) | undefined
  /**
   * Event context-menu action: fired on right-click (and the keyboard Menu key /
   * Shift+F10, and touch long-press). Receives the full event **and** the DOM
   * mouse event, so you can read `clientX`/`clientY` to position a custom menu
   * and call `preventDefault()` to replace the native one. Defaults to a noop.
   */
  onEventRightClick?: ((event: TEvent, domEvent: ReactMouseEvent) => void) | undefined
  /**
   * Event tertiary action: fired on a middle-button ("scroll wheel") click.
   * Receives the full event **and** the DOM mouse event. Pointer-only — there is
   * no keyboard equivalent (like middle-click everywhere). Defaults to a noop.
   */
  onEventMiddleClick?: ((event: TEvent, domEvent: ReactMouseEvent) => void) | undefined
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
      onSelect: (args) => propsRef.current.onSelect?.(args),
      onDrillDown: (args) => propsRef.current.onDrillDown?.(args),
      // Wrap only when provided so the store doesn't wire selection callbacks
      // (and their per-move translation) for calendars that never use them.
      onSelecting: props.onSelecting
        ? (args) => propsRef.current.onSelecting?.(args)
        : undefined,
      onSelectSlot: props.onSelectSlot
        ? (args) => propsRef.current.onSelectSlot?.(args)
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
