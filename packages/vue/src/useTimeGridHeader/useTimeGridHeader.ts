import type { ShallowRef } from 'vue'
import type { Component } from 'vue'
import { computed } from 'vue'
import { useCalendarContext } from '../CalendarProvider'
import { segmentStyle } from '../internal/geometryStyles'
import { useRovingSelection } from '../internal/useRovingSelection'
import type { Direction } from '../internal/useRovingSelection'
import { useSlotSelection } from '../internal/useSlotSelection'
import { useSignalRef } from '../internal/useSignalRef'
import DefaultTimeDayHeading from '../DefaultTimeDayHeading/DefaultTimeDayHeading.vue'
import DefaultTimeAllDayEvent from '../DefaultTimeAllDayEvent/DefaultTimeAllDayEvent.vue'
import DefaultTimeShowMore from '../DefaultTimeShowMore/DefaultTimeShowMore.vue'
import type { TimeAllDaySegment, TimeColumn, TimeDayHeading, TimeGrid } from '../useTimeGrid'

/** Element-spread props for the `.bc-time-head` outer header container. */
export interface TimeGridTimeHeadProps {
  class: string
}

/** Element-spread props for the `.bc-time-header` inner header. */
export interface TimeGridTimeHeaderProps {
  class: string
}

/** Element-spread props for the `.bc-time-header-gutter` spacer. */
export interface TimeGridTimeHeaderGutterProps {
  class: string
  'aria-hidden': boolean
  style?: Record<string, string>
}

/** Element-spread props for the `.bc-allday-label` text container. */
export interface TimeGridAllDayLabelProps {
  class: string
}

/** Element-spread props for the `.bc-allday-slots` container (plain path). */
export interface TimeGridAllDaySlotsProps {
  class: string
}

/** Element-spread props for the `.bc-allday-segments` container (plain path). */
export interface TimeGridAllDaySegmentsProps {
  class: string
  'data-bc-allday-segments': ''
}

/** Element-spread props for a `.bc-resource-header-label` `<span>`. */
export interface TimeGridResourceHeaderLabelProps {
  class: string
}

/** Element-spread props for the plain-path `.bc-allday-row`. */
export interface TimeGridAllDayRowProps {
  class: string
  ref: ShallowRef<HTMLElement | null>
  onPointerdown: (e: PointerEvent) => void
  onKeydown: (e: KeyboardEvent) => void
  onFocusCapture: (e: FocusEvent) => void
}

/** Element-spread props for the resource/day-major `.bc-allday-row`. */
export interface TimeGridResourceAllDayRowProps {
  class: string
  onPointerdown: (e: PointerEvent) => void
}

/** Element-spread props for a plain-path allday slot `<div>`. */
export interface TimeGridAllDaySlotProps {
  class: string
  'data-date': string
  'data-bc-allday': string
  'data-slot-index': number
  tabIndex: number
  'aria-describedby': string
}

/** Element-spread props for a resource-path allday slot `<div>`. */
export interface TimeGridResourceAllDaySlotProps {
  class: string
  'data-date': string
  'data-bc-allday': string
  'data-slot-index': number
  'aria-describedby': string
}

/** Props for an `EventButton` in the allday segments area. */
export interface TimeGridAllDaySegmentProps<TEvent> {
  class: string
  style: Record<string, string>
  event: TEvent
  title: string
}

/** Props for a stacked `EventButton` (single-day resource cell). */
export interface TimeGridStackedSegmentProps<TEvent> {
  class: string
  event: TEvent
  title: string
}

/** Resolved component slots for the header section. */
export interface TimeGridHeaderComponents {
  DayHeading: Component
  AllDayEvent: Component
  ShowMore: Component
}

/** Return value of {@link useTimeGridHeader}. */
export interface UseTimeGridHeaderReturn<TEvent> {
  /** Resolved component slots (defaults merged with `components.time` overrides). */
  components: TimeGridHeaderComponents
  /** Resolved UI strings for the header section. */
  messages: { allDay: string; showMore: (count: number) => string }
  /** `aria-describedby` id for allday slot hit-targets. */
  allDayDescribedBy: string
  /** Dispatch a drill-down to the given day. */
  drilldown: (date: string) => void
  /** Element-spread props for the `.bc-time-head` outer header container. */
  timeHead: TimeGridTimeHeadProps
  /** Element-spread props for the `.bc-time-header` inner header. */
  timeHeader: TimeGridTimeHeaderProps
  /** Element-spread props for the `.bc-time-header-gutter` spacer. */
  timeHeaderGutter: TimeGridTimeHeaderGutterProps
  /** Element-spread props for the `.bc-allday-label` text container. */
  allDayLabel: TimeGridAllDayLabelProps
  /** Element-spread props for the `.bc-allday-slots` container (plain path). */
  allDaySlots: TimeGridAllDaySlotsProps
  /** Element-spread props for the `.bc-allday-segments` container (plain path). */
  allDaySegments: TimeGridAllDaySegmentsProps
  /** Element-spread props for a `.bc-resource-header-label` `<span>`. */
  resourceHeaderLabel: TimeGridResourceHeaderLabelProps
  /** Element-spread props for the plain-path `.bc-allday-row`. */
  allDayRow: TimeGridAllDayRowProps
  /** Element-spread props for the resource/day-major `.bc-allday-row`. */
  resourceAllDayRow: TimeGridResourceAllDayRowProps
  /** Returns a `TimeDayHeading` enriched with `onDrillDown`. */
  getHeadingProps: (heading: TimeDayHeading) => TimeDayHeading & { onDrillDown: () => void }
  /** Returns element-spread props for a plain-path allday slot. */
  getAllDaySlotProps: (column: TimeColumn<TEvent>, colIndex: number) => TimeGridAllDaySlotProps
  /** Returns element-spread props for a resource-path allday slot. */
  getResourceAllDaySlotProps: (date: string, dayIndex: number, isToday?: boolean) => TimeGridResourceAllDaySlotProps
  /** Returns `EventButton` props for a placed allday segment (span layout). */
  getAllDaySegmentProps: (segment: TimeAllDaySegment<TEvent>) => TimeGridAllDaySegmentProps<TEvent>
  /** Returns `EventButton` props for a stacked single-day allday segment. */
  getStackedSegmentProps: (segment: TimeAllDaySegment<TEvent>) => TimeGridStackedSegmentProps<TEvent>
  /** Rendered selection band for the plain-path allday row, or `null`. */
  allDaySelectionBand: { class: string; style: Record<string, string> } | null
}

/**
 * Header-section composable for `<TimeGridView>`. Wires a11y roving and
 * all-day slot selection for the allday row.
 */
export function useTimeGridHeader<TEvent = unknown>(
  grid: TimeGrid<TEvent> | null,
): UseTimeGridHeaderReturn<TEvent> {
  const { store, components: ctxComponents, messages, descriptionIds } = useCalendarContext<TEvent>()
  const selRange = useSignalRef(store.selection.range)
  const selAnchor = useSignalRef(store.selection.anchor)
  const time = ctxComponents.time ?? {}

  const dayCountSafe = grid?.columns.length ?? 0

  const allDayCount = computed(() => dayCountSafe)

  const allDayNeighbor = (index: number, dir: Direction): number | null => {
    if (dir === 'left') return index > 0 ? index - 1 : null
    if (dir === 'right') return index + 1 < dayCountSafe ? index + 1 : null
    return null
  }

  const allDayRoving = useRovingSelection({ mode: 'day', count: allDayCount, neighbor: allDayNeighbor })
  const onAllDayPointerDown = useSlotSelection('day')

  const isDayMajor = grid !== null && grid.dayGroups !== null
  const isResourceWeek = grid !== null && grid.resources !== null && grid.headings.length > 1
  const isTiered = isDayMajor || isResourceWeek

  return {
    components: {
      DayHeading: (time.dayHeading ?? DefaultTimeDayHeading) as Component,
      AllDayEvent: (time.allDayEvent ?? DefaultTimeAllDayEvent) as Component,
      ShowMore: (time.showMore ?? DefaultTimeShowMore) as Component,
    },
    messages: { allDay: messages.allDay, showMore: messages.showMore },
    allDayDescribedBy: descriptionIds.selection,
    drilldown: (date: string) => store.drilldown({ date }),
    timeHead: { class: 'bc-time-head' },
    timeHeader: {
      class: isTiered ? 'bc-time-header bc-time-header-tiered' : 'bc-time-header',
    },
    timeHeaderGutter: isTiered
      ? { class: 'bc-time-header-gutter', 'aria-hidden': true, style: { gridRow: '1 / 3' } }
      : { class: 'bc-time-header-gutter', 'aria-hidden': true },
    allDayLabel: { class: 'bc-allday-label' },
    allDaySlots: { class: 'bc-allday-slots' },
    allDaySegments: { class: 'bc-allday-segments', 'data-bc-allday-segments': '' as const },
    resourceHeaderLabel: { class: 'bc-resource-header-label' },
    allDayRow: {
      class: 'bc-allday-row',
      ref: allDayRoving.containerRef,
      onPointerdown: onAllDayPointerDown,
      onKeydown: allDayRoving.onKeydown,
      onFocusCapture: allDayRoving.onFocusCapture,
    },
    resourceAllDayRow: {
      class: 'bc-allday-row',
      onPointerdown: onAllDayPointerDown,
    },
    getHeadingProps: (heading: TimeDayHeading) => ({
      ...heading,
      onDrillDown: () => store.drilldown({ date: heading.day }),
    }),
    getAllDaySlotProps: (column: TimeColumn<TEvent>, colIndex: number): TimeGridAllDaySlotProps => ({
      class: column.isToday ? 'bc-allday-slot bc-today' : 'bc-allday-slot',
      'data-date': column.day,
      'data-bc-allday': column.day,
      'data-slot-index': colIndex,
      tabIndex: allDayRoving.cellTabIndex(colIndex),
      'aria-describedby': descriptionIds.selection,
    }),
    getResourceAllDaySlotProps: (date: string, dayIndex: number, isToday = false): TimeGridResourceAllDaySlotProps => ({
      class: isToday ? 'bc-allday-slot bc-today' : 'bc-allday-slot',
      'data-date': date,
      'data-bc-allday': date,
      'data-slot-index': dayIndex,
      'aria-describedby': descriptionIds.selection,
    }),
    get allDaySelectionBand() {
      const range = selRange.value
      const anchor = selAnchor.value
      if (range === null || anchor?.mode !== 'day') return null
      const adStart = Math.max(range.start, 0)
      const adEnd = Math.min(range.end, dayCountSafe - 1)
      if (adStart > adEnd) return null
      return {
        class: 'bc-selection bc-selection-allday',
        style: segmentStyle({ left: adStart + 1, span: adEnd - adStart + 1, row: 1 }) as Record<string, string>,
      }
    },
    getAllDaySegmentProps: (segment: TimeAllDaySegment<TEvent>): TimeGridAllDaySegmentProps<TEvent> => ({
      class: 'bc-segment',
      style: segmentStyle({ left: segment.left, span: segment.span, row: segment.row }) as Record<string, string>,
      event: segment.event,
      title: segment.title,
    }),
    getStackedSegmentProps: (segment: TimeAllDaySegment<TEvent>): TimeGridStackedSegmentProps<TEvent> => ({
      class: 'bc-segment bc-segment-stacked',
      event: segment.event,
      title: segment.title,
    }),
  }
}
