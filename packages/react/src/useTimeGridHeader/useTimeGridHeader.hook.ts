import type { ComponentType, CSSProperties, FocusEvent, KeyboardEvent, PointerEvent } from 'react'
import { useCallback } from 'react'
import { useCalendarContext } from '../CalendarProvider'
import type {
  TimeAllDayEventProps,
  TimeDayHeadingProps,
  TimeShowMoreProps,
} from '../components.type'
import { segmentStyle } from '../geometryStyles'
import { useRovingSelection } from '../useRovingSelection'
import type { Direction } from '../useRovingSelection'
import { useSignalValue } from '../internal/useSignalValue'
import { useSlotSelection } from '../useSlotSelection'
import DefaultTimeAllDayEvent from '../DefaultTimeAllDayEvent'
import DefaultTimeDayHeading from '../DefaultTimeDayHeading'
import DefaultTimeShowMore from '../DefaultTimeShowMore'
import type { TimeAllDaySegment, TimeColumn, TimeDayHeading, TimeGrid } from '../useTimeGrid'

/** Resolved component slots used by the header section. */
export interface TimeGridHeaderComponents<TEvent> {
  DayHeading: ComponentType<TimeDayHeadingProps>
  AllDayEvent: ComponentType<TimeAllDayEventProps<TEvent>>
  ShowMore: ComponentType<TimeShowMoreProps<TEvent>>
}

/** Callback ref accepted by roving hooks. */
type CallbackRef = (node: HTMLElement | null) => void

/** Element-spread props for the `.bc-time-head` outer header `<div>`. */
export interface TimeGridTimeHeadProps {
  className: string
}

/** Element-spread props for the `.bc-time-header` inner header `<div>`. */
export interface TimeGridTimeHeaderProps {
  className: string
}

/** Element-spread props for the `.bc-time-header-gutter` spacer `<div>`. */
export interface TimeGridTimeHeaderGutterProps {
  className: string
  'aria-hidden': boolean
  style?: CSSProperties
}

/** Element-spread props for the `.bc-allday-label` text `<div>`. */
export interface TimeGridAllDayLabelProps {
  className: string
}

/** Element-spread props for the `.bc-allday-slots` slot container (plain path). */
export interface TimeGridAllDaySlotsProps {
  className: string
}

/** Element-spread props for the `.bc-allday-segments` segment container (plain path). */
export interface TimeGridAllDaySegmentsProps {
  className: string
  'data-bc-allday-segments': ''
}

/** Element-spread props for the `.bc-allday-selection` selection wrapper (plain path). */
export interface TimeGridAllDaySelectionWrapperProps {
  className: string
}

/** Element-spread props for a `.bc-resource-header-label` `<span>` inside a resource cell. */
export interface TimeGridResourceHeaderLabelProps {
  className: string
}

/** Element-spread props for a `.bc-allday-resource-stack` `<div>` inside a resource allday cell. */
export interface TimeGridAllDayResourceStackProps {
  className: string
  'data-bc-allday-segments': ''
}

/** Element-spread props for a single-day resource column header `<div>`. */
export interface TimeGridResourceSingleHeadProps {
  className: string
  role: 'columnheader'
}

/** Element-spread props for the `.bc-allday-row` in the plain (non-resource) path. */
export interface TimeGridAllDayRowProps {
  className: string
  ref: CallbackRef
  onPointerDown: (e: PointerEvent<HTMLDivElement>) => void
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void
  onFocusCapture: (e: FocusEvent<HTMLDivElement>) => void
}

/** Element-spread props for the `.bc-allday-row` in the resource/day-major paths. */
export interface TimeGridResourceAllDayRowProps {
  className: string
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

/** Factory return props for a day-major day-group heading cell. */
export interface TimeGridDayMajorHeadingCellProps {
  className: string
  role: 'columnheader'
  style: CSSProperties
}

/** Factory return props for a day-major per-resource cell below a day heading. */
export interface TimeGridDayMajorResourceCellProps {
  className: string
  style: CSSProperties
}

/** Factory return props for a day-major allday resource cell. */
export interface TimeGridDayMajorAllDayResourceProps {
  className: string
  'data-bc-resource': string
}

/** Factory return props for a resource-week group title header cell. */
export interface TimeGridResourceGroupTitleProps {
  className: string
  role: 'columnheader'
  style: CSSProperties
}

/** Factory return props for a resource-week per-column day sub-heading. */
export interface TimeGridResourceDayHeadProps {
  className: string
  style: CSSProperties
}

/** Factory return props for a resource-week allday cell. */
export interface TimeGridResourceWeekAllDayProps {
  className: string
  'data-bc-resource': string
  style: CSSProperties
}

/** Factory return props for the slots container inside a resource-week allday cell. */
export interface TimeGridResourceWeekAllDaySlotsContainerProps {
  className: string
  style: CSSProperties
}

/** Factory return props for the segments container inside a resource-week allday cell. */
export interface TimeGridResourceWeekAllDaySegmentsContainerProps {
  className: string
  style: CSSProperties
  'data-bc-allday-segments': ''
}

/** Factory return props for a resource-day (single-column) allday cell. */
export interface TimeGridResourceDayAllDayProps {
  className: string
  'data-bc-resource': string
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
  /** Element-spread props for the `.bc-time-head` outer header container `<div>`. */
  timeHead: TimeGridTimeHeadProps
  /**
   * Element-spread props for the `.bc-time-header` inner header `<div>`.
   * `className` encodes the tiered variant (`bc-time-header-tiered`) for
   * resource-week and day-major layouts — do not set an additional class.
   */
  timeHeader: TimeGridTimeHeaderProps
  /**
   * Element-spread props for the `.bc-time-header-gutter` spacer `<div>`.
   * `style` includes `{ gridRow: '1 / 3' }` in tiered (resource-week / day-major)
   * layouts and is omitted in plain and resource-day layouts.
   */
  timeHeaderGutter: TimeGridTimeHeaderGutterProps
  /** Element-spread props for the `.bc-allday-label` text container. */
  allDayLabel: TimeGridAllDayLabelProps
  /** Element-spread props for the `.bc-allday-slots` container (plain path). */
  allDaySlots: TimeGridAllDaySlotsProps
  /** Element-spread props for the `.bc-allday-segments` container (plain path). */
  allDaySegments: TimeGridAllDaySegmentsProps
  /** Element-spread props for the `.bc-allday-selection` wrapper (plain path). */
  allDaySelectionWrapper: TimeGridAllDaySelectionWrapperProps
  /** Element-spread props for a `.bc-resource-header-label` `<span>`. */
  resourceHeaderLabel: TimeGridResourceHeaderLabelProps
  /** Element-spread props for a `.bc-allday-resource-stack` container. */
  allDayResourceStack: TimeGridAllDayResourceStackProps
  /** Element-spread props for a single-day resource column header (resource-day path). */
  resourceSingleHead: TimeGridResourceSingleHeadProps
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
  /**
   * Returns element-spread props for a day-major group heading cell `<div>`.
   * Call with the day-group index `di`. Captures `numResources` from the grid.
   */
  getDayMajorHeadingCellProps: (di: number) => TimeGridDayMajorHeadingCellProps
  /**
   * Returns element-spread props for a day-major per-resource sub-cell `<div>`.
   * Call with the day-group index `di` and resource index `ri` within the group.
   */
  getDayMajorResourceCellProps: (di: number, ri: number) => TimeGridDayMajorResourceCellProps
  /**
   * Returns element-spread props for a day-major allday resource `<div>`.
   * Pass `isToday` from the day-group and the cell's `resourceId`.
   */
  getDayMajorAllDayResourceProps: (isToday: boolean, resourceId: string | number) => TimeGridDayMajorAllDayResourceProps
  /**
   * Returns element-spread props for a resource-week group title header `<div>`.
   * Call with the group index `gi`. Captures `daysPerGroup` and `colStartOf` from the grid.
   */
  getResourceGroupTitleProps: (gi: number) => TimeGridResourceGroupTitleProps
  /**
   * Returns element-spread props for a resource-week per-column day sub-heading `<div>`.
   * Call with the group index `gi` and the day index `di` within the group.
   */
  getResourceDayHeadProps: (gi: number, di: number) => TimeGridResourceDayHeadProps
  /**
   * Returns element-spread props for a resource-week allday cell `<div>`.
   * Call with the group index `gi` and the group's `resourceId`.
   */
  getResourceWeekAllDayProps: (gi: number, resourceId: string | number) => TimeGridResourceWeekAllDayProps
  /**
   * Returns element-spread props for the slot container inside a resource-week
   * allday cell. `gridTemplateColumns` is captured from the grid's `daysPerGroup`.
   */
  getResourceWeekAllDaySlotsContainerProps: () => TimeGridResourceWeekAllDaySlotsContainerProps
  /**
   * Returns element-spread props for the segment container inside a resource-week
   * allday cell. `gridTemplateColumns` is captured from the grid's `daysPerGroup`.
   */
  getResourceWeekAllDaySegmentsContainerProps: () => TimeGridResourceWeekAllDaySegmentsContainerProps
  /**
   * Returns element-spread props for a resource-day (single-column) allday cell `<div>`.
   * Pass `isToday` from the group's single column and the group's `resourceId`.
   */
  getResourceDayAllDayProps: (isToday: boolean, resourceId: string | number) => TimeGridResourceDayAllDayProps
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

  // Layout variant flags — determines tiered header and gutter style.
  const isDayMajor = grid !== null && grid.dayGroups !== null
  const isResourceWeek = grid !== null && grid.resources !== null && grid.headings.length > 1
  const isTiered = isDayMajor || isResourceWeek

  // Pre-computed grid geometry captured in factory closures.
  const numResources = grid?.dayGroups?.[0]?.cells.length ?? 0
  const colStartOfDay = (di: number): number => 2 + di * numResources

  const daysPerGroup = grid?.headings.length ?? 0
  const dayCols = `repeat(${daysPerGroup}, minmax(0, 1fr))`
  const colStartOf = (gi: number): number => 2 + gi * daysPerGroup

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
    timeHead: { className: 'bc-time-head' },
    timeHeader: {
      className: isTiered ? 'bc-time-header bc-time-header-tiered' : 'bc-time-header',
    },
    timeHeaderGutter: isTiered
      ? { className: 'bc-time-header-gutter', 'aria-hidden': true, style: { gridRow: '1 / 3' } }
      : { className: 'bc-time-header-gutter', 'aria-hidden': true },
    allDayLabel: { className: 'bc-allday-label' },
    allDaySlots: { className: 'bc-allday-slots' },
    allDaySegments: { className: 'bc-allday-segments', 'data-bc-allday-segments': '' as const },
    allDaySelectionWrapper: { className: 'bc-allday-selection' },
    resourceHeaderLabel: { className: 'bc-resource-header-label' },
    allDayResourceStack: { className: 'bc-allday-resource-stack', 'data-bc-allday-segments': '' as const },
    resourceSingleHead: { className: 'bc-header bc-resource-header', role: 'columnheader' },
    allDayRow: {
      className: store.showAllEvents ? 'bc-allday-row bc-show-all-events' : 'bc-allday-row',
      ref: allDayRoving.containerRef,
      onPointerDown: onAllDayPointerDown,
      onKeyDown: allDayRoving.onKeyDown,
      onFocusCapture: allDayRoving.onFocusCapture,
    },
    resourceAllDayRow: {
      className: store.showAllEvents ? 'bc-allday-row bc-show-all-events' : 'bc-allday-row',
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
    getDayMajorHeadingCellProps: (di: number): TimeGridDayMajorHeadingCellProps => ({
      className: 'bc-header bc-day-major-header',
      role: 'columnheader',
      style: { gridColumn: `${colStartOfDay(di)} / span ${numResources}`, gridRow: 1 },
    }),
    getDayMajorResourceCellProps: (di: number, ri: number): TimeGridDayMajorResourceCellProps => ({
      className: 'bc-resource-day-head',
      style: { gridColumn: colStartOfDay(di) + ri, gridRow: 2 },
    }),
    getDayMajorAllDayResourceProps: (isToday: boolean, resourceId: string | number): TimeGridDayMajorAllDayResourceProps => ({
      className: isToday ? 'bc-allday-resource bc-today' : 'bc-allday-resource',
      'data-bc-resource': String(resourceId),
    }),
    getResourceGroupTitleProps: (gi: number): TimeGridResourceGroupTitleProps => ({
      className: 'bc-header bc-resource-header',
      role: 'columnheader',
      style: { gridColumn: `${colStartOf(gi)} / span ${daysPerGroup}`, gridRow: 1 },
    }),
    getResourceDayHeadProps: (gi: number, di: number): TimeGridResourceDayHeadProps => ({
      className: 'bc-resource-day-head',
      style: { gridColumn: colStartOf(gi) + di, gridRow: 2 },
    }),
    getResourceWeekAllDayProps: (gi: number, resourceId: string | number): TimeGridResourceWeekAllDayProps => ({
      className: 'bc-allday-resource bc-allday-resource-week',
      'data-bc-resource': String(resourceId),
      style: { gridColumn: `${colStartOf(gi)} / span ${daysPerGroup}`, gridRow: 1 },
    }),
    getResourceWeekAllDaySlotsContainerProps: (): TimeGridResourceWeekAllDaySlotsContainerProps => ({
      className: 'bc-allday-resource-slots',
      style: { gridTemplateColumns: dayCols },
    }),
    getResourceWeekAllDaySegmentsContainerProps: (): TimeGridResourceWeekAllDaySegmentsContainerProps => ({
      className: 'bc-allday-resource-segments',
      style: { gridTemplateColumns: dayCols },
      'data-bc-allday-segments': '',
    }),
    getResourceDayAllDayProps: (isToday: boolean, resourceId: string | number): TimeGridResourceDayAllDayProps => ({
      className: isToday ? 'bc-allday-resource bc-today' : 'bc-allday-resource',
      'data-bc-resource': String(resourceId),
    }),
  }
}
