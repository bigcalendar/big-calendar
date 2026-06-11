import { createSlotMetrics } from '@big-calendar/core'
import type { ResourceId, ResizeEdge } from '@big-calendar/core'
import type { ComponentType, CSSProperties, FocusEvent, KeyboardEvent, PointerEvent } from 'react'
import { useCallback } from 'react'
import { useCalendarContext } from '../CalendarProvider'
import type { TimeLabelProps, TimeEventProps } from '../components.type'
import {
  eventBoxStyle,
  nowIndicatorStyle,
  slotCountStyle,
} from '../geometryStyles'
import { useRovingSelection } from '../useRovingSelection'
import type { Direction } from '../useRovingSelection'
import { useSignalValue } from '../internal/useSignalValue'
import { useSlotSelection } from '../useSlotSelection'
import DefaultTimeEvent from '../DefaultTimeEvent'
import DefaultTimeLabel from '../DefaultTimeLabel'
import type {
  TimeBackgroundEvent,
  TimeColumn,
  TimeGrid,
  TimePositionedEvent,
} from '../useTimeGrid'

/** Resolved component slots used by the body section. */
export interface TimeGridBodyComponents<TEvent> {
  TimeLabel: ComponentType<TimeLabelProps>
  EventSlot: ComponentType<TimeEventProps<TEvent>>
}

/** Callback ref accepted by roving hooks. */
type CallbackRef = (node: HTMLElement | null) => void

/** Element-spread props for the plain-path `.bc-time-body` (with roving). */
export interface TimeGridBodyRootProps {
  className: string
  style: CSSProperties
  ref: CallbackRef
  onPointerDown: (e: PointerEvent<HTMLDivElement>) => void
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void
  onFocusCapture: (e: FocusEvent<HTMLDivElement>) => void
}

/** Element-spread props for the resource/day-major `.bc-time-body` (no roving). */
export interface TimeGridResourceBodyRootProps {
  className: string
  style: CSSProperties
  onPointerDown: (e: PointerEvent<HTMLDivElement>) => void
}

/** Element-spread props for a `.bc-time-slot` in the plain path (with `tabIndex`). */
export interface TimeGridSlotProps {
  className: string
  'data-date': string
  'data-slot-index': number
  'data-bc-instant': string
  tabIndex: number
  'aria-describedby': string
}

/** Element-spread props for a `.bc-time-slot` in resource/day-major paths (no `tabIndex`). */
export interface TimeGridResourceSlotProps {
  className: string
  'data-date': string
  'data-slot-index': number
  'data-bc-instant': string
  'aria-describedby': string
}

/** Element-spread props for a `.bc-bg-event` background event `<div>`. */
export interface TimeGridBgEventProps {
  className: string
  style: CSSProperties
}

/** Props for an `EventButton` timed event (spread directly onto the button). */
export interface TimeGridEventButtonProps<TEvent> {
  className: string
  style: CSSProperties
  event: TEvent
  title: string
  time: string
  resizeEdges: readonly ResizeEdge[]
}

/** Return value of {@link useTimeGridBody}. */
export interface UseTimeGridBodyReturn<TEvent> {
  /** Resolved component slots for the body section. */
  components: TimeGridBodyComponents<TEvent>
  /** `aria-describedby` id for slot hit-targets. */
  slotDescribedBy: string
  /**
   * Element-spread props for the plain-path `.bc-time-body` div (includes
   * roving `ref`, `onKeyDown`, and `onFocusCapture`).
   */
  body: TimeGridBodyRootProps
  /**
   * Element-spread props for the resource/day-major `.bc-time-body` div (only
   * `style` and `onPointerDown` — no roving in those layouts).
   */
  resourceBody: TimeGridResourceBodyRootProps
  /** Returns `{ className }` for a `.bc-day-column` wrapper `<div>`. */
  getColumnProps: (column: TimeColumn<TEvent>) => { className: string }
  /**
   * Returns element-spread props for a plain-path `.bc-time-slot` `<div>`.
   * Uses the global slot index (`colIndex * slotCount + slotIndex`) so a drag
   * can span day columns.
   */
  getSlotProps: (
    column: TimeColumn<TEvent>,
    colIndex: number,
    slotIndex: number,
  ) => TimeGridSlotProps
  /**
   * Returns element-spread props for a resource/day-major `.bc-time-slot`
   * `<div>`. Uses a local `slotIndex` (0-based within the column).
   */
  getResourceSlotProps: (
    date: string,
    slotIndex: number,
    instant: string,
  ) => TimeGridResourceSlotProps
  /**
   * Returns the time-column selection box (`top`/`height` fractions) for the
   * given column index, or `null` when no selection overlaps it.
   */
  getTimeSelectionBox: (colIndex: number) => { top: number; height: number } | null
  /**
   * Returns the per-resource selection box for the given resource + date pair,
   * or `null` when the selection doesn't match.
   */
  getResourceSelectionBox: (
    resourceId: ResourceId,
    date: string,
  ) => { top: number; height: number } | null
  /**
   * Returns the drag-preview box (`top`/`height` fractions) clipped to the
   * given column window, or `null` when no preview or the column is not covered.
   */
  getPreviewBox: (column: { min: string; max: string }) => { top: number; height: number } | null
  /** Returns `<div>` props for a `.bc-bg-event` background event. */
  getBgEventProps: (bg: TimeBackgroundEvent<TEvent>) => TimeGridBgEventProps
  /** Returns all `EventButton` props for a timed event (spread onto the button). */
  getEventProps: (event: TimePositionedEvent<TEvent>) => TimeGridEventButtonProps<TEvent>
  /** Returns `<div>` props for the `.bc-now-indicator` line, or `null` when absent. */
  getNowIndicatorProps: (column: TimeColumn<TEvent>) => { className: string; style: CSSProperties } | null
}

/** Stable identity for the resize edge array on timed events. */
const TIMED_RESIZE_EDGES: readonly ResizeEdge[] = ['start', 'end']

/**
 * Composes all logic for the body section of {@link TimeGridView}: time-slot
 * selection, roving focus, selection-box geometry, drag-preview computation, and
 * event-box placement. Pass the resolved {@link TimeGrid} from {@link useTimeGrid}
 * (or `null` outside a time-grid view). Used directly by {@link useTimeGridView}.
 */
export function useTimeGridBody<TEvent = unknown>(
  grid: TimeGrid<TEvent> | null,
): UseTimeGridBodyReturn<TEvent> {
  const { store, components, descriptionIds } = useCalendarContext<TEvent>()
  const onSlotPointerDown = useSlotSelection('time', grid?.slotCount)
  const selRange = useSignalValue(store.selection.range)
  const selAnchor = useSignalValue(store.selection.anchor)
  const dragPreview = useSignalValue(store.dragPreview)

  const slotCountSafe = grid?.slotCount ?? 0
  const dayCountSafe = grid?.columns.length ?? 0
  const timeCount = dayCountSafe * slotCountSafe

  const timeNeighbor = useCallback(
    (index: number, dir: Direction): number | null => {
      if (slotCountSafe <= 0) return null
      const slot = index % slotCountSafe
      switch (dir) {
        case 'up':
          return slot > 0 ? index - 1 : null
        case 'down':
          return slot < slotCountSafe - 1 ? index + 1 : null
        case 'left':
          return index - slotCountSafe >= 0 ? index - slotCountSafe : null
        case 'right':
          return index + slotCountSafe < timeCount ? index + slotCountSafe : null
      }
    },
    [slotCountSafe, timeCount],
  )
  const timeRoving = useRovingSelection({
    mode: 'time',
    count: timeCount,
    slotCount: slotCountSafe,
    neighbor: timeNeighbor,
  })

  const bodyStyle = slotCountSafe > 0 ? slotCountStyle(slotCountSafe) : {}

  return {
    components: {
      TimeLabel: components.time?.timeLabel ?? DefaultTimeLabel,
      EventSlot: (components.time?.event ?? DefaultTimeEvent) as ComponentType<TimeEventProps<TEvent>>,
    },
    slotDescribedBy: descriptionIds.selection,
    body: {
      className: 'bc-time-body',
      style: bodyStyle,
      ref: timeRoving.containerRef,
      onPointerDown: onSlotPointerDown,
      onKeyDown: timeRoving.onKeyDown,
      onFocusCapture: timeRoving.onFocusCapture,
    },
    resourceBody: {
      className: 'bc-time-body',
      style: bodyStyle,
      onPointerDown: onSlotPointerDown,
    },
    getColumnProps: (column: TimeColumn<TEvent>) => ({
      className: column.isToday ? 'bc-day-column bc-today' : 'bc-day-column',
    }),
    getSlotProps: (column: TimeColumn<TEvent>, colIndex: number, slotIndex: number): TimeGridSlotProps => {
      const globalIndex = colIndex * slotCountSafe + slotIndex
      return {
        className: 'bc-time-slot',
        'data-date': column.day,
        'data-slot-index': globalIndex,
        'data-bc-instant': column.slots[slotIndex] ?? '',
        tabIndex: timeRoving.cellTabIndex(globalIndex),
        'aria-describedby': descriptionIds.selection,
      }
    },
    getResourceSlotProps: (date: string, slotIndex: number, instant: string): TimeGridResourceSlotProps => ({
      className: 'bc-time-slot',
      'data-date': date,
      'data-slot-index': slotIndex,
      'data-bc-instant': instant,
      'aria-describedby': descriptionIds.selection,
    }),
    getTimeSelectionBox: (colIndex: number) => {
      const slotCount = slotCountSafe
      if (selRange === null || selAnchor?.mode !== 'time' || slotCount <= 0) return null
      const startDay = Math.floor(selRange.start / slotCount)
      const endDay = Math.floor(selRange.end / slotCount)
      if (colIndex < startDay || colIndex > endDay) return null
      const startSlot = selRange.start - startDay * slotCount
      const endSlot = selRange.end - endDay * slotCount
      let top: number
      let bottom: number
      if (startDay === endDay) {
        top = startSlot
        bottom = endSlot + 1
      } else if (colIndex === startDay) {
        top = startSlot
        bottom = slotCount
      } else if (colIndex === endDay) {
        top = 0
        bottom = endSlot + 1
      } else {
        top = 0
        bottom = slotCount
      }
      return { top: top / slotCount, height: (bottom - top) / slotCount }
    },
    getResourceSelectionBox: (resourceId: ResourceId, date: string) => {
      const slotCount = slotCountSafe
      if (selRange === null || selAnchor?.mode !== 'time' || slotCount <= 0) return null
      if (selAnchor.resourceId == null || String(selAnchor.resourceId) !== String(resourceId)) return null
      if (selAnchor.date !== date) return null
      const top = selRange.start / slotCount
      const height = (selRange.end - selRange.start + 1) / slotCount
      return { top, height }
    },
    getPreviewBox: (column: { min: string; max: string }) => {
      if (dragPreview === null) return null
      const metrics = createSlotMetrics({
        localizer: store.localizer,
        min: column.min,
        max: column.max,
        step: store.step,
        timeslots: store.timeslots,
      })
      const range = metrics.getRange({ start: dragPreview.start, end: dragPreview.end })
      return range.height > 0 ? { top: range.top, height: range.height } : null
    },
    getBgEventProps: (bg: TimeBackgroundEvent<TEvent>): TimeGridBgEventProps => ({
      className: 'bc-bg-event',
      style: eventBoxStyle({ top: bg.top, height: bg.height, left: 0, width: 1, zIndex: 0 }),
    }),
    getEventProps: (event: TimePositionedEvent<TEvent>): TimeGridEventButtonProps<TEvent> => ({
      className: 'bc-event',
      style: eventBoxStyle({
        top: event.top,
        height: event.height,
        left: event.left,
        width: event.width,
        zIndex: event.zIndex,
      }),
      event: event.event,
      title: event.title,
      time: event.time,
      resizeEdges: TIMED_RESIZE_EDGES,
    }),
    getNowIndicatorProps: (column: TimeColumn<TEvent>) => {
      if (column.nowTop === null) return null
      return {
        className: 'bc-now-indicator',
        style: nowIndicatorStyle(column.nowTop),
      }
    },
  }
}
