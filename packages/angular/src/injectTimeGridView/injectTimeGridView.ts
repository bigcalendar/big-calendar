import { computed, effect, inject, signal } from '@angular/core'
import type { Signal } from '@angular/core'
import { DestroyRef } from '@angular/core'
import { createSlotMetrics, wrapAccessor } from '@big-calendar/core'
import type { CalendarViewModel, ResourceId, SelectionRange } from '@big-calendar/core'
import { formatEventTime } from '@big-calendar/core/utils'
import { dayCountStyle, selectionStyle, slotGroupStyle } from '@big-calendar/core/utils'
import { injectCalendar } from '../CalendarProvider/injectCalendar'
import { injectSlotSelection } from '../internal/injectSlotSelection'

// ---- Data types (framework-agnostic) -----------------------------------

/** A day column heading. */
export interface TimeDayHeading {
  day: string
  label: string
  isToday: boolean
}

/** One labelled time in the left gutter (one per slot group). */
export interface TimeGutterLabel {
  key: string
  time: string
  label: string
}

/** A timed event placed in a day column. */
export interface TimePositionedEvent<TEvent> {
  key: string
  event: TEvent
  title: string
  time: string
  top: number
  height: number
  left: number
  width: number
  zIndex: number
}

/** A background event segment placed in a day column. */
export interface TimeBackgroundEvent<TEvent> {
  key: string
  event: TEvent
  title: string
  top: number
  height: number
  left: number
  width: number
  isStart: boolean
  isEnd: boolean
}

/** One day's time column. */
export interface TimeColumn<TEvent> {
  key: string
  day: string
  resourceId: ResourceId | null
  min: string
  max: string
  isToday: boolean
  events: TimePositionedEvent<TEvent>[]
  backgroundEvents: TimeBackgroundEvent<TEvent>[]
  nowTop: number | null
  slots: string[]
}

/** One all-day event segment across the header row. */
export interface TimeAllDaySegment<TEvent> {
  key: string
  event: TEvent
  title: string
  left: number
  span: number
  row: number
}

/** One per-column overflow indicator in the all-day header. */
export interface TimeAllDayExtra<TEvent> {
  col: number
  count: number
  events: { key: string; event: TEvent; title: string }[]
}

/** The all-day header row: placed segments plus any overflow. */
export interface TimeAllDayRow<TEvent> {
  segments: TimeAllDaySegment<TEvent>[]
  extra: TimeAllDayExtra<TEvent>[] | null
}

/** One resource's slice of the time grid. */
export interface TimeResourceGroup<TEvent> {
  key: string
  resourceId: ResourceId
  resourceTitle: string
  resourceType: string | null
  columns: TimeColumn<TEvent>[]
  allDay: TimeAllDayRow<TEvent>
}

/** One (day × resource) cell in the day-major layout. */
export interface TimeDayResourceCell<TEvent> {
  key: string
  resourceId: ResourceId
  resourceTitle: string
  resourceType: string | null
  column: TimeColumn<TEvent>
  allDay: TimeAllDayRow<TEvent>
}

/** One day's slice in the day-major layout. */
export interface TimeDayGroup<TEvent> {
  key: string
  date: string
  label: string
  isToday: boolean
  cells: TimeDayResourceCell<TEvent>[]
}

/** The resolved time grid. */
export interface TimeGrid<TEvent> {
  headings: TimeDayHeading[]
  gutter: TimeGutterLabel[]
  slotCount: number
  allDay: TimeAllDayRow<TEvent>
  columns: TimeColumn<TEvent>[]
  resources: TimeResourceGroup<TEvent>[] | null
  dayGroups: TimeDayGroup<TEvent>[] | null
}

/** Return value of {@link injectTimeGridView}. */
export interface InjectTimeGridViewReturn<TEvent> {
  /**
   * Resolved time grid, or `null` when the active view is not a time grid.
   * Re-computes automatically when events, view, or date change.
   */
  grid: Signal<TimeGrid<TEvent> | null>
  /** Returns the CSS style object for the root `<div>` (pass the leaf column count). */
  getRootStyle: (leafCount: number) => Record<string, string>
  /** CSS class string for the root `<div>`. Pass the current `grid()` value. */
  getRootClass: (grid: TimeGrid<TEvent> | null) => string
  /**
   * Returns data attributes for a time slot div. `colIndex` is the column's
   * visual position in the current body (0-based); `slotIndex` is the slot's
   * position within that column.
   */
  getSlotProps: (column: TimeColumn<TEvent>, colIndex: number, slotIndex: number) => {
    'data-date': string
    'data-slot-index': number
    'data-bc-instant': string
    'aria-describedby': string
  }
  /** Localised "All day" label for the all-day row gutter. */
  allDayLabel: string
  /** `pointerdown` handler to bind on each `.bc-time-body` for timed slot selection. */
  onSlotsPointerDown: (e: PointerEvent) => void
  /** `pointerdown` handler to bind on the `.bc-allday-slots` container for all-day selection. */
  onAllDayPointerDown: (e: PointerEvent) => void
  /** Whether the given event should show a grab cursor (DnD enabled + event draggable). */
  isDraggable: (event: TEvent) => boolean
  /** Whether the given event should show resize handles (DnD enabled + event resizable). */
  isResizable: (event: TEvent) => boolean
  /**
   * The fractional position (0–1) of the current-time marker within the time body,
   * or `null` when today is not visible. Used to set `--bc-now-top` on `.bc-time-body`.
   */
  bodyNowTop: () => number | null
  /** Returns the stringified event id for `data-bc-event` / aria attributes. */
  getEventId: (event: TEvent) => string | undefined
  /** Whether the given event is currently selected. */
  isEventSelected: (event: TEvent) => boolean
  /** Single-click handler with 250 ms single/double disambiguation. */
  handleEventClick: (event: TEvent, domEvent: MouseEvent) => void
  /** Double-click handler; cancels any pending single-click. */
  handleEventDblClick: (event: TEvent, domEvent: MouseEvent) => void
  /** Keydown handler: Enter/Space → click, F2 → double-click. */
  handleEventKeyDown: (event: TEvent, domEvent: KeyboardEvent) => void
  /** Right-click handler; no-op when no right-click callback is wired. */
  handleEventContextMenu: (event: TEvent, domEvent: MouseEvent) => void
  /** Middle-click handler; no-op when no middle-click callback is wired. */
  handleEventAuxClick: (event: TEvent, domEvent: MouseEvent) => void
  /**
   * Returns `[ngStyle]`-compatible CSS custom properties for the `.bc-selection`
   * overlay in a plain time-column, or `null` when the column at `colIndex` has
   * no active selection.
   */
  getTimeSelectionStyle: (colIndex: number) => Record<string, string> | null
  /**
   * Returns `[ngStyle]`-compatible CSS custom properties for the `.bc-selection`
   * overlay in a resource/day-major column, or `null` when the resource+date
   * pair has no active selection.
   */
  getResourceSelectionStyle: (resourceId: ResourceId, date: string) => Record<string, string> | null
  /**
   * Returns `[ngStyle]`-compatible CSS custom properties for the `.bc-drag-preview`
   * overlay in a day column, or `null` when no DnD preview is active or the
   * column's time window is not covered.
   */
  getPreviewStyle: (column: { min: string; max: string }) => Record<string, string> | null
}

function computeRootClass(grid: TimeGrid<unknown> | null): string {
  if (grid === null) return 'bc-time-grid'
  if (grid.dayGroups !== null) return 'bc-time-grid bc-time-grid-resources bc-time-grid-resources-day-major'
  if (grid.resources !== null) {
    return grid.headings.length > 1
      ? 'bc-time-grid bc-time-grid-resources bc-time-grid-resources-week'
      : 'bc-time-grid bc-time-grid-resources bc-time-grid-resources-day'
  }
  return 'bc-time-grid'
}

/**
 * Inject all state for an Angular time-grid view template (week, work_week, day).
 * Reads from the nearest `<bc-calendar-provider>` ancestor via `injectCalendar()`.
 *
 * Returns `Signal<TimeGrid<TEvent> | null>` — re-computes automatically when
 * events, view, or date change. `null` when the active view is not a time grid.
 *
 * Must be called in an Angular injection context (constructor or field initializer).
 */
export function injectTimeGridView<TEvent = unknown>(): InjectTimeGridViewReturn<TEvent> {
  const ctx = injectCalendar<TEvent>()
  const destroyRef = inject(DestroyRef)
  const { messages: rawMessages, descriptionIds } = ctx

  // Angular writable signal — populated once CalendarProviderComponent's
  // store-creation effect fires via the storeSignal bridge.
  const _viewModel = signal<CalendarViewModel<TEvent> | null>(null)
  const _dndEnabled = signal<boolean>(false)
  const _selRange = signal<SelectionRange | null>(null)
  const _selAnchor = signal<{ mode: string; date: string; resourceId?: ResourceId | undefined } | null>(null)
  const _dragPreview = signal<{ start: string; end: string } | null>(null)

  const cleanups: (() => void)[] = []

  // Track selected event id (preact signal → Angular signal).
  const _selectedId = signal<string | null>(null)

  effect(() => {
    const store = ctx.storeSignal()
    if (!store) return
    cleanups.push(
      store.viewModel.subscribe((vm) => _viewModel.set(vm as CalendarViewModel<TEvent>)),
    )
    cleanups.push(
      store.selected.subscribe((id) => _selectedId.set(id != null ? String(id) : null)),
    )
    cleanups.push(store.dndEnabled.subscribe((v) => _dndEnabled.set(v)))
    cleanups.push(store.selection.range.subscribe((r) => _selRange.set(r)))
    cleanups.push(
      store.selection.anchor.subscribe((a) =>
        _selAnchor.set(
          a != null ? { mode: a.mode, date: a.date, resourceId: a.resourceId } : null,
        ),
      ),
    )
    cleanups.push(store.dragPreview.subscribe((p) => _dragPreview.set(p)))
  })

  // Single/double-click disambiguation — shared per view.
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

  const grid = computed((): TimeGrid<TEvent> | null => {
    const store = ctx.storeSignal()
    if (!store) return null
    const vm = _viewModel()
    if (!vm || vm.kind !== 'time') return null

    const { localizer, accessors, getNow, step, timeslots } = store
    const now = getNow()
    const id = wrapAccessor(accessors.id)
    const title = wrapAccessor(accessors.title)
    const start = wrapAccessor(accessors.start)
    const { days, columns, allDay, resources, dayGroups } = vm.timeGrid

    const headings: TimeDayHeading[] = days.map((day) => ({
      day,
      label: localizer.format({ value: day, format: 'dayColumnHeader' }),
      isToday: localizer.isSameDate({ a: day, b: now }),
    }))

    const firstColumn =
      columns[0] ?? resources?.[0]?.columns[0] ?? dayGroups?.[0]?.cells[0]?.column
    const gutter: TimeGutterLabel[] = []
    let slotCount = 0
    if (firstColumn) {
      const metrics = createSlotMetrics({
        localizer,
        min: firstColumn.min,
        max: firstColumn.max,
        step,
        timeslots,
      })
      slotCount = metrics.numSlots
      for (let group = 0; group * timeslots < metrics.numSlots; group++) {
        const time = metrics.slots[group * timeslots] ?? ''
        gutter.push({
          key: String(group),
          time,
          label: localizer.format({ value: time, format: 'timeGutter' }),
        })
      }
    }

    const resolveColumn = (
      column: (typeof columns)[number],
      keyBase: string,
    ): TimeColumn<TEvent> => {
      const isToday = localizer.isSameDate({ a: column.date, b: now })
      const events: TimePositionedEvent<TEvent>[] = column.events.map((placed, i) => ({
        key: `${keyBase}-${i}-${String(id(placed.event) ?? '')}`,
        event: placed.event,
        title: title(placed.event) ?? '',
        time: formatEventTime({
          localizer,
          allDayLabel: rawMessages.allDay,
          start: start(placed.event),
          end: null,
          allDay: false,
          format: 'time',
        }),
        top: placed.top,
        height: placed.height,
        left: placed.left,
        width: placed.width,
        zIndex: placed.zIndex,
      }))

      const bgEvents: TimeBackgroundEvent<TEvent>[] = column.backgroundEvents.map(
        (placed, i) => ({
          key: `${keyBase}-bg-${i}-${String(id(placed.event) ?? '')}`,
          event: placed.event,
          title: title(placed.event) ?? '',
          top: placed.top,
          height: placed.height,
          left: placed.left,
          width: placed.width,
          isStart: placed.isStart,
          isEnd: placed.isEnd,
        }),
      )

      const metrics = createSlotMetrics({
        localizer,
        min: column.min,
        max: column.max,
        step,
        timeslots,
      })
      const slots = metrics.slots.slice(0, metrics.numSlots)

      let nowTop: number | null = null
      if (isToday) {
        const top = metrics.getCurrentTimePosition(now)
        if (top >= 0 && top <= 1) nowTop = top
      }

      return {
        key: keyBase,
        day: column.date,
        resourceId: column.resourceId,
        min: column.min,
        max: column.max,
        isToday,
        events,
        backgroundEvents: bgEvents,
        nowTop,
        slots,
      }
    }

    const resolveAllDay = (
      rows: typeof allDay,
      keyBase: string,
    ): TimeAllDayRow<TEvent> => {
      const segments: TimeAllDaySegment<TEvent>[] = rows.levels.flatMap((level, rowIndex) =>
        level.map((segment, segIndex) => ({
          key: `${keyBase}-${rowIndex}-${segIndex}-${String(id(segment.event) ?? '')}`,
          event: segment.event,
          title: title(segment.event) ?? '',
          left: segment.left,
          span: segment.span,
          row: rowIndex + 1,
        })),
      )

      const extraByCol = new Map<number, { key: string; event: TEvent; title: string }[]>()
      rows.extra.forEach((segment, extraIndex) => {
        const entry = extraByCol.get(segment.left) ?? []
        entry.push({
          key: `${keyBase}-extra-${extraIndex}-${String(id(segment.event) ?? '')}`,
          event: segment.event,
          title: title(segment.event) ?? '',
        })
        extraByCol.set(segment.left, entry)
      })

      const extra: TimeAllDayExtra<TEvent>[] | null =
        extraByCol.size > 0
          ? [...extraByCol.entries()].map(([col, events]) => ({
              col,
              count: events.length,
              events,
            }))
          : null

      return { segments, extra }
    }

    if (resources !== null) {
      return {
        headings,
        gutter,
        slotCount,
        allDay: { segments: [], extra: null },
        columns: [],
        resources: resources.map((group) => {
          const base = `r${String(group.resourceId)}`
          return {
            key: base,
            resourceId: group.resourceId,
            resourceTitle: group.resourceTitle,
            resourceType: group.resourceType,
            columns: group.columns.map((col, i) => resolveColumn(col, `${base}-${i}`)),
            allDay: resolveAllDay(group.allDay, base),
          }
        }),
        dayGroups: null,
      }
    }

    if (dayGroups !== null) {
      return {
        headings,
        gutter,
        slotCount,
        allDay: { segments: [], extra: null },
        columns: [],
        resources: null,
        dayGroups: dayGroups.map((group, dayIndex) => ({
          key: `d${dayIndex}`,
          date: group.date,
          label: localizer.format({ value: group.date, format: 'dayColumnHeader' }),
          isToday: localizer.isSameDate({ a: group.date, b: now }),
          cells: group.cells.map((cell, cellIndex) => {
            const base = `d${dayIndex}-r${String(cell.resourceId)}-${cellIndex}`
            return {
              key: base,
              resourceId: cell.resourceId,
              resourceTitle: cell.resourceTitle,
              resourceType: cell.resourceType,
              column: resolveColumn(cell.column, base),
              allDay: resolveAllDay(cell.allDay, base),
            }
          }),
        })),
      }
    }

    return {
      headings,
      gutter,
      slotCount,
      allDay: resolveAllDay(allDay, 'a'),
      columns: columns.map((col, i) => resolveColumn(col, String(i))),
      resources: null,
      dayGroups: null,
    }
  })

  const onSlotsPointerDown = injectSlotSelection('time', () => grid()?.slotCount)
  const onAllDayPointerDown = injectSlotSelection('day')

  return {
    grid,
    getRootClass: computeRootClass,
    getRootStyle: (leafCount: number): Record<string, string> => {
      const store = ctx.storeSignal()
      return {
        ...(dayCountStyle(leafCount) as Record<string, string>),
        ...(slotGroupStyle(store ? store.timeslots : 2) as Record<string, string>),
      }
    },
    getSlotProps: (column, colIndex, slotIndex) => ({
      'data-date': column.day,
      'data-slot-index': colIndex * (grid()?.slotCount ?? 0) + slotIndex,
      'data-bc-instant': column.slots[slotIndex] ?? '',
      'aria-describedby': descriptionIds.selection,
    }),
    allDayLabel: rawMessages.allDay,
    onSlotsPointerDown,
    onAllDayPointerDown,
    isDraggable: (event) => _dndEnabled() && (ctx.storeSignal()?.isDraggable(event) ?? false),
    isResizable: (event) => _dndEnabled() && (ctx.storeSignal()?.isResizable(event) ?? false),
    bodyNowTop: (): number | null => {
      const g = grid()
      if (!g) return null
      let cols: TimeColumn<TEvent>[]
      if (g.columns.length > 0) {
        cols = g.columns
      } else if (g.resources != null && g.resources[0]?.columns != null) {
        cols = g.resources[0].columns
      } else if (g.dayGroups != null && g.dayGroups[0]?.cells[0]?.column != null) {
        cols = [g.dayGroups[0].cells[0].column]
      } else {
        cols = []
      }
      for (const col of cols) {
        if (col.nowTop !== null) return col.nowTop
      }
      return null
    },
    getEventId: _getEventId,
    isEventSelected: (event) => {
      const id = _getEventId(event)
      return id != null && _selectedId() === id
    },
    handleEventClick: (event, domEvent) => {
      if (domEvent.detail === 0) return
      if (_clickTimer !== null) return
      const e = domEvent
      _clickTimer = setTimeout(() => {
        _clickTimer = null
        _selectEvent(event)
        ctx.storeSignal()?.eventHandlers.click(event, e)
      }, 250)
    },
    handleEventDblClick: (event, domEvent) => {
      if (_clickTimer !== null) { clearTimeout(_clickTimer); _clickTimer = null }
      _selectEvent(event)
      ctx.storeSignal()?.eventHandlers.doubleClick(event, domEvent)
    },
    handleEventKeyDown: (event, domEvent) => {
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
    handleEventContextMenu: (event, domEvent) => {
      const store = ctx.storeSignal()
      if (store?.eventHandlers.hasRightClick) store.eventHandlers.rightClick(event, domEvent)
    },
    handleEventAuxClick: (event, domEvent) => {
      if (domEvent.button !== 1) return
      const store = ctx.storeSignal()
      if (store?.eventHandlers.hasMiddleClick) store.eventHandlers.middleClick(event, domEvent)
    },
    getTimeSelectionStyle: (colIndex: number): Record<string, string> | null => {
      const slotCount = grid()?.slotCount ?? 0
      const range = _selRange()
      const anchor = _selAnchor()
      if (range === null || anchor?.mode !== 'time' || slotCount <= 0) return null
      const startDay = Math.floor(range.start / slotCount)
      const endDay = Math.floor(range.end / slotCount)
      if (colIndex < startDay || colIndex > endDay) return null
      const startSlot = range.start - startDay * slotCount
      const endSlot = range.end - endDay * slotCount
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
      return selectionStyle({ top: top / slotCount, height: (bottom - top) / slotCount }) as Record<string, string>
    },
    getResourceSelectionStyle: (resourceId: ResourceId, date: string): Record<string, string> | null => {
      const slotCount = grid()?.slotCount ?? 0
      const range = _selRange()
      const anchor = _selAnchor()
      if (range === null || anchor?.mode !== 'time' || slotCount <= 0) return null
      if (anchor.resourceId == null || String(anchor.resourceId) !== String(resourceId)) return null
      if (anchor.date !== date) return null
      return selectionStyle({
        top: range.start / slotCount,
        height: (range.end - range.start + 1) / slotCount,
      }) as Record<string, string>
    },
    getPreviewStyle: (column: { min: string; max: string }): Record<string, string> | null => {
      const preview = _dragPreview()
      if (preview === null) return null
      const store = ctx.storeSignal()
      if (!store) return null
      const metrics = createSlotMetrics({
        localizer: store.localizer,
        min: column.min,
        max: column.max,
        step: store.step,
        timeslots: store.timeslots,
      })
      const range = metrics.getRange({ start: preview.start, end: preview.end })
      if (range.height <= 0) return null
      return selectionStyle({ top: range.top, height: range.height }) as Record<string, string>
    },
  }
}
