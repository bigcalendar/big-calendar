import type { ResizeEdge } from '@big-calendar/core'
import type { Component, ComputedRef, ShallowRef } from 'vue'
import { computed } from 'vue'
import { useCalendarContext } from '../CalendarProvider'
import { useMonthRowMeasure } from '../internal/useMonthRowMeasure'
import DefaultMonthDate from '../DefaultMonthDate/DefaultMonthDate.vue'
import DefaultMonthEvent from '../DefaultMonthEvent/DefaultMonthEvent.vue'
import DefaultMonthShowMore from '../DefaultMonthShowMore/DefaultMonthShowMore.vue'
import DefaultMonthWeekday from '../DefaultMonthWeekday/DefaultMonthWeekday.vue'
import { monthGridStyle, segmentStyle } from '../internal/geometryStyles'
import { useEventRoving } from '../internal/useEventRoving'
import { useKeyboardDnd } from '../internal/useKeyboardDnd'
import { useRovingSelection } from '../internal/useRovingSelection'
import type { Direction } from '../internal/useRovingSelection'
import { useSlotSelection } from '../internal/useSlotSelection'
import { useSignalRef } from '../internal/useSignalRef'
import { useMonthWeeks } from '../useMonthWeeks'
import type { MonthDayCell, MonthGrid, MonthSegmentCell, MonthWeekCell } from '../useMonthWeeks'

/** Element-spread props for the outer month root `<div>`. */
export interface MonthRootProps {
  class: string
  ref: ShallowRef<HTMLElement | null>
  onKeydown: (e: KeyboardEvent) => void
  onKeydownCapture: (e: KeyboardEvent) => void
  onFocusCapture: (e: FocusEvent) => void
}

/** Element-spread props for the `bc-month-grid` `<div>`. */
export interface MonthGridProps {
  class: string
  style: Record<string, string>
  ref: ShallowRef<HTMLElement | null>
  onPointerdown: (e: PointerEvent) => void
  onKeydown: (e: KeyboardEvent) => void
  onFocusCapture: (e: FocusEvent) => void
}

/** Element-spread props for a `bc-month-slot` hit-target `<div>`. */
export interface MonthDaySlotProps {
  class: string
  'data-date': string
  'data-slot-index': number
  tabIndex: number
  'aria-describedby': string
}

/** Element-spread props for an `EventButton` segment. */
export interface MonthSegmentButtonProps<TEvent> {
  class: string
  style: Record<string, string>
  event: TEvent
  title: string
  resizeEdges: ResizeEdge[]
}

/** Element-spread props for a `bc-show-more-cell` wrapper `<div>`. */
export interface MonthShowMoreCellProps {
  class: string
  style: Record<string, string>
}

/** Resolved component slots for the month view. */
export interface MonthViewComponents {
  Weekday: Component
  DateCell: Component
  EventSlot: Component
  ShowMore: Component
}

/** Element-spread props for the keyboard-DnD live-region `<div>`. */
export interface MonthAnnouncerProps {
  class: string
  role: 'status'
  'aria-live': 'polite'
}

/** Return value of {@link useMonthView}. */
export interface UseMonthViewReturn<TEvent> {
  /** Resolved month grid, or `null` when the active view is not the month. */
  grid: ComputedRef<MonthGrid<TEvent> | null>
  /** Resolved component slots (defaults merged with `components.month` overrides). */
  components: MonthViewComponents
  /** Resolved UI strings. */
  messages: ComputedRef<{ showMore: (count: number) => string }>
  /** Current keyboard-DnD step announcement (empty string when idle). */
  announcement: ShallowRef<string>
  /** Navigate to the given day. */
  drilldown: (date: string) => void
  /** Element-spread props for the keyboard-DnD live-region `<div>`. */
  announcer: MonthAnnouncerProps
  /** Element-spread props for the outermost `<div class="bc-month">`. */
  root: MonthRootProps
  /** Element-spread props for the weekday column-heading row `<div>`. */
  monthHeader: { class: string }
  /** Element-spread props for `<div class="bc-month-grid">`. */
  monthGrid: MonthGridProps
  /** Element-spread props for each week row `<div>`. */
  weekRow: { class: string }
  /** Element-spread props for the slot hit-target container inside a week row. */
  slotsContainer: { class: string }
  /** Element-spread props for the background cells container inside a week row. */
  backgroundsContainer: { class: string }
  /** Element-spread props for the events container inside a week row. */
  eventsContainer: { class: string }
  /** Returns element-spread props for a `bc-month-slot` hit-target cell. */
  getDaySlotProps: (cell: MonthDayCell<TEvent>, weekIndex: number, dayIndex: number) => MonthDaySlotProps
  /**
   * Returns the rendered selection-band props for the given week row, or `null`
   * when no band overlaps the row.
   */
  getWeekSelectionBand: (weekIndex: number) => { class: string; style: Record<string, string> } | null
  /**
   * Returns the rendered drag-preview-band props for the given week row, or
   * `null` when no live preview overlaps the row. (Stub: always `null` until 10-9.)
   */
  getWeekPreviewBand: (week: MonthWeekCell<TEvent>) => { class: string; style: Record<string, string> } | null
  /**
   * Returns all `EventButton` props for a placed segment (pass `key` separately).
   */
  getSegmentProps: (segment: MonthSegmentCell<TEvent>) => MonthSegmentButtonProps<TEvent>
  /**
   * Returns the show-more cell props, or `null` when the cell has no overflow.
   */
  getShowMoreCellProps: (
    cell: MonthDayCell<TEvent>,
    dayIndex: number,
    moreRow: number,
  ) => (MonthShowMoreCellProps & {
    count: number
    label: string
    day: string
    events: ReadonlyArray<{ key: string; event: TEvent; title: string }>
  }) | null
}

/**
 * Composes all state for `<MonthView>`. The view component spreads the
 * returned groups onto their target elements.
 */
export function useMonthView<TEvent = unknown>(): UseMonthViewReturn<TEvent> {
  const { store, components: ctxComponents, messages: rawMessages, descriptionIds } = useCalendarContext<TEvent>()
  const grid = useMonthWeeks<TEvent>()
  const eventRoving = useEventRoving()
  const keyboardDnd = useKeyboardDnd({ mode: 'day' })
  const dragPreviewRef = useSignalRef(store.dragPreview)
  const selRange = useSignalRef(store.selection.range)
  const selAnchor = useSignalRef(store.selection.anchor)

  const weekCount = computed(() => grid.value?.weeks.length ?? 0)
  const cellCount = computed(() => weekCount.value * 7)

  const neighbor = (index: number, dir: Direction): number | null => {
    const c = cellCount.value
    switch (dir) {
      case 'left': return index > 0 ? index - 1 : null
      case 'right': return index + 1 < c ? index + 1 : null
      case 'up': return index - 7 >= 0 ? index - 7 : null
      case 'down': return index + 7 < c ? index + 7 : null
    }
  }

  const roving = useRovingSelection({ mode: 'day', count: cellCount, neighbor })
  const onSlotPointerDown = useSlotSelection('day')

  useMonthRowMeasure({ gridRef: roving.containerRef, weekCount, store })

  const messages = computed(() => ({
    showMore: rawMessages.showMore,
  }))

  const month = ctxComponents.month ?? {}
  const EventSlot = (month.event ?? DefaultMonthEvent) as Component

  return {
    grid,
    components: {
      Weekday: (month.weekday ?? DefaultMonthWeekday) as Component,
      DateCell: (month.dateCell ?? DefaultMonthDate) as Component,
      EventSlot,
      ShowMore: (month.showMore ?? DefaultMonthShowMore) as Component,
    },
    messages,
    announcement: keyboardDnd.announcement,
    drilldown: (date: string) => store.drilldown({ date }),
    announcer: { class: 'bc-sr-only', role: 'status' as const, 'aria-live': 'polite' as const },
    root: {
      class: 'bc-month',
      ref: eventRoving.containerRef,
      onKeydown: eventRoving.onKeydown,
      onKeydownCapture: keyboardDnd.onKeydownCapture,
      onFocusCapture: eventRoving.onFocusCapture,
    },
    monthHeader: { class: 'bc-month-header' },
    weekRow: { class: 'bc-month-week' },
    slotsContainer: { class: 'bc-month-slots' },
    backgroundsContainer: { class: 'bc-week-backgrounds' },
    eventsContainer: { class: 'bc-week-events' },
    monthGrid: {
      class: 'bc-month-grid',
      style: (grid.value ? monthGridStyle(grid.value.weeks.length) : {}) as Record<string, string>,
      ref: roving.containerRef,
      onPointerdown: onSlotPointerDown,
      onKeydown: roving.onKeydown,
      onFocusCapture: roving.onFocusCapture,
    },
    getDaySlotProps: (cell: MonthDayCell<TEvent>, weekIndex: number, dayIndex: number): MonthDaySlotProps => {
      const slotIndex = weekIndex * 7 + dayIndex
      return {
        class: 'bc-month-slot',
        'data-date': cell.day,
        'data-slot-index': slotIndex,
        tabIndex: roving.cellTabIndex(slotIndex),
        'aria-describedby': descriptionIds.selection,
      }
    },
    getWeekSelectionBand: (weekIndex: number) => {
      const base = weekIndex * 7
      const range = selRange.value
      const anchor = selAnchor.value
      if (range === null || anchor?.mode !== 'day') return null
      const segStart = Math.max(range.start, base)
      const segEnd = Math.min(range.end, base + 6)
      if (segStart > segEnd) return null
      return {
        class: 'bc-selection bc-selection-month',
        style: segmentStyle({ left: segStart - base + 1, span: segEnd - segStart + 1, row: 1 }) as Record<string, string>,
      }
    },
    getWeekPreviewBand: (week: MonthWeekCell<TEvent>) => {
      const dragPreview = dragPreviewRef.value
      if (dragPreview === null) return null
      const { localizer } = store
      const previewFirst = localizer.startOf({ value: dragPreview.start, unit: 'day' })
      const previewLast = localizer.add({
        value: localizer.ceil({ value: dragPreview.end, unit: 'day' }),
        amount: -1,
        unit: 'day',
      })
      let first = -1
      let last = -1
      week.days.forEach((cell, dayIndex) => {
        const inPreview =
          localizer.gte({ a: cell.day, b: previewFirst, unit: 'day' }) &&
          localizer.lte({ a: cell.day, b: previewLast, unit: 'day' })
        if (inPreview) {
          if (first === -1) first = dayIndex
          last = dayIndex
        }
      })
      if (first === -1) return null
      return {
        class: 'bc-drag-preview bc-drag-preview-month',
        style: segmentStyle({ left: first + 1, span: last - first + 1, row: 1 }) as Record<string, string>,
      }
    },
    getSegmentProps: (segment: MonthSegmentCell<TEvent>): MonthSegmentButtonProps<TEvent> => {
      const resizeEdges: ResizeEdge[] = []
      if (segment.resizeStart) resizeEdges.push('start')
      if (segment.resizeEnd) resizeEdges.push('end')
      return {
        class: 'bc-segment',
        style: segmentStyle({ left: segment.left, span: segment.span, row: segment.row }) as Record<string, string>,
        event: segment.event,
        title: segment.title,
        resizeEdges,
      }
    },
    getShowMoreCellProps: (cell: MonthDayCell<TEvent>, dayIndex: number, moreRow: number) => {
      if (cell.extra === null) return null
      return {
        class: 'bc-show-more-cell',
        style: segmentStyle({ left: dayIndex + 1, span: 1, row: moreRow }) as Record<string, string>,
        count: cell.extra.count,
        label: rawMessages.showMore(cell.extra.count),
        day: cell.day,
        events: cell.extra.events,
      }
    },
  }
}
