import type { Component } from 'svelte'
import DefaultTimeDayHeading from '../DefaultTimeDayHeading/DefaultTimeDayHeading.svelte'
import DefaultTimeAllDayEvent from '../DefaultTimeAllDayEvent/DefaultTimeAllDayEvent.svelte'
import DefaultTimeShowMore from '../DefaultTimeShowMore/DefaultTimeShowMore.svelte'
import { useCalendarContext } from '../CalendarProvider'
import { segmentStyle } from '../internal/geometryStyles'
import { toStyle } from '../internal/toStyle'
import { useRovingSelection } from '../internal/useRovingSelection.svelte'
import type { Direction } from '../internal/useRovingSelection.svelte'
import { useSlotSelection } from '../internal/useSlotSelection.svelte'
import { fromSignal } from '../internal/fromSignal.svelte'
import type {
  TimeAllDaySegment,
  TimeColumn,
  TimeDayHeading,
  TimeGrid,
} from '../useTimeGrid'

export interface TimeGridHeaderComponents {
  DayHeading: Component
  AllDayEvent: Component
  ShowMore: Component
}

export interface TimeGridAllDaySlotProps {
  class: string
  'data-date': string
  'data-bc-allday': string
  'data-slot-index': number
  tabIndex: number
  'aria-describedby': string
}

export interface TimeGridResourceAllDaySlotProps {
  class: string
  'data-date': string
  'data-bc-allday': string
  'data-slot-index': number
  'aria-describedby': string
}

export interface TimeGridAllDaySegmentProps<TEvent> {
  class: string
  style: string
  event: TEvent
  title: string
}

export interface TimeGridStackedSegmentProps<TEvent> {
  class: string
  event: TEvent
  title: string
}

export interface UseTimeGridHeaderReturn<TEvent> {
  components: TimeGridHeaderComponents
  messages: { allDay: string; showMore: (count: number) => string }
  allDayDescribedBy: string
  drilldown: (date: string) => void
  timeHead: { class: string }
  timeHeader: () => { class: string }
  timeHeaderGutter: () => { class: string; 'aria-hidden': boolean; style?: string }
  allDayLabel: { class: string }
  allDaySlots: { class: string }
  allDaySegments: { class: string; 'data-bc-allday-segments': '' }
  resourceHeaderLabel: { class: string }
  allDayRowClass: string
  resourceAllDayRowClass: string
  onAllDayPointerdown: (e: PointerEvent) => void
  onAllDayKeydown: (e: KeyboardEvent) => void
  onAllDayFocusCapture: (e: FocusEvent) => void
  getHeadingProps: (heading: TimeDayHeading) => TimeDayHeading & { onDrillDown: () => void }
  getAllDaySlotProps: (column: TimeColumn<TEvent>, colIndex: number) => TimeGridAllDaySlotProps
  getResourceAllDaySlotProps: (date: string, dayIndex: number, isToday?: boolean) => TimeGridResourceAllDaySlotProps
  getAllDaySegmentProps: (segment: TimeAllDaySegment<TEvent>) => TimeGridAllDaySegmentProps<TEvent>
  getStackedSegmentProps: (segment: TimeAllDaySegment<TEvent>) => TimeGridStackedSegmentProps<TEvent>
  getAllDaySelectionBand: () => { class: string; style: string } | null
}

/**
 * Svelte 5 port of the Vue `useTimeGridHeader` composable.
 *
 * @param getGrid - Reactive getter for the resolved TimeGrid (or null).
 * @param getAllDayRowEl - Reactive getter for the allDay row element.
 */
export function useTimeGridHeader<TEvent = unknown>(
  getGrid: () => TimeGrid<TEvent> | null,
  getAllDayRowEl: () => HTMLElement | null,
): UseTimeGridHeaderReturn<TEvent> {
  const { store, components: ctxComponents, messages, descriptionIds } = useCalendarContext<TEvent>()
  const selRange = fromSignal(store.selection.range)
  const selAnchor = fromSignal(store.selection.anchor)
  const time = ctxComponents.time ?? {}

  const dayCountSafe = $derived(getGrid()?.columns.length ?? 0)

  const allDayNeighbor = (index: number, dir: Direction): number | null => {
    const count = dayCountSafe
    if (dir === 'left') return index > 0 ? index - 1 : null
    if (dir === 'right') return index + 1 < count ? index + 1 : null
    return null
  }

  const allDayRoving = useRovingSelection({
    mode: 'day',
    getContainer: getAllDayRowEl,
    getCount: () => dayCountSafe,
    neighbor: allDayNeighbor,
  })
  const onAllDayPointerdown = useSlotSelection('day')

  const isTiered = $derived.by((): boolean => {
    const grid = getGrid()
    if (!grid) return false
    return grid.dayGroups !== null || (grid.resources !== null && grid.headings.length > 1)
  })

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
    timeHeader: () => ({
      class: isTiered ? 'bc-time-header bc-time-header-tiered' : 'bc-time-header',
    }),
    timeHeaderGutter: () => isTiered
      ? { class: 'bc-time-header-gutter', 'aria-hidden': true as const, style: 'grid-row: 1 / 3' }
      : { class: 'bc-time-header-gutter', 'aria-hidden': true as const },
    allDayLabel: { class: 'bc-allday-label' },
    allDaySlots: { class: 'bc-allday-slots' },
    allDaySegments: { class: 'bc-allday-segments', 'data-bc-allday-segments': '' as const },
    resourceHeaderLabel: { class: 'bc-resource-header-label' },
    allDayRowClass: 'bc-allday-row',
    resourceAllDayRowClass: 'bc-allday-row',
    onAllDayPointerdown,
    onAllDayKeydown: allDayRoving.onKeydown,
    onAllDayFocusCapture: allDayRoving.onFocusCapture,
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
    getAllDaySegmentProps: (segment: TimeAllDaySegment<TEvent>): TimeGridAllDaySegmentProps<TEvent> => ({
      class: 'bc-segment',
      style: toStyle(segmentStyle({ left: segment.left, span: segment.span, row: segment.row }) as Record<string, string>),
      event: segment.event,
      title: segment.title,
    }),
    getStackedSegmentProps: (segment: TimeAllDaySegment<TEvent>): TimeGridStackedSegmentProps<TEvent> => ({
      class: 'bc-segment bc-segment-stacked',
      event: segment.event,
      title: segment.title,
    }),
    getAllDaySelectionBand: () => {
      const range = selRange.current
      const anchor = selAnchor.current
      const count = dayCountSafe
      if (range === null || anchor?.mode !== 'day') return null
      const adStart = Math.max(range.start, 0)
      const adEnd = Math.min(range.end, count - 1)
      if (adStart > adEnd) return null
      return {
        class: 'bc-selection bc-selection-allday',
        style: toStyle(segmentStyle({ left: adStart + 1, span: adEnd - adStart + 1, row: 1 }) as Record<string, string>),
      }
    },
  }
}
