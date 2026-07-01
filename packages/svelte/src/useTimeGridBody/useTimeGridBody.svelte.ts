import type { Component } from 'svelte'
import type { ResizeEdge, ResourceId } from '@big-calendar/core'
import DefaultBackgroundEvent from '../DefaultBackgroundEvent/DefaultBackgroundEvent.svelte'
import DefaultTimeEvent from '../DefaultTimeEvent/DefaultTimeEvent.svelte'
import DefaultTimeLabel from '../DefaultTimeLabel/DefaultTimeLabel.svelte'
import { useCalendarContext } from '../CalendarProvider'
import {
  eventBoxStyle,
  nowIndicatorStyle,
  selectionStyle,
  slotCountStyle,
} from '../internal/geometryStyles'
import { toStyle } from '../internal/toStyle'
import { useRovingSelection } from '../internal/useRovingSelection.svelte'
import type { Direction } from '../internal/useRovingSelection.svelte'
import { useSlotSelection } from '../internal/useSlotSelection.svelte'
import { fromSignal } from '../internal/fromSignal.svelte'
import type {
  TimeBackgroundEvent,
  TimeColumn,
  TimeGrid,
  TimePositionedEvent,
} from '../useTimeGrid'

export interface TimeGridBodyRootProps {
  class: string
  style: string
  onPointerdown: (e: PointerEvent) => void
  onKeydown: (e: KeyboardEvent) => void
  onFocusCapture: (e: FocusEvent) => void
}

export interface TimeGridResourceBodyRootProps {
  class: string
  style: string
  onPointerdown: (e: PointerEvent) => void
}

export interface TimeGridSlotProps {
  class: string
  'data-date': string
  'data-slot-index': number
  'data-bc-instant': string
  tabIndex: number
  'aria-describedby': string
}

export interface TimeGridResourceSlotProps {
  class: string
  'data-date': string
  'data-slot-index': number
  'data-bc-instant': string
  'aria-describedby': string
}

export interface TimeGridBgEventProps {
  class: string
  style: string
}

export interface TimeGridEventButtonProps<TEvent> {
  class: string
  style: string
  event: TEvent
  title: string
  time: string
  resizeEdges: readonly ResizeEdge[]
}

export interface TimeGridBodyComponents {
  TimeLabel: Component
  EventSlot: Component
  BgEventSlot: Component
}

export interface UseTimeGridBodyReturn<TEvent> {
  components: TimeGridBodyComponents
  slotDescribedBy: string
  getBody: () => TimeGridBodyRootProps
  resourceBody: () => TimeGridResourceBodyRootProps
  getColumnProps: (column: TimeColumn<TEvent>) => { class: string }
  getSlotProps: (column: TimeColumn<TEvent>, colIndex: number, slotIndex: number) => TimeGridSlotProps
  getResourceSlotProps: (date: string, slotIndex: number, instant: string) => TimeGridResourceSlotProps
  getBgEventProps: (bg: TimeBackgroundEvent<TEvent>) => TimeGridBgEventProps
  getEventProps: (event: TimePositionedEvent<TEvent>) => TimeGridEventButtonProps<TEvent>
  getNowIndicatorProps: (column: TimeColumn<TEvent>) => { class: string; style: string } | null
  getBodyNowIndicatorProps: () => { class: string; style: string } | null
  gutter: { class: string }
  timeSlotsContainer: { class: string }
  getTimeSelectionDivProps: (colIndex: number) => { class: string; style: string } | null
  getResourceSelectionDivProps: (resourceId: ResourceId, date: string) => { class: string; style: string } | null
  getPreviewDivProps: (column: { min: string; max: string }) => { class: string; style: string } | null
}

const TIMED_RESIZE_EDGES: readonly ResizeEdge[] = ['start', 'end']

export function useTimeGridBody<TEvent = unknown>(
  getGrid: () => TimeGrid<TEvent> | null,
  getBodyEl: () => HTMLElement | null,
): UseTimeGridBodyReturn<TEvent> {
  const { store, components: ctxComponents, descriptionIds } = useCalendarContext<TEvent>()
  const selRange = fromSignal(store.selection.range)
  const selAnchor = fromSignal(store.selection.anchor)
  const time = ctxComponents.time ?? {}

  const slotCountSafe = $derived(getGrid()?.slotCount ?? 0)
  const dayCountSafe = $derived(getGrid()?.columns.length ?? 0)
  const timeCount = $derived(dayCountSafe * slotCountSafe)
  const bodyStyle = $derived(
    slotCountSafe > 0
      ? toStyle(slotCountStyle(slotCountSafe) as Record<string, string>)
      : '',
  )

  const timeNeighbor = (index: number, dir: Direction): number | null => {
    const sc = slotCountSafe
    const tc = timeCount
    if (sc <= 0) return null
    const slot = index % sc
    switch (dir) {
      case 'up': return slot > 0 ? index - 1 : null
      case 'down': return slot < sc - 1 ? index + 1 : null
      case 'left': return index - sc >= 0 ? index - sc : null
      case 'right': return index + sc < tc ? index + sc : null
    }
  }

  const roving = useRovingSelection({
    mode: 'time',
    getContainer: getBodyEl,
    getCount: () => timeCount,
    getSlotCount: () => slotCountSafe,
    neighbor: timeNeighbor,
  })
  const onSlotPointerDown = useSlotSelection('time', () => slotCountSafe)

  return {
    components: {
      TimeLabel: (time.timeLabel ?? DefaultTimeLabel) as Component,
      EventSlot: (time.event ?? DefaultTimeEvent) as Component,
      BgEventSlot: (time.backgroundEvent ?? DefaultBackgroundEvent) as Component,
    },
    slotDescribedBy: descriptionIds.selection,
    getBody: () => ({
      class: 'bc-time-body',
      style: bodyStyle,
      onPointerdown: onSlotPointerDown,
      onKeydown: roving.onKeydown,
      onFocusCapture: roving.onFocusCapture,
    }),
    resourceBody: () => ({
      class: 'bc-time-body',
      style: bodyStyle,
      onPointerdown: onSlotPointerDown,
    }),
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
        style: toStyle(eventBoxStyle({ top: bg.top, height: bg.height, left: bg.left, width: bg.width, zIndex: 0 }) as Record<string, string>),
      }
    },
    getEventProps: (event: TimePositionedEvent<TEvent>): TimeGridEventButtonProps<TEvent> => ({
      class: 'bc-event',
      style: toStyle(eventBoxStyle({
        top: event.top,
        height: event.height,
        left: event.left,
        width: event.width,
        zIndex: event.zIndex,
      }) as Record<string, string>),
      event: event.event,
      title: event.title,
      time: event.time,
      resizeEdges: TIMED_RESIZE_EDGES,
    }),
    getNowIndicatorProps: (column: TimeColumn<TEvent>) => {
      if (column.nowTop === null) return null
      return {
        class: 'bc-now-indicator',
        style: toStyle(nowIndicatorStyle(column.nowTop) as Record<string, string>),
      }
    },
    getBodyNowIndicatorProps: () => {
      const grid = getGrid()
      let bodyNowTop: number | null = null
      for (const col of grid?.columns ?? []) {
        if (col.nowTop !== null) { bodyNowTop = col.nowTop; break }
      }
      if (bodyNowTop === null && grid?.resources) {
        outer: for (const r of grid.resources) {
          for (const col of r.columns) {
            if (col.nowTop !== null) { bodyNowTop = col.nowTop; break outer }
          }
        }
      }
      if (bodyNowTop === null && grid?.dayGroups) {
        outerDg: for (const g of grid.dayGroups) {
          for (const cell of g.cells) {
            if (cell.column?.nowTop != null) { bodyNowTop = cell.column.nowTop; break outerDg }
          }
        }
      }
      return bodyNowTop !== null
        ? { class: 'bc-now-indicator', style: toStyle(nowIndicatorStyle(bodyNowTop) as Record<string, string>) }
        : null
    },
    gutter: { class: 'bc-time-gutter' },
    timeSlotsContainer: { class: 'bc-time-slots' },
    getTimeSelectionDivProps: (colIndex: number) => {
      const range = selRange.current
      const anchor = selAnchor.current
      const sc = slotCountSafe
      if (range === null || anchor?.mode !== 'time' || sc <= 0) return null
      const startDay = Math.floor(range.start / sc)
      const endDay = Math.floor(range.end / sc)
      if (colIndex < startDay || colIndex > endDay) return null
      const startSlot = range.start - startDay * sc
      const endSlot = range.end - endDay * sc
      let top: number
      let bottom: number
      if (startDay === endDay) {
        top = startSlot
        bottom = endSlot + 1
      } else if (colIndex === startDay) {
        top = startSlot
        bottom = sc
      } else if (colIndex === endDay) {
        top = 0
        bottom = endSlot + 1
      } else {
        top = 0
        bottom = sc
      }
      return {
        class: 'bc-selection',
        style: toStyle(selectionStyle({ top: top / sc, height: (bottom - top) / sc }) as Record<string, string>),
      }
    },
    getResourceSelectionDivProps: (resourceId: ResourceId, date: string) => {
      const range = selRange.current
      const anchor = selAnchor.current
      const sc = slotCountSafe
      if (range === null || anchor?.mode !== 'time' || sc <= 0) return null
      if (anchor.resourceId == null || String(anchor.resourceId) !== String(resourceId)) return null
      if (anchor.date !== date) return null
      return {
        class: 'bc-selection',
        style: toStyle(selectionStyle({
          top: range.start / sc,
          height: (range.end - range.start + 1) / sc,
        }) as Record<string, string>),
      }
    },
    getPreviewDivProps: () => null,
  }
}
