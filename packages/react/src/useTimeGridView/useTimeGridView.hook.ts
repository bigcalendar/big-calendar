import type { CSSProperties, FocusEvent, KeyboardEvent } from 'react'
import { useCallback, useEffect, useRef } from 'react'
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

/** Element-spread props for the keyboard-DnD live-region `<div>`. */
export interface TimeGridAnnouncerProps {
  className: string
  role: 'status'
  'aria-live': 'polite'
}

/** Element-spread props for the outermost `.bc-time-grid` root `<div>`. */
export interface TimeGridRootProps {
  className: string
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
  /** Element-spread props for the keyboard-DnD announcer live-region `<div>`. */
  announcer: TimeGridAnnouncerProps
  /**
   * Root element-spread props (className + event-roving + keyboard-DnD handlers).
   * Apply to the outermost `.bc-time-grid` `<div>` in every layout variant.
   * The `className` already encodes the layout variant (plain / resource-major /
   * day-major) so do not set a separate class on the element.
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

function computeRootClassName(grid: TimeGrid<unknown> | null): string {
  if (grid === null) return 'bc-time-grid'
  if (grid.dayGroups !== null) return 'bc-time-grid bc-time-grid-resources bc-time-grid-resources-day-major'
  if (grid.resources !== null) {
    return grid.headings.length > 1
      ? 'bc-time-grid bc-time-grid-resources bc-time-grid-resources-week'
      : 'bc-time-grid bc-time-grid-resources bc-time-grid-resources-day'
  }
  return 'bc-time-grid'
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

  // Capture the container element so the scroll effect can access it imperatively.
  const containerEl = useRef<HTMLElement | null>(null)
  const composedRef = useCallback(
    (node: HTMLElement | null) => {
      containerEl.current = node
      eventRoving.containerRef(node)
    },
    [eventRoving.containerRef],
  )

  // Capture mount-time values in a ref so the effect runs exactly once with
  // stable deps while still seeing the initial grid and store state.
  const scrollSetup = useRef({ grid, store })
  scrollSetup.current = { grid, store }

  useEffect(() => {
    const { grid: g, store: s } = scrollSetup.current
    const el = containerEl.current
    if (el == null || g == null) return

    const firstCol =
      g.columns[0] ??
      g.resources?.[0]?.columns[0] ??
      g.dayGroups?.[0]?.cells[0]?.column
    if (firstCol == null) return

    const colEl = el.querySelector<HTMLElement>('.bc-day-column')
    if (colEl == null) return
    const colHeight = colEl.offsetHeight
    if (colHeight === 0) return

    const dayStartMin = s.localizer.getMinutesFromMidnight(firstCol.min)
    const totalMin = s.localizer.getTotalMin({ start: firstCol.min, end: firstCol.max })
    if (totalMin === 0) return

    const targetMin =
      s.scrollToTime != null
        ? s.scrollToTime.hour * 60 + (s.scrollToTime.minute ?? 0)
        : s.localizer.getMinutesFromMidnight(s.getNow())

    const fraction = Math.max(0, Math.min(1, (targetMin - dayStartMin) / totalMin))
    if (typeof el.scrollTo === 'function') {
      el.scrollTo({ top: Math.round(fraction * colHeight), behavior: 'instant' })
    }
  }, [])

  return {
    grid,
    announcement: keyboardDnd.announcement,
    announcer: { className: 'bc-sr-only', role: 'status' as const, 'aria-live': 'polite' as const },
    root: {
      className: computeRootClassName(grid),
      ref: composedRef,
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
