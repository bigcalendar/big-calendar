import type { ComponentType, CSSProperties, FocusEvent, KeyboardEvent, PointerEvent } from 'react'
import { useCallback } from 'react'
import { useCalendarContext } from './CalendarProvider'
import type {
  TimeAllDayEventProps,
  TimeDayHeadingProps,
  TimeShowMoreProps,
} from './components.type'
import { segmentStyle } from './geometryStyles'
import { useRovingSelection } from './useRovingSelection'
import type { Direction } from './useRovingSelection'
import { useSignalValue } from './internal/useSignalValue'
import { useSlotSelection } from './useSlotSelection'
import DefaultTimeAllDayEvent from './DefaultTimeAllDayEvent'
import DefaultTimeDayHeading from './DefaultTimeDayHeading'
import DefaultTimeShowMore from './DefaultTimeShowMore'
import type { TimeAllDaySegment, TimeColumn, TimeDayHeading, TimeGrid } from './useTimeGrid'

/** Resolved component slots used by the header section. */
export interface TimeGridHeaderComponents<TEvent> {
  DayHeading: ComponentType<TimeDayHeadingProps>
  AllDayEvent: ComponentType<TimeAllDayEventProps<TEvent>>
  ShowMore: ComponentType<TimeShowMoreProps<TEvent>>
}

/** Callback ref accepted by roving hooks. */
type CallbackRef = (node: HTMLElement | null) => void

/** Element-spread props for the `.bc-allday-row` in the plain (non-resource) path. */
export interface TimeGridAllDayRowProps {
  ref: CallbackRef
  onPointerDown: (e: PointerEvent<HTMLDivElement>) => void
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void
  onFocusCapture: (e: FocusEvent<HTMLDivElement>) => void
}

/** Element-spread props for the `.bc-allday-row` in the resource/day-major paths. */
export interface TimeGridResourceAllDayRowProps {
  onPointerDown: (e: PointerEvent<HTMLDivElement>) => void
}

/** Element-spread props for a plain-path allday slot (with roving `tabIndex`). */
export interface TimeGridAllDaySlotProps {
  className: string
  'data-date': string
  'data-bc-allday': string
  'data-slot-index': number
  tabIndex: number
  'aria-describedby': string
}

/** Element-spread props for a resource-path allday slot (no `tabIndex`). */
export interface TimeGridResourceAllDaySlotProps {
  className: string
  'data-date': string
  'data-bc-allday': string
  'data-slot-index': number
  'aria-describedby': string
}

/** Props for an `EventButton` in the allday segments area. */
export interface TimeGridAllDaySegmentProps<TEvent> {
  className: string
  style: CSSProperties
  event: TEvent
  title: string
}

/** Props for a stacked `EventButton` (single-day resource cell, no geometry style). */
export interface TimeGridStackedSegmentProps<TEvent> {
  className: string
  event: TEvent
  title: string
}

/** Return value of {@link useTimeGridHeader}. */
export interface UseTimeGridHeaderReturn<TEvent> {
  /** Resolved component slots for the header section. */
  components: TimeGridHeaderComponents<TEvent>
  /** Resolved UI strings used in the header. */
  messages: { allDay: string; showMore: (count: number) => string }
  /** `aria-describedby` id for allday slot hit-targets. */
  allDayDescribedBy: string
  /** Dispatch a drill-down to the given day. */
  drilldown: (date: string) => void
  /**
   * Element-spread props for the plain-path `.bc-allday-row` (includes roving
   * `ref`, `onKeyDown`, and `onFocusCapture`).
   */
  allDayRow: TimeGridAllDayRowProps
  /**
   * Element-spread props for the resource/day-major `.bc-allday-row` (only
   * `onPointerDown` — no roving in those layouts).
   */
  resourceAllDayRow: TimeGridResourceAllDayRowProps
  /**
   * Returns a `TimeDayHeading` enriched with `onDrillDown`. Spread its fields
   * directly onto `<DayHeading>`.
   */
  getHeadingProps: (heading: TimeDayHeading) => TimeDayHeading & { onDrillDown: () => void }
  /**
   * Returns element-spread props for a plain-path allday slot `<div>` (includes
   * roving `tabIndex`).
   */
  getAllDaySlotProps: (column: TimeColumn<TEvent>, colIndex: number) => TimeGridAllDaySlotProps
  /**
   * Returns element-spread props for a resource-path allday slot `<div>` (no
   * `tabIndex`). Also covers day-major per-cell allday slots.
   */
  getResourceAllDaySlotProps: (date: string, dayIndex: number, isToday?: boolean) => TimeGridResourceAllDaySlotProps
  /**
   * Rendered selection band for the plain-path allday row, or `null` when no
   * band is active. Spread onto the inner `<div>` inside `.bc-allday-selection`.
   */
  allDaySelectionBand: { className: string; style: CSSProperties } | null
  /**
   * Returns `EventButton` props for a placed allday segment (span layout). Does
   * not include `key` — pass `key={segment.key}` on the element itself.
   */
  getAllDaySegmentProps: (segment: TimeAllDaySegment<TEvent>) => TimeGridAllDaySegmentProps<TEvent>
  /**
   * Returns `EventButton` props for a stacked single-day allday segment (no
   * geometry style). Does not include `key`.
   */
  getStackedSegmentProps: (segment: TimeAllDaySegment<TEvent>) => TimeGridStackedSegmentProps<TEvent>
}

/**
 * Composes all logic for the header section of {@link TimeGridView}: day
 * heading resolution, allday-row pointer + keyboard interaction, slot selection,
 * roving focus, and the selection-band geometry. Pass the resolved
 * {@link TimeGrid} from {@link useTimeGrid} (or `null` outside a time-grid
 * view). Used directly by {@link useTimeGridView}.
 */
export function useTimeGridHeader<TEvent = unknown>(
  grid: TimeGrid<TEvent> | null,
): UseTimeGridHeaderReturn<TEvent> {
  const { store, components, messages, descriptionIds } = useCalendarContext<TEvent>()
  const onAllDayPointerDown = useSlotSelection('day')
  const selRange = useSignalValue(store.selection.range)
  const selAnchor = useSignalValue(store.selection.anchor)

  const dayCountSafe = grid?.columns.length ?? 0
  const allDayNeighbor = useCallback(
    (index: number, dir: Direction): number | null => {
      if (dir === 'left') return index > 0 ? index - 1 : null
      if (dir === 'right') return index + 1 < dayCountSafe ? index + 1 : null
      return null
    },
    [dayCountSafe],
  )
  const allDayRoving = useRovingSelection({
    mode: 'day',
    count: dayCountSafe,
    neighbor: allDayNeighbor,
  })

  // All-day selection band for the plain (non-resource) path.
  const dayCount = grid?.columns.length ?? 0
  const allDayActive = selRange !== null && selAnchor?.mode === 'day'
  const adStart = allDayActive ? Math.max(selRange.start, 0) : 0
  const adEnd = allDayActive ? Math.min(selRange.end, dayCount - 1) : -1
  const allDaySelection = allDayActive && adStart <= adEnd

  return {
    components: {
      DayHeading: components.time?.dayHeading ?? DefaultTimeDayHeading,
      AllDayEvent: (components.time?.allDayEvent ?? DefaultTimeAllDayEvent) as ComponentType<TimeAllDayEventProps<TEvent>>,
      ShowMore: (components.time?.showMore ?? DefaultTimeShowMore) as ComponentType<TimeShowMoreProps<TEvent>>,
    },
    messages: {
      allDay: messages.allDay,
      showMore: messages.showMore,
    },
    allDayDescribedBy: descriptionIds.selection,
    drilldown: (date: string) => store.drilldown({ date }),
    allDayRow: {
      ref: allDayRoving.containerRef,
      onPointerDown: onAllDayPointerDown,
      onKeyDown: allDayRoving.onKeyDown,
      onFocusCapture: allDayRoving.onFocusCapture,
    },
    resourceAllDayRow: {
      onPointerDown: onAllDayPointerDown,
    },
    getHeadingProps: (heading: TimeDayHeading) => ({
      ...heading,
      onDrillDown: () => store.drilldown({ date: heading.day }),
    }),
    getAllDaySlotProps: (column: TimeColumn<TEvent>, colIndex: number): TimeGridAllDaySlotProps => ({
      className: column.isToday ? 'bc-allday-slot bc-today' : 'bc-allday-slot',
      'data-date': column.day,
      'data-bc-allday': column.day,
      'data-slot-index': colIndex,
      tabIndex: allDayRoving.cellTabIndex(colIndex),
      'aria-describedby': descriptionIds.selection,
    }),
    getResourceAllDaySlotProps: (date: string, dayIndex: number, isToday = false): TimeGridResourceAllDaySlotProps => ({
      className: isToday ? 'bc-allday-slot bc-today' : 'bc-allday-slot',
      'data-date': date,
      'data-bc-allday': date,
      'data-slot-index': dayIndex,
      'aria-describedby': descriptionIds.selection,
    }),
    allDaySelectionBand: allDaySelection
      ? {
          className: 'bc-selection bc-selection-allday',
          style: segmentStyle({ left: adStart + 1, span: adEnd - adStart + 1, row: 1 }),
        }
      : null,
    getAllDaySegmentProps: (segment: TimeAllDaySegment<TEvent>): TimeGridAllDaySegmentProps<TEvent> => ({
      className: 'bc-segment',
      style: segmentStyle({ left: segment.left, span: segment.span, row: segment.row }),
      event: segment.event,
      title: segment.title,
    }),
    getStackedSegmentProps: (segment: TimeAllDaySegment<TEvent>): TimeGridStackedSegmentProps<TEvent> => ({
      className: 'bc-segment bc-segment-stacked',
      event: segment.event,
      title: segment.title,
    }),
  }
}
