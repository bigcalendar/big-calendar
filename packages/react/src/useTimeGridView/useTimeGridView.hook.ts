import type { CSSProperties, FocusEvent, KeyboardEvent } from 'react'
import { useCalendarContext } from '../CalendarProvider'
import { dayCountStyle, slotGroupStyle } from '../geometryStyles'
import { useEventRoving } from '../useEventRoving'
import { useKeyboardDnd } from '../useKeyboardDnd'
import { useTimeGrid } from '../useTimeGrid'
import type { TimeGrid } from '../useTimeGrid'
import { useTimeGridBody } from '../useTimeGridBody'
import type { UseTimeGridBodyReturn } from '../useTimeGridBody'
import { useTimeGridHeader } from '../useTimeGridHeader'
import type { UseTimeGridHeaderReturn } from '../useTimeGridHeader'

/** Callback ref accepted by roving hooks. */
type CallbackRef = (node: HTMLElement | null) => void

/** Element-spread props for the outermost `.bc-time-grid` root `<div>`. */
export interface TimeGridRootProps {
  ref: CallbackRef
  onKeyDownCapture: (e: KeyboardEvent<HTMLDivElement>) => void
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void
  onFocusCapture: (e: FocusEvent<HTMLDivElement>) => void
}

/** Return value of {@link useTimeGridView}. */
export interface UseTimeGridViewReturn<TEvent> {
  /**
   * Resolved time grid, or `null` when the active view is not a time grid.
   * When `null` the component should return `null` immediately.
   */
  grid: TimeGrid<TEvent> | null
  /**
   * Keyboard-DnD step announcement. Render inside a polite live-region `<div>`
   * (always mounted; empty string when idle).
   */
  announcement: string
  /**
   * Root element-spread props (event-roving + keyboard-DnD handlers). Apply to
   * the outermost `.bc-time-grid` `<div>` in every layout variant.
   */
  root: TimeGridRootProps
  /**
   * Returns the CSS style for the outermost root `<div>` in a given leaf-column
   * layout. Pass the number of leaf columns (plain = `headings.length`,
   * resource-major = sum of group column counts, day-major = days × resources).
   */
  getRootStyle: (leafCount: number) => CSSProperties
  /** All header-section state and element-spread groups. */
  header: UseTimeGridHeaderReturn<TEvent>
  /** All body-section state and element-spread groups. */
  body: UseTimeGridBodyReturn<TEvent>
}

/**
 * Composed hook for {@link TimeGridView}. Calls {@link useTimeGrid} once,
 * passes the result into {@link useTimeGridHeader} and {@link useTimeGridBody},
 * and wires up the root-level event-roving and keyboard-DnD. The view component
 * becomes a near-pure render function that spreads the returned groups onto their
 * target elements.
 *
 * Developers building a fully custom time-grid layout can also call
 * {@link useTimeGrid}, {@link useTimeGridHeader}, and {@link useTimeGridBody}
 * separately at whatever granularity they need.
 */
export function useTimeGridView<TEvent = unknown>(): UseTimeGridViewReturn<TEvent> {
  const { store } = useCalendarContext<TEvent>()
  const grid = useTimeGrid<TEvent>()
  const header = useTimeGridHeader<TEvent>(grid)
  const body = useTimeGridBody<TEvent>(grid)
  const eventRoving = useEventRoving()
  const keyboardDnd = useKeyboardDnd<TEvent>({ mode: 'time' })

  return {
    grid,
    announcement: keyboardDnd.announcement,
    root: {
      ref: eventRoving.containerRef,
      onKeyDownCapture: keyboardDnd.onKeyDownCapture,
      onKeyDown: eventRoving.onKeyDown,
      onFocusCapture: eventRoving.onFocusCapture,
    },
    getRootStyle: (leafCount: number): CSSProperties => ({
      ...dayCountStyle(leafCount),
      ...slotGroupStyle(store.timeslots),
    }),
    header,
    body,
  }
}
