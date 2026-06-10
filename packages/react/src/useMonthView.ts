import type { ResizeEdge } from '@big-calendar/core'
import type { ComponentType, CSSProperties, FocusEvent, KeyboardEvent, PointerEvent } from 'react'
import { useCallback } from 'react'
import { useCalendarContext } from './CalendarProvider'
import type {
  MonthDateProps,
  MonthEventProps,
  MonthShowMoreProps,
  MonthWeekdayProps,
  ShowMoreEvent,
} from './components.type'
import { monthGridStyle, segmentStyle } from './geometryStyles'
import { useEventRoving } from './useEventRoving'
import { useKeyboardDnd } from './useKeyboardDnd'
import type { Direction } from './useRovingSelection'
import { useRovingSelection } from './useRovingSelection'
import { useSignalValue } from './internal/useSignalValue'
import { useSlotSelection } from './useSlotSelection'
import DefaultMonthDate from './DefaultMonthDate'
import DefaultMonthEvent from './DefaultMonthEvent'
import DefaultMonthShowMore from './DefaultMonthShowMore'
import DefaultMonthWeekday from './DefaultMonthWeekday'
import { useMonthWeeks } from './useMonthWeeks'
import type { MonthDayCell, MonthGrid, MonthSegmentCell, MonthWeekCell } from './useMonthWeeks'

/** Resolved component slots for the month view. */
export interface MonthViewComponents<TEvent> {
  Weekday: ComponentType<MonthWeekdayProps>
  DateCell: ComponentType<MonthDateProps>
  EventSlot: ComponentType<MonthEventProps<TEvent>>
  ShowMore: ComponentType<MonthShowMoreProps<TEvent>>
}

/** Callback ref accepted by roving and event-roving hooks. */
type CallbackRef = (node: HTMLElement | null) => void

/** Element-spread props for the outer month root `<div>`. */
export interface MonthRootProps {
  className: string
  ref: CallbackRef
  onKeyDownCapture: (e: KeyboardEvent<HTMLDivElement>) => void
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void
  onFocusCapture: (e: FocusEvent<HTMLDivElement>) => void
}

/** Element-spread props for the `bc-month-grid` `<div>`. */
export interface MonthGridProps {
  className: string
  style: CSSProperties
  ref: CallbackRef
  onPointerDown: (e: PointerEvent<HTMLDivElement>) => void
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void
  onFocusCapture: (e: FocusEvent<HTMLDivElement>) => void
}

/** Element-spread props for a `bc-month-slot` hit-target `<div>`. */
export interface MonthDaySlotProps {
  className: string
  'data-date': string
  'data-slot-index': number
  tabIndex: number
  'aria-describedby': string
}

/** Element-spread props for an `EventButton` segment (all required props). */
export interface MonthSegmentButtonProps<TEvent> {
  className: string
  style: CSSProperties
  event: TEvent
  title: string
  resizeEdges: ResizeEdge[]
}

/** Element-spread props for a `bc-show-more-cell` wrapper `<div>`. */
export interface MonthShowMoreCellProps {
  className: string
  style: CSSProperties
}

/** Return value of {@link useMonthView}. */
export interface UseMonthViewReturn<TEvent> {
  /** Resolved month grid, or `null` when the active view is not the month. */
  grid: MonthGrid<TEvent> | null
  /** Resolved component slots. */
  components: MonthViewComponents<TEvent>
  /** Resolved UI strings. */
  messages: { showMore: (count: number) => string }
  /** Current keyboard-DnD step announcement (empty string when idle). */
  announcement: string
  /** Navigate to the given day. */
  drilldown: (date: string) => void
  /** Element-spread props for the outermost `<div className="bc-month">`. */
  root: MonthRootProps
  /** Element-spread props for `<div className="bc-month-grid">`. */
  monthGrid: MonthGridProps
  /**
   * Returns element-spread props for a `bc-month-slot` hit-target cell.
   * Call once per day cell inside a week loop.
   */
  getDaySlotProps: (cell: MonthDayCell<TEvent>, weekIndex: number, dayIndex: number) => MonthDaySlotProps
  /**
   * Returns the rendered selection-band props (`className` + `style`) for the
   * given week row, or `null` when no band overlaps the row.
   */
  getWeekSelectionBand: (weekIndex: number) => { className: string; style: CSSProperties } | null
  /**
   * Returns the rendered drag-preview-band props for the given week row, or
   * `null` when no live preview overlaps the row.
   */
  getWeekPreviewBand: (week: MonthWeekCell<TEvent>) => { className: string; style: CSSProperties } | null
  /**
   * Returns all `EventButton` props for a placed segment (spread onto the
   * button directly; pass `key={segment.key}` separately).
   */
  getSegmentProps: (segment: MonthSegmentCell<TEvent>) => MonthSegmentButtonProps<TEvent>
  /**
   * Returns the `<div className="bc-show-more-cell">` wrapper props plus all
   * `ShowMore` component props for a day cell, or `null` when the cell has no
   * overflow.
   */
  getShowMoreCellProps: (
    cell: MonthDayCell<TEvent>,
    dayIndex: number,
    moreRow: number,
  ) => (MonthShowMoreCellProps & {
    count: number
    label: string
    day: string
    events: ShowMoreEvent<TEvent>[]
  }) | null
}

/**
 * Composes all logic for {@link MonthView} into a single hook. Extracts signal
 * subscriptions, roving-focus setup, keyboard DnD, slot selection, drag-preview
 * computation, and component resolution — the view component becomes a near-pure
 * render function that spreads the returned groups onto their target elements.
 */
export function useMonthView<TEvent = unknown>(): UseMonthViewReturn<TEvent> {
  const { store, components, messages, descriptionIds } = useCalendarContext<TEvent>()
  const grid = useMonthWeeks<TEvent>()
  const onSlotPointerDown = useSlotSelection('day')
  const selRange = useSignalValue(store.selection.range)
  const selAnchor = useSignalValue(store.selection.anchor)
  const dragPreview = useSignalValue(store.dragPreview)
  const { localizer } = store

  const previewFirst =
    dragPreview === null ? null : localizer.startOf({ value: dragPreview.start, unit: 'day' })
  const previewLast =
    dragPreview === null
      ? null
      : localizer.add({ value: localizer.ceil({ value: dragPreview.end, unit: 'day' }), amount: -1, unit: 'day' })

  const cellCount = grid ? grid.weeks.length * 7 : 0
  const neighbor = useCallback(
    (index: number, dir: Direction): number | null => {
      switch (dir) {
        case 'left':
          return index > 0 ? index - 1 : null
        case 'right':
          return index + 1 < cellCount ? index + 1 : null
        case 'up':
          return index - 7 >= 0 ? index - 7 : null
        case 'down':
          return index + 7 < cellCount ? index + 7 : null
      }
    },
    [cellCount],
  )
  const roving = useRovingSelection({ mode: 'day', count: cellCount, neighbor })
  const eventRoving = useEventRoving()
  const keyboardDnd = useKeyboardDnd<TEvent>({ mode: 'day' })

  return {
    grid,
    components: {
      Weekday: components.month?.weekday ?? DefaultMonthWeekday,
      DateCell: components.month?.dateCell ?? DefaultMonthDate,
      EventSlot: (components.month?.event ?? DefaultMonthEvent) as ComponentType<MonthEventProps<TEvent>>,
      ShowMore: (components.month?.showMore ?? DefaultMonthShowMore) as ComponentType<MonthShowMoreProps<TEvent>>,
    },
    messages: {
      showMore: messages.showMore,
    },
    announcement: keyboardDnd.announcement,
    drilldown: (date: string) => store.drilldown({ date }),
    root: {
      className: 'bc-month',
      ref: eventRoving.containerRef,
      onKeyDownCapture: keyboardDnd.onKeyDownCapture,
      onKeyDown: eventRoving.onKeyDown,
      onFocusCapture: eventRoving.onFocusCapture,
    },
    monthGrid: {
      className: 'bc-month-grid',
      style: grid ? monthGridStyle(grid.weeks.length) : {},
      ref: roving.containerRef,
      onPointerDown: onSlotPointerDown,
      onKeyDown: roving.onKeyDown,
      onFocusCapture: roving.onFocusCapture,
    },
    getDaySlotProps: (cell: MonthDayCell<TEvent>, weekIndex: number, dayIndex: number): MonthDaySlotProps => {
      const slotIndex = weekIndex * 7 + dayIndex
      return {
        className: 'bc-month-slot',
        'data-date': cell.day,
        'data-slot-index': slotIndex,
        tabIndex: roving.cellTabIndex(slotIndex),
        'aria-describedby': descriptionIds.selection,
      }
    },
    getWeekSelectionBand: (weekIndex: number) => {
      const base = weekIndex * 7
      const active = selRange !== null && selAnchor?.mode === 'day'
      if (!active) return null
      const segStart = Math.max(selRange.start, base)
      const segEnd = Math.min(selRange.end, base + 6)
      if (segStart > segEnd) return null
      return {
        className: 'bc-selection bc-selection-month',
        style: segmentStyle({ left: segStart - base + 1, span: segEnd - segStart + 1, row: 1 }),
      }
    },
    getWeekPreviewBand: (week: MonthWeekCell<TEvent>) => {
      if (previewFirst === null || previewLast === null) return null
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
        className: 'bc-drag-preview bc-drag-preview-month',
        style: segmentStyle({ left: first + 1, span: last - first + 1, row: 1 }),
      }
    },
    getSegmentProps: (segment: MonthSegmentCell<TEvent>): MonthSegmentButtonProps<TEvent> => {
      const resizeEdges: ResizeEdge[] = []
      if (segment.resizeStart) resizeEdges.push('start')
      if (segment.resizeEnd) resizeEdges.push('end')
      return {
        className: 'bc-segment',
        style: segmentStyle({ left: segment.left, span: segment.span, row: segment.row }),
        event: segment.event,
        title: segment.title,
        resizeEdges,
      }
    },
    getShowMoreCellProps: (cell: MonthDayCell<TEvent>, dayIndex: number, moreRow: number) => {
      if (cell.extra === null) return null
      return {
        className: 'bc-show-more-cell',
        style: segmentStyle({ left: dayIndex + 1, span: 1, row: moreRow }),
        count: cell.extra.count,
        label: messages.showMore(cell.extra.count),
        day: cell.day,
        events: cell.extra.events,
      }
    },
  }
}
