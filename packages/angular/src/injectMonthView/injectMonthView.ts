import { computed, effect, inject, signal } from '@angular/core'
import type { Signal } from '@angular/core'
import { DestroyRef } from '@angular/core'
import { wrapAccessor } from '@big-calendar/core'
import type { CalendarViewModel, SelectionRange, ResizeEdge } from '@big-calendar/core'
import { segmentStyle, monthGridStyle } from '@big-calendar/core/utils'
import { injectCalendar } from '../CalendarProvider/injectCalendar'
import { injectSlotSelection } from '../internal/injectSlotSelection'

// ---- Data types (framework-agnostic) -----------------------------------

/** A weekday column heading, resolved from the first week of the grid. */
export interface MonthWeekday {
  day: string
  long: string
  short: string
}

/** One day cell of the grid, with its resolved label, state flags, and overflow. */
export interface MonthDayCell<TEvent> {
  day: string
  label: string
  isToday: boolean
  isOffRange: boolean
  extra: { count: number; events: { key: string; event: TEvent; title: string }[] } | null
}

/** One placed event segment within a week row. */
export interface MonthSegmentCell<TEvent> {
  key: string
  event: TEvent
  title: string
  left: number
  span: number
  row: number
  resizeStart: boolean
  resizeEnd: boolean
}

/** One week row: its day cells, placed segments, and the overflow row index. */
export interface MonthWeekCell<TEvent> {
  key: string
  days: MonthDayCell<TEvent>[]
  segments: MonthSegmentCell<TEvent>[]
  moreRow: number
}

/** The resolved month grid: weekday headings plus laid-out week rows. */
export interface MonthGrid<TEvent> {
  weekdays: MonthWeekday[]
  weeks: MonthWeekCell<TEvent>[]
}

// ---- Prop types --------------------------------------------------------

/** Element-spread attrs for a `bc-month-slot` hit-target `<div>`. */
export interface MonthDaySlotProps {
  class: string
  'data-date': string
  'data-slot-index': number
  tabIndex: number
  'aria-describedby': string
}

/** Attrs for an `EventButton` segment. */
export interface MonthSegmentButtonProps<TEvent> {
  class: string
  style: Record<string, string>
  event: TEvent
  title: string
  resizeEdges: ResizeEdge[]
}

/** Attrs for the `bc-month-grid` div, including the CSS grid style. */
export interface MonthGridAttrs {
  class: string
  style: Record<string, string>
}

/** Return value of {@link injectMonthView}. */
export interface InjectMonthViewReturn<TEvent> {
  /** Resolved month grid, or `null` when the active view is not the month. */
  grid: Signal<MonthGrid<TEvent> | null>
  /** Resolved messages subset (showMore formatter). */
  messages: Signal<{ showMore: (count: number) => string }>
  /** Navigate to the given day (calls `store.drilldown`). */
  drilldown: (date: string) => void
  /** Element attrs for the outermost `<div class="bc-month">`. */
  root: { class: string }
  /** Element attrs for the weekday column-heading row. */
  monthHeader: { class: string }
  /** Element attrs for the `bc-month-grid` div (includes CSS grid vars). */
  monthGrid: Signal<MonthGridAttrs>
  /** Static attrs for each week row. */
  weekRow: { class: string }
  /** Static attrs for the slot hit-target container. */
  slotsContainer: { class: string }
  /** Static attrs for the background cells container. */
  backgroundsContainer: { class: string }
  /** Static attrs for the events container. */
  eventsContainer: { class: string }
  /** Returns attrs for a `bc-month-slot` hit-target cell. */
  getDaySlotProps: (cell: MonthDayCell<TEvent>, weekIndex: number, dayIndex: number) => MonthDaySlotProps
  /**
   * Returns the rendered selection-band attrs for the given week row, or `null`
   * when no band overlaps the row.
   */
  getWeekSelectionBand: (weekIndex: number) => { class: string; style: Record<string, string> } | null
  /**
   * Returns the drag-preview-band attrs for the given week row, or `null`
   * when no live preview overlaps the row.
   */
  getWeekPreviewBand: (week: MonthWeekCell<TEvent>) => { class: string; style: Record<string, string> } | null
  /** Returns all segment attrs for a placed event (pass `key` separately). */
  getSegmentProps: (segment: MonthSegmentCell<TEvent>) => MonthSegmentButtonProps<TEvent>
  /** Returns show-more cell attrs, or `null` when the cell has no overflow. */
  getShowMoreCellProps: (
    cell: MonthDayCell<TEvent>,
    dayIndex: number,
    moreRow: number,
  ) => ({ class: string; style: Record<string, string>; count: number; label: string; day: string; events: ReadonlyArray<{ key: string; event: TEvent; title: string }> }) | null
  /** Returns the stringified event id for `data-bc-event` / aria attributes. */
  getEventId: (event: TEvent) => string | undefined
  /** Whether the given event is currently selected. */
  isEventSelected: (event: TEvent) => boolean
  /** `pointerdown` handler to bind on the `.bc-month-slots` container for slot selection. */
  onSlotsPointerDown: (e: PointerEvent) => void
  /** Whether the given event should show a grab cursor (DnD enabled + event draggable). */
  isDraggable: (event: TEvent) => boolean
  /** Whether the given event should show resize handles (DnD enabled + event resizable). */
  isResizable: (event: TEvent) => boolean
  /** Single-click handler with 250 ms single/double disambiguation. */
  handleSegmentClick: (event: TEvent, domEvent: MouseEvent) => void
  /** Double-click handler; cancels any pending single-click. */
  handleSegmentDblClick: (event: TEvent, domEvent: MouseEvent) => void
  /** Keydown handler: Enter/Space → click, F2 → double-click. */
  handleSegmentKeyDown: (event: TEvent, domEvent: KeyboardEvent) => void
  /** Right-click (contextmenu) handler; no-op when no right-click callback is wired. */
  handleSegmentContextMenu: (event: TEvent, domEvent: MouseEvent) => void
  /** Middle-click (auxclick) handler; no-op when no middle-click callback is wired. */
  handleSegmentAuxClick: (event: TEvent, domEvent: MouseEvent) => void
}

/**
 * Inject all state for an Angular month-view template. Reads from the nearest
 * `<bc-calendar-provider>` ancestor via `injectCalendar()`.
 *
 * Returns Angular `Signal<MonthGrid<TEvent> | null>` — re-computes automatically
 * when events, view, or date change. Spread the static attr groups onto the
 * matching template elements; use `getDaySlotProps`, `getSegmentProps`, etc. for
 * per-cell attrs.
 *
 * Must be called in an Angular injection context (constructor or field initializer).
 */
export function injectMonthView<TEvent = unknown>(): InjectMonthViewReturn<TEvent> {
  const ctx = injectCalendar<TEvent>()
  const destroyRef = inject(DestroyRef)
  const { descriptionIds, messages: rawMessages } = ctx

  // Angular writable signals — populated once CalendarProviderComponent's
  // store-creation effect fires. Null/empty initial values mean grid returns
  // null until the store is ready (correct behavior).
  const _viewModel = signal<CalendarViewModel<TEvent> | null>(null)
  const _date = signal<string>('')
  const _selRange = signal<SelectionRange | null>(null)
  const _selAnchor = signal<{ mode: string } | null>(null)
  const _dragPreview = signal<{ start: string; end: string } | null>(null)
  const _dndEnabled = signal<boolean>(false)

  const cleanups: (() => void)[] = []

  // Track selected event id (preact signal → Angular signal).
  const _selectedId = signal<string | null>(null)

  // Fired when the parent provider's store-creation effect sets storeSignal.
  // We subscribe to each preact signal here so Angular detects changes.
  effect(() => {
    const store = ctx.storeSignal()
    if (!store) return
    cleanups.push(
      store.viewModel.subscribe((vm) => _viewModel.set(vm as CalendarViewModel<TEvent>)),
    )
    cleanups.push(store.date.subscribe((d) => _date.set(d)))
    cleanups.push(store.selection.range.subscribe((r) => _selRange.set(r)))
    cleanups.push(
      store.selection.anchor.subscribe((a) =>
        _selAnchor.set(a as { mode: string } | null),
      ),
    )
    cleanups.push(store.dragPreview.subscribe((p) => _dragPreview.set(p)))
    cleanups.push(
      store.selected.subscribe((id) => _selectedId.set(id != null ? String(id) : null)),
    )
    cleanups.push(store.dndEnabled.subscribe((v) => _dndEnabled.set(v)))
  })

  const onSlotsPointerDown = injectSlotSelection('day')

  // Single/double-click disambiguation — shared per view (one interaction at a time).
  let _clickTimer: ReturnType<typeof setTimeout> | null = null

  destroyRef.onDestroy(() => {
    cleanups.forEach((fn) => fn())
    if (_clickTimer !== null) clearTimeout(_clickTimer)
  })

  const _getEventId = (event: TEvent): string | undefined => {
    const store = ctx.storeSignal()
    if (!store) return undefined
    const id = wrapAccessor(store.accessors.id)(event)
    return id != null ? String(id) : undefined
  }

  const _selectEvent = (event: TEvent): void => {
    const store = ctx.storeSignal()
    if (!store) return
    const id = wrapAccessor(store.accessors.id)(event)
    if (id != null) store.selectEvent({ id })
  }

  const grid = computed((): MonthGrid<TEvent> | null => {
    const store = ctx.storeSignal()
    if (!store) return null
    const vm = _viewModel()
    const focus = _date()
    if (!vm || vm.kind !== 'month') return null

    const { localizer, accessors, getNow } = store
    const now = getNow()
    const id = wrapAccessor(accessors.id)
    const title = wrapAccessor(accessors.title)
    const start = wrapAccessor(accessors.start)
    const end = wrapAccessor(accessors.end)
    const { weeks } = vm.month

    const weekdays: MonthWeekday[] = (weeks[0]?.days ?? []).map((day) => ({
      day,
      long: localizer.format({ value: day, format: 'weekday' }),
      short: localizer.format({ value: day, format: 'weekdayShort' }),
    }))

    const resolvedWeeks: MonthWeekCell<TEvent>[] = weeks.map((week, weekIndex) => {
      const days: MonthDayCell<TEvent>[] = week.days.map((day, dayIndex) => {
        const column = dayIndex + 1
        const covering = week.extra.filter(
          (segment) => segment.left <= column && column <= segment.right,
        )
        return {
          day,
          label: localizer.format({ value: day, format: 'dayOfMonth' }),
          isToday: localizer.isSameDate({ a: day, b: now }),
          isOffRange: localizer.neq({ a: day, b: focus, unit: 'month' }),
          extra:
            covering.length > 0
              ? {
                  count: covering.length,
                  events: covering.map((segment, segIndex) => ({
                    key: `${weekIndex}-more-${dayIndex}-${segIndex}-${String(id(segment.event) ?? '')}`,
                    event: segment.event,
                    title: title(segment.event) ?? '',
                  })),
                }
              : null,
        }
      })

      const weekFirst = week.days[0]
      const weekLast = week.days[week.days.length - 1]

      const segments: MonthSegmentCell<TEvent>[] = week.levels.flatMap((level, rowIndex) =>
        level.map((segment, segIndex) => {
          const evStart = start(segment.event)
          const evEnd = end(segment.event)
          let resizeStart = false
          let resizeEnd = false
          if (evStart != null && evEnd != null && weekFirst != null && weekLast != null) {
            const startDay = localizer.startOf({ value: evStart, unit: 'day' })
            const endDay = localizer.add({
              value: localizer.ceil({ value: evEnd, unit: 'day' }),
              amount: -1,
              unit: 'day',
            })
            resizeStart = localizer.gte({ a: startDay, b: weekFirst, unit: 'day' })
            resizeEnd = localizer.lte({ a: endDay, b: weekLast, unit: 'day' })
          }
          return {
            key: `${weekIndex}-${rowIndex}-${segIndex}-${String(id(segment.event) ?? '')}`,
            event: segment.event,
            title: title(segment.event) ?? '',
            left: segment.left,
            span: segment.span,
            row: rowIndex + 1,
            resizeStart,
            resizeEnd,
          }
        }),
      )

      return { key: String(weekIndex), days, segments, moreRow: week.levels.length + 1 }
    })

    return { weekdays, weeks: resolvedWeeks }
  })

  const messages = computed(() => ({
    showMore: rawMessages.showMore,
  }))

  const monthGrid = computed((): MonthGridAttrs => ({
    class: 'bc-month-grid',
    style: (grid() != null
      ? monthGridStyle(grid()!.weeks.length)
      : {}) as Record<string, string>,
  }))

  return {
    grid,
    messages,
    drilldown: (date) => {
      const store = ctx.storeSignal()
      if (store) store.drilldown({ date })
    },
    root: { class: 'bc-month' },
    monthHeader: { class: 'bc-month-header' },
    monthGrid,
    weekRow: { class: 'bc-month-week' },
    slotsContainer: { class: 'bc-month-slots' },
    backgroundsContainer: { class: 'bc-week-backgrounds' },
    eventsContainer: { class: 'bc-week-events' },
    getDaySlotProps: (cell, weekIndex, dayIndex) => {
      const slotIndex = weekIndex * 7 + dayIndex
      return {
        class: 'bc-month-slot',
        'data-date': cell.day,
        'data-slot-index': slotIndex,
        tabIndex: 0,
        'aria-describedby': descriptionIds.selection,
      }
    },
    getWeekSelectionBand: (weekIndex) => {
      const base = weekIndex * 7
      const range = _selRange()
      const anchor = _selAnchor()
      if (range === null || anchor?.mode !== 'day') return null
      const segStart = Math.max(range.start, base)
      const segEnd = Math.min(range.end, base + 6)
      if (segStart > segEnd) return null
      return {
        class: 'bc-selection bc-selection-month',
        style: segmentStyle({
          left: segStart - base + 1,
          span: segEnd - segStart + 1,
          row: 1,
        }) as Record<string, string>,
      }
    },
    getWeekPreviewBand: (week) => {
      const preview = _dragPreview()
      if (preview === null) return null
      const store = ctx.storeSignal()
      if (!store) return null
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
        style: segmentStyle({ left: first + 1, span: last - first + 1, row: 1 }) as Record<string, string>,
      }
    },
    getSegmentProps: (segment) => {
      const resizeEdges: ResizeEdge[] = []
      if (segment.resizeStart) resizeEdges.push('start')
      if (segment.resizeEnd) resizeEdges.push('end')
      return {
        class: 'bc-segment',
        style: segmentStyle({
          left: segment.left,
          span: segment.span,
          row: segment.row,
        }) as Record<string, string>,
        event: segment.event,
        title: segment.title,
        resizeEdges,
      }
    },
    getShowMoreCellProps: (cell, dayIndex, moreRow) => {
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
    onSlotsPointerDown,
    isDraggable: (event) => _dndEnabled() && (ctx.storeSignal()?.isDraggable(event) ?? false),
    isResizable: (event) => _dndEnabled() && (ctx.storeSignal()?.isResizable(event) ?? false),
    getEventId: _getEventId,
    isEventSelected: (event) => {
      const id = _getEventId(event)
      return id != null && _selectedId() === id
    },
    handleSegmentClick: (event, domEvent) => {
      if (domEvent.detail === 0) return
      if (_clickTimer !== null) return
      const e = domEvent
      _clickTimer = setTimeout(() => {
        _clickTimer = null
        _selectEvent(event)
        ctx.storeSignal()?.eventHandlers.click(event, e)
      }, 250)
    },
    handleSegmentDblClick: (event, domEvent) => {
      if (_clickTimer !== null) { clearTimeout(_clickTimer); _clickTimer = null }
      _selectEvent(event)
      ctx.storeSignal()?.eventHandlers.doubleClick(event, domEvent)
    },
    handleSegmentKeyDown: (event, domEvent) => {
      const store = ctx.storeSignal()
      if (!store) return
      if (domEvent.key === 'Enter' || domEvent.key === ' ') {
        domEvent.preventDefault()
        _selectEvent(event)
        store.eventHandlers.click(event, domEvent)
      } else if (domEvent.key === 'F2') {
        domEvent.preventDefault()
        _selectEvent(event)
        store.eventHandlers.doubleClick(event, domEvent)
      }
    },
    handleSegmentContextMenu: (event, domEvent) => {
      const store = ctx.storeSignal()
      if (store?.eventHandlers.hasRightClick) store.eventHandlers.rightClick(event, domEvent)
    },
    handleSegmentAuxClick: (event, domEvent) => {
      if (domEvent.button !== 1) return
      const store = ctx.storeSignal()
      if (store?.eventHandlers.hasMiddleClick) store.eventHandlers.middleClick(event, domEvent)
    },
  }
}
