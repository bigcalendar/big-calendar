import type { Component } from 'svelte'
import type { ResizeEdge } from '@big-calendar/core'
import DefaultMonthDate from '../DefaultMonthDate/DefaultMonthDate.svelte'
import DefaultMonthEvent from '../DefaultMonthEvent/DefaultMonthEvent.svelte'
import DefaultMonthShowMore from '../DefaultMonthShowMore/DefaultMonthShowMore.svelte'
import DefaultMonthWeekday from '../DefaultMonthWeekday/DefaultMonthWeekday.svelte'
import { useCalendarContext } from '../CalendarProvider'
import { monthGridStyle, segmentStyle } from '../internal/geometryStyles'
import { toStyle } from '../internal/toStyle'
import { useEventRoving } from '../internal/useEventRoving.svelte'
import { useKeyboardDnd } from '../internal/useKeyboardDnd.svelte'
import { useMonthRowMeasure } from '../internal/useMonthRowMeasure.svelte'
import { useRovingSelection } from '../internal/useRovingSelection.svelte'
import type { Direction } from '../internal/useRovingSelection.svelte'
import { useSlotSelection } from '../internal/useSlotSelection.svelte'
import { fromSignal } from '../internal/fromSignal.svelte'
import { useMonthWeeks } from '../useMonthWeeks'
import type { MonthDayCell, MonthGrid, MonthSegmentCell, MonthWeekCell } from '../useMonthWeeks'

export interface MonthViewComponents {
  Weekday: Component
  DateCell: Component
  EventSlot: Component
  ShowMore: Component
}

export interface MonthDaySlotProps {
  class: string
  'data-date': string
  'data-slot-index': number
  tabIndex: number
  'aria-describedby': string
}

export interface MonthSegmentButtonProps<TEvent> {
  class: string
  style: string
  event: TEvent
  title: string
  resizeEdges: ResizeEdge[]
}

export interface MonthShowMoreCellProps<TEvent> {
  class: string
  style: string
  count: number
  label: string
  day: string
  events: ReadonlyArray<{ key: string; event: TEvent; title: string }>
}

export interface UseMonthViewReturn<TEvent> {
  grid: { readonly current: MonthGrid<TEvent> | null }
  components: MonthViewComponents
  getMessages: () => { showMore: (count: number) => string }
  announcement: () => string
  drilldown: (date: string) => void
  announcer: { class: string; role: 'status'; 'aria-live': 'polite' }
  getRootProps: () => { class: string; onKeydown: (e: KeyboardEvent) => void; onKeydownCapture: (e: KeyboardEvent) => void; onFocusCapture: (e: FocusEvent) => void }
  monthHeader: { class: string }
  weekRow: { class: string }
  slotsContainer: { class: string }
  backgroundsContainer: { class: string }
  eventsContainer: { class: string }
  getMonthGridProps: () => { class: string; style: string; onPointerdown: (e: PointerEvent) => void; onKeydown: (e: KeyboardEvent) => void; onFocusCapture: (e: FocusEvent) => void }
  getDaySlotProps: (cell: MonthDayCell<TEvent>, weekIndex: number, dayIndex: number) => MonthDaySlotProps
  getWeekSelectionBand: (weekIndex: number) => { class: string; style: string } | null
  getWeekPreviewBand: (week: MonthWeekCell<TEvent>) => { class: string; style: string } | null
  getSegmentProps: (segment: MonthSegmentCell<TEvent>) => MonthSegmentButtonProps<TEvent>
  getShowMoreCellProps: (cell: MonthDayCell<TEvent>, dayIndex: number, moreRow: number) => MonthShowMoreCellProps<TEvent> | null
}

export function useMonthView<TEvent = unknown>(
  getRootEl: () => HTMLElement | null,
  getGridEl: () => HTMLElement | null,
): UseMonthViewReturn<TEvent> {
  const { store, components: ctxComponents, messages: rawMessages, descriptionIds } = useCalendarContext<TEvent>()
  const grid = useMonthWeeks<TEvent>()
  const eventRoving = useEventRoving(getRootEl)
  const keyboardDnd = useKeyboardDnd({ mode: 'day' })
  const dragPreview = fromSignal(store.dragPreview)
  const selRange = fromSignal(store.selection.range)
  const selAnchor = fromSignal(store.selection.anchor)

  const weekCount = $derived(grid.current?.weeks.length ?? 0)
  const cellCount = $derived(weekCount * 7)

  const neighbor = (index: number, dir: Direction): number | null => {
    const c = cellCount
    switch (dir) {
      case 'left': return index > 0 ? index - 1 : null
      case 'right': return index + 1 < c ? index + 1 : null
      case 'up': return index - 7 >= 0 ? index - 7 : null
      case 'down': return index + 7 < c ? index + 7 : null
    }
  }

  const roving = useRovingSelection({
    mode: 'day',
    getContainer: getGridEl,
    getCount: () => cellCount,
    neighbor,
  })
  const onSlotPointerDown = useSlotSelection('day')

  useMonthRowMeasure({
    getGrid: getGridEl,
    getWeekCount: () => weekCount,
    store,
  })

  const month = ctxComponents.month ?? {}

  return {
    grid,
    components: {
      Weekday: (month.weekday ?? DefaultMonthWeekday) as Component,
      DateCell: (month.dateCell ?? DefaultMonthDate) as Component,
      EventSlot: (month.event ?? DefaultMonthEvent) as Component,
      ShowMore: (month.showMore ?? DefaultMonthShowMore) as Component,
    },
    getMessages: () => ({ showMore: rawMessages.showMore }),
    announcement: () => keyboardDnd.getAnnouncement(),
    drilldown: (date: string) => store.drilldown({ date }),
    announcer: { class: 'bc-sr-only', role: 'status' as const, 'aria-live': 'polite' as const },
    getRootProps: () => ({
      class: 'bc-month',
      onKeydown: eventRoving.onKeydown,
      onKeydownCapture: keyboardDnd.onKeydownCapture,
      onFocusCapture: eventRoving.onFocusCapture,
    }),
    monthHeader: { class: 'bc-month-header' },
    weekRow: { class: 'bc-month-week' },
    slotsContainer: { class: 'bc-month-slots' },
    backgroundsContainer: { class: 'bc-week-backgrounds' },
    eventsContainer: { class: 'bc-week-events' },
    getMonthGridProps: () => ({
      class: 'bc-month-grid',
      style: grid.current ? toStyle(monthGridStyle(weekCount) as Record<string, string>) : '',
      onPointerdown: onSlotPointerDown,
      onKeydown: roving.onKeydown,
      onFocusCapture: roving.onFocusCapture,
    }),
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
      const range = selRange.current
      const anchor = selAnchor.current
      if (range === null || anchor?.mode !== 'day') return null
      const segStart = Math.max(range.start, base)
      const segEnd = Math.min(range.end, base + 6)
      if (segStart > segEnd) return null
      return {
        class: 'bc-selection bc-selection-month',
        style: toStyle(segmentStyle({ left: segStart - base + 1, span: segEnd - segStart + 1, row: 1 }) as Record<string, string>),
      }
    },
    getWeekPreviewBand: (week: MonthWeekCell<TEvent>) => {
      const preview = dragPreview.current
      if (preview === null) return null
      const { localizer } = store
      const previewFirst = localizer.startOf({ value: preview.start, unit: 'day' })
      const previewLast = localizer.add({
        value: localizer.ceil({ value: preview.end, unit: 'day' }),
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
        style: toStyle(segmentStyle({ left: first + 1, span: last - first + 1, row: 1 }) as Record<string, string>),
      }
    },
    getSegmentProps: (segment: MonthSegmentCell<TEvent>): MonthSegmentButtonProps<TEvent> => {
      const resizeEdges: ResizeEdge[] = []
      if (segment.resizeStart) resizeEdges.push('start')
      if (segment.resizeEnd) resizeEdges.push('end')
      return {
        class: 'bc-segment',
        style: toStyle(segmentStyle({ left: segment.left, span: segment.span, row: segment.row }) as Record<string, string>),
        event: segment.event,
        title: segment.title,
        resizeEdges,
      }
    },
    getShowMoreCellProps: (cell: MonthDayCell<TEvent>, dayIndex: number, moreRow: number) => {
      if (cell.extra === null) return null
      return {
        class: 'bc-show-more-cell',
        style: toStyle(segmentStyle({ left: dayIndex + 1, span: 1, row: moreRow }) as Record<string, string>),
        count: cell.extra.count,
        label: rawMessages.showMore(cell.extra.count),
        day: cell.day,
        events: cell.extra.events,
      }
    },
  }
}
