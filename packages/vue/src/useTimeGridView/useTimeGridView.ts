import type { ComputedRef, ShallowRef } from 'vue'
import { onMounted } from 'vue'
import { shallowRef } from 'vue'
import { useCalendarContext } from '../CalendarProvider'
import { dayCountStyle, slotGroupStyle } from '../internal/geometryStyles'
import { useEventRoving } from '../internal/useEventRoving'
import { useKeyboardDnd } from '../internal/useKeyboardDnd'
import { useTimeGrid } from '../useTimeGrid'
import type { TimeGrid } from '../useTimeGrid'
import { useTimeGridBody } from '../useTimeGridBody'
import type { UseTimeGridBodyReturn } from '../useTimeGridBody'
import { useTimeGridHeader } from '../useTimeGridHeader'
import type { UseTimeGridHeaderReturn } from '../useTimeGridHeader'

/** Element-spread props for the keyboard-DnD live-region `<div>`. */
export interface TimeGridAnnouncerProps {
  class: string
  role: 'status'
  'aria-live': 'polite'
}

/** Element-spread props for the outermost `.bc-time-grid` root `<div>`. */
export interface TimeGridRootProps {
  class: string
  ref: ShallowRef<HTMLElement | null>
  onKeydown: (e: KeyboardEvent) => void
  onKeydownCapture: (e: KeyboardEvent) => void
  onFocusCapture: (e: FocusEvent) => void
}

/** Return value of {@link useTimeGridView}. */
export interface UseTimeGridViewReturn<TEvent> {
  /**
   * Reactive computed ref for the resolved time grid. Vue auto-unwraps it in
   * `<script setup>` templates, so the template reads it as `TimeGrid | null`
   * and re-renders whenever the grid recomputes (e.g. on event updates).
   * `null` when the active view is not a time grid.
   */
  grid: ComputedRef<TimeGrid<TEvent> | null>
  /** Keyboard-DnD step announcement (empty string when idle). */
  announcement: ShallowRef<string>
  /** Element-spread props for the keyboard-DnD announcer live-region. */
  announcer: TimeGridAnnouncerProps
  /** Root element-spread props. */
  root: TimeGridRootProps
  /**
   * Returns the CSS style object for the outermost root `<div>`.
   * Pass the number of leaf columns.
   */
  getRootStyle: (leafCount: number) => Record<string, string>
  /** All header-section state and element-spread groups. */
  header: UseTimeGridHeaderReturn<TEvent>
  /** All body-section state and element-spread groups. */
  body: UseTimeGridBodyReturn<TEvent>
}

function computeRootClass(grid: TimeGrid<unknown> | null): string {
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
 * Composed composable for `<TimeGridView>`. Calls {@link useTimeGrid} once,
 * passes the result to {@link useTimeGridHeader} and {@link useTimeGridBody},
 * and wires up the root-level event-roving and keyboard-DnD.
 */
export function useTimeGridView<TEvent = unknown>(): UseTimeGridViewReturn<TEvent> {
  const { store } = useCalendarContext<TEvent>()
  const gridRef = useTimeGrid<TEvent>()

  const header = useTimeGridHeader<TEvent>(gridRef.value)
  const body = useTimeGridBody<TEvent>(gridRef.value)
  const eventRoving = useEventRoving()
  const keyboardDnd = useKeyboardDnd({ mode: 'time' })

  const containerRef = shallowRef<HTMLElement | null>(null)

  onMounted(() => {
    const el = containerRef.value
    const grid = gridRef.value
    if (el == null || grid == null) return

    const firstCol =
      grid.columns[0] ??
      grid.resources?.[0]?.columns[0] ??
      grid.dayGroups?.[0]?.cells[0]?.column
    if (firstCol == null) return

    const colEl = el.querySelector<HTMLElement>('.bc-day-column')
    if (colEl == null) return
    const colHeight = colEl.offsetHeight
    if (colHeight === 0) return

    const dayStartMin = store.localizer.getMinutesFromMidnight(firstCol.min)
    const totalMin = store.localizer.getTotalMin({ start: firstCol.min, end: firstCol.max })
    if (totalMin === 0) return

    const targetMin =
      store.scrollToTime != null
        ? store.scrollToTime.hour * 60 + (store.scrollToTime.minute ?? 0)
        : store.localizer.getMinutesFromMidnight(store.getNow())

    const fraction = Math.max(0, Math.min(1, (targetMin - dayStartMin) / totalMin))
    el.scrollTo({ top: Math.round(fraction * colHeight), behavior: 'instant' })
  })

  return {
    grid: gridRef,
    announcement: keyboardDnd.announcement,
    announcer: { class: 'bc-sr-only', role: 'status' as const, 'aria-live': 'polite' as const },
    root: {
      class: computeRootClass(gridRef.value),
      ref: containerRef,
      onKeydown: eventRoving.onKeydown,
      onKeydownCapture: keyboardDnd.onKeydownCapture,
      onFocusCapture: eventRoving.onFocusCapture,
    },
    getRootStyle: (leafCount: number): Record<string, string> => ({
      ...(dayCountStyle(leafCount) as Record<string, string>),
      ...(slotGroupStyle(store.timeslots) as Record<string, string>),
    }),
    header,
    body,
  }
}
