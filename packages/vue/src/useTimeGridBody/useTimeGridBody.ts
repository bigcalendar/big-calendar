import type { ResizeEdge, ResourceId } from '@big-calendar/core'
import type { Component, ShallowRef } from 'vue'
import { computed } from 'vue'
import { useCalendarContext } from '../CalendarProvider'
import DefaultBackgroundEvent from '../DefaultBackgroundEvent/DefaultBackgroundEvent.vue'
import DefaultTimeEvent from '../DefaultTimeEvent/DefaultTimeEvent.vue'
import DefaultTimeLabel from '../DefaultTimeLabel/DefaultTimeLabel.vue'
import {
  eventBoxStyle,
  nowIndicatorStyle,
  selectionStyle,
  slotCountStyle,
} from '../internal/geometryStyles'
import { useRovingSelection } from '../internal/useRovingSelection'
import type { Direction } from '../internal/useRovingSelection'
import { useSlotSelection } from '../internal/useSlotSelection'
import { useSignalRef } from '../internal/useSignalRef'
import type {
  TimeBackgroundEvent,
  TimeColumn,
  TimeGrid,
  TimePositionedEvent,
} from '../useTimeGrid'

/** Element-spread props for the plain-path `.bc-time-body`. */
export interface TimeGridBodyRootProps {
  class: string
  style: Record<string, string>
  ref: ShallowRef<HTMLElement | null>
  onPointerdown: (e: PointerEvent) => void
  onKeydown: (e: KeyboardEvent) => void
  onFocusCapture: (e: FocusEvent) => void
}

/** Element-spread props for the resource/day-major `.bc-time-body`. */
export interface TimeGridResourceBodyRootProps {
  class: string
  style: Record<string, string>
  onPointerdown: (e: PointerEvent) => void
}

/** Element-spread props for a `.bc-time-slot` in the plain path. */
export interface TimeGridSlotProps {
  class: string
  'data-date': string
  'data-slot-index': number
  'data-bc-instant': string
  tabIndex: number
  'aria-describedby': string
}

/** Element-spread props for a `.bc-time-slot` in resource/day-major paths. */
export interface TimeGridResourceSlotProps {
  class: string
  'data-date': string
  'data-slot-index': number
  'data-bc-instant': string
  'aria-describedby': string
}

/** Element-spread props for a `.bc-bg-event` background event `<div>`. */
export interface TimeGridBgEventProps {
  class: string
  style: Record<string, string>
}

/** Props for an `EventButton` timed event. */
export interface TimeGridEventButtonProps<TEvent> {
  class: string
  style: Record<string, string>
  event: TEvent
  title: string
  time: string
  resizeEdges: readonly ResizeEdge[]
}

/** Resolved component slots for the body section. */
export interface TimeGridBodyComponents {
  TimeLabel: Component
  EventSlot: Component
  BgEventSlot: Component
}

/** Return value of {@link useTimeGridBody}. */
export interface UseTimeGridBodyReturn<TEvent> {
  /** Resolved component slots (defaults merged with `components.time` overrides). */
  components: TimeGridBodyComponents
  /** `aria-describedby` id for slot hit-targets. */
  slotDescribedBy: string
  /** Element-spread props for the plain-path `.bc-time-body`. */
  body: TimeGridBodyRootProps
  /** Element-spread props for the resource/day-major `.bc-time-body`. */
  resourceBody: TimeGridResourceBodyRootProps
  /** Returns `{ class }` for a `.bc-day-column` wrapper `<div>`. */
  getColumnProps: (column: TimeColumn<TEvent>) => { class: string }
  /** Returns element-spread props for a plain-path `.bc-time-slot`. */
  getSlotProps: (column: TimeColumn<TEvent>, colIndex: number, slotIndex: number) => TimeGridSlotProps
  /** Returns element-spread props for a resource/day-major `.bc-time-slot`. */
  getResourceSlotProps: (date: string, slotIndex: number, instant: string) => TimeGridResourceSlotProps
  /** Returns `<div>` props for a `.bc-bg-event` background event. */
  getBgEventProps: (bg: TimeBackgroundEvent<TEvent>) => TimeGridBgEventProps
  /** Returns all `EventButton` props for a timed event. */
  getEventProps: (event: TimePositionedEvent<TEvent>) => TimeGridEventButtonProps<TEvent>
  /** Returns `<div>` props for the `.bc-now-indicator` line, or `null` when absent. */
  getNowIndicatorProps: (column: TimeColumn<TEvent>) => { class: string; style: Record<string, string> } | null
  /**
   * Now-indicator spanning the full body width (gutter + all day columns), or
   * `null` when today is not visible. (Stub: always `null` until 10-9.)
   */
  bodyNowIndicatorProps: { class: string; style: Record<string, string> } | null
  /** Element-spread props for the `.bc-time-gutter` time-label column. */
  gutter: { class: string }
  /** Element-spread props for the `.bc-time-slots` container inside each day column. */
  timeSlotsContainer: { class: string }
  /**
   * Returns element-spread props for the selection `<div>` in the plain time-
   * column path, or `null`.
   */
  getTimeSelectionDivProps: (colIndex: number) => { class: string; style: Record<string, string> } | null
  /**
   * Returns element-spread props for the selection `<div>` in the resource path,
   * or `null`.
   */
  getResourceSelectionDivProps: (resourceId: ResourceId, date: string) => { class: string; style: Record<string, string> } | null
  /**
   * Returns element-spread props for the drag-preview `<div>`, or `null`.
   * (Stub: always `null` until 10-9.)
   */
  getPreviewDivProps: (column: { min: string; max: string }) => { class: string; style: Record<string, string> } | null
}

const TIMED_RESIZE_EDGES: readonly ResizeEdge[] = ['start', 'end']

/**
 * Body-section composable for `<TimeGridView>`. Wires a11y roving and
 * slot selection for the timed body.
 */
export function useTimeGridBody<TEvent = unknown>(
  grid: TimeGrid<TEvent> | null,
): UseTimeGridBodyReturn<TEvent> {
  const { components: ctxComponents, descriptionIds } = useCalendarContext<TEvent>()
  const { store } = useCalendarContext<TEvent>()
  const selRange = useSignalRef(store.selection.range)
  const selAnchor = useSignalRef(store.selection.anchor)
  const time = ctxComponents.time ?? {}

  const slotCountSafe = grid?.slotCount ?? 0
  const dayCountSafe = grid?.columns.length ?? 0
  const timeCount = dayCountSafe * slotCountSafe

  const timeCountRef = computed(() => timeCount)

  const timeNeighbor = (index: number, dir: Direction): number | null => {
    if (slotCountSafe <= 0) return null
    const slot = index % slotCountSafe
    switch (dir) {
      case 'up': return slot > 0 ? index - 1 : null
      case 'down': return slot < slotCountSafe - 1 ? index + 1 : null
      case 'left': return index - slotCountSafe >= 0 ? index - slotCountSafe : null
      case 'right': return index + slotCountSafe < timeCount ? index + slotCountSafe : null
    }
  }

  const roving = useRovingSelection({
    mode: 'time',
    count: timeCountRef,
    slotCount: slotCountSafe,
    neighbor: timeNeighbor,
  })
  const onSlotPointerDown = useSlotSelection('time', slotCountSafe > 0 ? slotCountSafe : undefined)

  const bodyStyle = slotCountSafe > 0
    ? slotCountStyle(slotCountSafe) as Record<string, string>
    : {}

  return {
    components: {
      TimeLabel: (time.timeLabel ?? DefaultTimeLabel) as Component,
      EventSlot: (time.event ?? DefaultTimeEvent) as Component,
      BgEventSlot: (time.backgroundEvent ?? DefaultBackgroundEvent) as Component,
    },
    slotDescribedBy: descriptionIds.selection,
    body: {
      class: 'bc-time-body',
      style: bodyStyle,
      ref: roving.containerRef,
      onPointerdown: onSlotPointerDown,
      onKeydown: roving.onKeydown,
      onFocusCapture: roving.onFocusCapture,
    },
    resourceBody: {
      class: 'bc-time-body',
      style: bodyStyle,
      onPointerdown: onSlotPointerDown,
    },
    getColumnProps: (column: TimeColumn<TEvent>) => ({
      class: column.isToday ? 'bc-day-column bc-today' : 'bc-day-column',
    }),
    getSlotProps: (column: TimeColumn<TEvent>, colIndex: number, slotIndex: number): TimeGridSlotProps => {
      const globalIndex = colIndex * slotCountSafe + slotIndex
      return {
        class: 'bc-time-slot',
        'data-date': column.day,
        'data-slot-index': globalIndex,
        'data-bc-instant': column.slots[slotIndex] ?? '',
        tabIndex: roving.cellTabIndex(globalIndex),
        'aria-describedby': descriptionIds.selection,
      }
    },
    getResourceSlotProps: (date: string, slotIndex: number, instant: string): TimeGridResourceSlotProps => ({
      class: 'bc-time-slot',
      'data-date': date,
      'data-slot-index': slotIndex,
      'data-bc-instant': instant,
      'aria-describedby': descriptionIds.selection,
    }),
    getBgEventProps: (bg: TimeBackgroundEvent<TEvent>): TimeGridBgEventProps => {
      const classes = ['bc-bg-event']
      if (bg.isStart) classes.push('bc-bg-event--start')
      if (bg.isEnd) classes.push('bc-bg-event--end')
      return {
        class: classes.join(' '),
        style: eventBoxStyle({ top: bg.top, height: bg.height, left: bg.left, width: bg.width, zIndex: 0 }) as Record<string, string>,
      }
    },
    getEventProps: (event: TimePositionedEvent<TEvent>): TimeGridEventButtonProps<TEvent> => ({
      class: 'bc-event',
      style: eventBoxStyle({
        top: event.top,
        height: event.height,
        left: event.left,
        width: event.width,
        zIndex: event.zIndex,
      }) as Record<string, string>,
      event: event.event,
      title: event.title,
      time: event.time,
      resizeEdges: TIMED_RESIZE_EDGES,
    }),
    getNowIndicatorProps: (column: TimeColumn<TEvent>) => {
      if (column.nowTop === null) return null
      return {
        class: 'bc-now-indicator',
        style: nowIndicatorStyle(column.nowTop) as Record<string, string>,
      }
    },
    bodyNowIndicatorProps: null,
    gutter: { class: 'bc-time-gutter' },
    timeSlotsContainer: { class: 'bc-time-slots' },
    getTimeSelectionDivProps: (colIndex: number) => {
      const range = selRange.value
      const anchor = selAnchor.value
      if (range === null || anchor?.mode !== 'time' || slotCountSafe <= 0) return null
      const startDay = Math.floor(range.start / slotCountSafe)
      const endDay = Math.floor(range.end / slotCountSafe)
      if (colIndex < startDay || colIndex > endDay) return null
      const startSlot = range.start - startDay * slotCountSafe
      const endSlot = range.end - endDay * slotCountSafe
      let top: number
      let bottom: number
      if (startDay === endDay) {
        top = startSlot
        bottom = endSlot + 1
      } else if (colIndex === startDay) {
        top = startSlot
        bottom = slotCountSafe
      } else if (colIndex === endDay) {
        top = 0
        bottom = endSlot + 1
      } else {
        top = 0
        bottom = slotCountSafe
      }
      return {
        class: 'bc-selection',
        style: selectionStyle({ top: top / slotCountSafe, height: (bottom - top) / slotCountSafe }) as Record<string, string>,
      }
    },
    getResourceSelectionDivProps: (resourceId: ResourceId, date: string) => {
      const range = selRange.value
      const anchor = selAnchor.value
      if (range === null || anchor?.mode !== 'time' || slotCountSafe <= 0) return null
      if (anchor.resourceId == null || String(anchor.resourceId) !== String(resourceId)) return null
      if (anchor.date !== date) return null
      return {
        class: 'bc-selection',
        style: selectionStyle({
          top: range.start / slotCountSafe,
          height: (range.end - range.start + 1) / slotCountSafe,
        }) as Record<string, string>,
      }
    },
    getPreviewDivProps: () => null,
  }
}
