import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import { styleMap } from 'lit/directives/style-map.js'
import { classMap } from 'lit/directives/class-map.js'
import { ref } from 'lit/directives/ref.js'
import { ContextConsumer } from '@lit/context'
import { effect } from '@preact/signals-core'
import { createSlotMetrics, wrapAccessor } from '@big-calendar/core'
import type { CalendarStore, CalendarViewModel, ResourceId, SelectionRange } from '@big-calendar/core'
import {
  formatEventTime,
  dayCountStyle,
  selectionStyle,
  slotCountStyle,
  slotGroupStyle,
} from '@big-calendar/core/utils'
import { calendarContext } from '../CalendarController/calendarContext'
import type { CalendarContextValue } from '../CalendarController/calendarContext'
import { createSlotPointerHandler } from '../internal/slotSelection'

// ---- Data types --------------------------------------------------------

interface TimeDayHeading {
  day: string
  label: string
  isToday: boolean
}

interface TimeGutterLabel {
  key: string
  time: string
  label: string
}

interface TimePositionedEvent<TEvent> {
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

interface TimeBackgroundEvent<TEvent> {
  key: string
  event: TEvent
  top: number
  height: number
  left: number
  width: number
  isStart: boolean
  isEnd: boolean
}

interface TimeColumn<TEvent> {
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

interface TimeAllDaySegment<TEvent> {
  key: string
  event: TEvent
  title: string
  left: number
  span: number
  row: number
}

interface TimeAllDayExtra<TEvent> {
  col: number
  count: number
  events: { key: string; event: TEvent; title: string }[]
}

interface TimeAllDayRow<TEvent> {
  segments: TimeAllDaySegment<TEvent>[]
  extra: TimeAllDayExtra<TEvent>[] | null
}

interface TimeResourceGroup<TEvent> {
  key: string
  resourceId: ResourceId
  resourceTitle: string
  resourceType: string | null
  columns: TimeColumn<TEvent>[]
  allDay: TimeAllDayRow<TEvent>
}

interface TimeDayResourceCell<TEvent> {
  key: string
  resourceId: ResourceId
  resourceTitle: string
  resourceType: string | null
  column: TimeColumn<TEvent>
  allDay: TimeAllDayRow<TEvent>
}

interface TimeDayGroup<TEvent> {
  key: string
  date: string
  label: string
  isToday: boolean
  cells: TimeDayResourceCell<TEvent>[]
}

interface TimeGrid<TEvent> {
  headings: TimeDayHeading[]
  gutter: TimeGutterLabel[]
  slotCount: number
  allDay: TimeAllDayRow<TEvent>
  columns: TimeColumn<TEvent>[]
  resources: TimeResourceGroup<TEvent>[] | null
  dayGroups: TimeDayGroup<TEvent>[] | null
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

@customElement('bc-time-grid-view')
export class TimeGridViewElement extends LitElement {
  override createRenderRoot() {
    return this
  }

  private _grid: TimeGrid<unknown> | null = null
  private _dndEnabled = false
  private _selRange: SelectionRange | null = null
  private _selAnchor: { mode: string; date: string; resourceId?: ResourceId | undefined } | null = null
  private _dragPreview: { start: string; end: string } | null = null
  private _selectedId: string | null = null
  private _store: CalendarStore | null = null
  private _disposes: (() => void)[] = []
  private _clickTimer: ReturnType<typeof setTimeout> | null = null
  private _slotsHandler: ((e: PointerEvent) => void) | null = null
  private _slotsTeardown: (() => void) | null = null
  private _allDayHandler: ((e: PointerEvent) => void) | null = null
  private _allDayTeardown: (() => void) | null = null
  private _scrolled = false

  private _ctx = new ContextConsumer(this, {
    context: calendarContext,
    subscribe: true,
    callback: (value: CalendarContextValue | undefined) => {
      if (value) this._onContextAvailable(value)
    },
  })

  private _onContextAvailable(ctx: CalendarContextValue): void {
    this._disposes.forEach((d) => d())
    this._disposes = []
    const store = ctx.store
    if (!store) return
    this._store = store

    if (this._slotsTeardown) this._slotsTeardown()
    const slotsSel = createSlotPointerHandler('time', () => this._store as CalendarStore | null, () => this._grid?.slotCount)
    this._slotsHandler = slotsSel.handler
    this._slotsTeardown = slotsSel.teardown

    if (this._allDayTeardown) this._allDayTeardown()
    const allDaySel = createSlotPointerHandler('day', () => this._store as CalendarStore | null)
    this._allDayHandler = allDaySel.handler
    this._allDayTeardown = allDaySel.teardown

    this._disposes.push(
      effect(() => {
        const vm = store.viewModel.value as CalendarViewModel<unknown>
        this._computeGrid(vm, store)
        this.requestUpdate()
      }),
    )
    this._disposes.push(
      effect(() => {
        const id = store.selected.value
        this._selectedId = id != null ? String(id) : null
        this.requestUpdate()
      }),
    )
    this._disposes.push(
      effect(() => {
        this._dndEnabled = store.dndEnabled.value
        this.requestUpdate()
      }),
    )
    this._disposes.push(
      effect(() => {
        this._selRange = store.selection.range.value
        this.requestUpdate()
      }),
    )
    this._disposes.push(
      effect(() => {
        const a = store.selection.anchor.value
        this._selAnchor = a != null
          ? { mode: a.mode, date: a.date, resourceId: a.resourceId }
          : null
        this.requestUpdate()
      }),
    )
    this._disposes.push(
      effect(() => {
        this._dragPreview = store.dragPreview.value
        this.requestUpdate()
      }),
    )
  }

  private _computeGrid(vm: CalendarViewModel<unknown> | null, store: CalendarStore): void {
    if (!vm || vm.kind !== 'time') {
      this._grid = null
      return
    }

    const { localizer, accessors, getNow, step, timeslots } = store
    const now = getNow()
    const id = wrapAccessor(accessors.id)
    const title = wrapAccessor(accessors.title)
    const start = wrapAccessor(accessors.start)
    const msgs = this._ctx.value?.messages
    const allDayLabel = msgs?.allDay ?? 'All day'
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
      column: typeof columns[number],
      keyBase: string,
    ): TimeColumn<unknown> => {
      const isToday = localizer.isSameDate({ a: column.date, b: now })
      const events: TimePositionedEvent<unknown>[] = column.events.map((placed, i) => ({
        key: `${keyBase}-${i}-${String(id(placed.event) ?? '')}`,
        event: placed.event,
        title: title(placed.event) ?? '',
        time: formatEventTime({
          localizer,
          allDayLabel,
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

      const bgEvents: TimeBackgroundEvent<unknown>[] = column.backgroundEvents.map((placed, i) => ({
        key: `${keyBase}-bg-${i}-${String(id(placed.event) ?? '')}`,
        event: placed.event,
        top: placed.top,
        height: placed.height,
        left: placed.left,
        width: placed.width,
        isStart: placed.isStart,
        isEnd: placed.isEnd,
      }))

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

    const resolveAllDay = (rows: typeof allDay, keyBase: string): TimeAllDayRow<unknown> => {
      const segments: TimeAllDaySegment<unknown>[] = rows.levels.flatMap((level, rowIndex) =>
        level.map((segment, segIndex) => ({
          key: `${keyBase}-${rowIndex}-${segIndex}-${String(id(segment.event) ?? '')}`,
          event: segment.event,
          title: title(segment.event) ?? '',
          left: segment.left,
          span: segment.span,
          row: rowIndex + 1,
        })),
      )

      const extraByCol = new Map<number, { key: string; event: unknown; title: string }[]>()
      rows.extra.forEach((segment, extraIndex) => {
        const entry = extraByCol.get(segment.left) ?? []
        entry.push({
          key: `${keyBase}-extra-${extraIndex}-${String(id(segment.event) ?? '')}`,
          event: segment.event,
          title: title(segment.event) ?? '',
        })
        extraByCol.set(segment.left, entry)
      })

      const extra: TimeAllDayExtra<unknown>[] | null =
        extraByCol.size > 0
          ? [...extraByCol.entries()].map(([col, events]) => ({ col, count: events.length, events }))
          : null

      return { segments, extra }
    }

    if (resources !== null) {
      this._grid = {
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
      return
    }

    if (dayGroups !== null) {
      this._grid = {
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
      return
    }

    this._grid = {
      headings,
      gutter,
      slotCount,
      allDay: resolveAllDay(allDay, 'a'),
      columns: columns.map((col, i) => resolveColumn(col, String(i))),
      resources: null,
      dayGroups: null,
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this._disposes.forEach((d) => d())
    this._disposes = []
    if (this._clickTimer !== null) clearTimeout(this._clickTimer)
    this._slotsTeardown?.()
    this._allDayTeardown?.()
    this._store = null
    this._scrolled = false
  }

  private _getEventId(event: unknown): string | undefined {
    if (!this._store) return undefined
    const id = wrapAccessor(this._store.accessors.id)(event)
    return id != null ? String(id) : undefined
  }

  private _selectEvent(event: unknown): void {
    if (!this._store) return
    const id = wrapAccessor(this._store.accessors.id)(event)
    if (id != null) this._store.selectEvent({ id })
  }

  private _isDraggable(event: unknown): boolean {
    return this._dndEnabled && (this._store?.isDraggable(event) ?? false)
  }

  private _isResizable(event: unknown): boolean {
    return this._dndEnabled && (this._store?.isResizable(event) ?? false)
  }

  private _isEventSelected(event: unknown): boolean {
    const id = this._getEventId(event)
    return id != null && this._selectedId === id
  }

  private _leafColumnCount(): number {
    const g = this._grid
    if (!g) return 1
    if (g.dayGroups !== null) return g.dayGroups.reduce((n, dg) => n + dg.cells.length, 0)
    if (g.resources !== null) return g.resources.reduce((n, r) => n + r.columns.length, 0)
    return g.columns.length
  }

  private _getRootStyle(): Record<string, string> {
    const store = this._store
    const slotCount = this._grid?.slotCount ?? 0
    return {
      ...(dayCountStyle(this._leafColumnCount()) as Record<string, string>),
      ...(slotGroupStyle(store ? store.timeslots : 2) as Record<string, string>),
      ...(slotCount > 0 ? slotCountStyle(slotCount) as Record<string, string> : {}),
    }
  }

  private _bodyNowTop(): number | null {
    const g = this._grid
    if (!g) return null
    let cols: TimeColumn<unknown>[]
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
  }

  private _getTimeSelectionStyle(colIndex: number): Record<string, string> | null {
    const slotCount = this._grid?.slotCount ?? 0
    const range = this._selRange
    const anchor = this._selAnchor
    if (range === null || anchor?.mode !== 'time' || slotCount <= 0) return null
    const startDay = Math.floor(range.start / slotCount)
    const endDay = Math.floor(range.end / slotCount)
    if (colIndex < startDay || colIndex > endDay) return null
    const startSlot = range.start - startDay * slotCount
    const endSlot = range.end - endDay * slotCount
    let top: number
    let bottom: number
    if (startDay === endDay) {
      top = startSlot; bottom = endSlot + 1
    } else if (colIndex === startDay) {
      top = startSlot; bottom = slotCount
    } else if (colIndex === endDay) {
      top = 0; bottom = endSlot + 1
    } else {
      top = 0; bottom = slotCount
    }
    return selectionStyle({ top: top / slotCount, height: (bottom - top) / slotCount }) as Record<string, string>
  }

  private _getResourceSelectionStyle(resourceId: ResourceId, date: string): Record<string, string> | null {
    const slotCount = this._grid?.slotCount ?? 0
    const range = this._selRange
    const anchor = this._selAnchor
    if (range === null || anchor?.mode !== 'time' || slotCount <= 0) return null
    if (anchor.resourceId == null || String(anchor.resourceId) !== String(resourceId)) return null
    if (anchor.date !== date) return null
    return selectionStyle({
      top: range.start / slotCount,
      height: (range.end - range.start + 1) / slotCount,
    }) as Record<string, string>
  }

  private _getPreviewStyle(column: { min: string; max: string }): Record<string, string> | null {
    const preview = this._dragPreview
    if (preview === null || !this._store) return null
    const metrics = createSlotMetrics({
      localizer: this._store.localizer,
      min: column.min,
      max: column.max,
      step: this._store.step,
      timeslots: this._store.timeslots,
    })
    const range = metrics.getRange({ start: preview.start, end: preview.end })
    if (range.height <= 0) return null
    return selectionStyle({ top: range.top, height: range.height }) as Record<string, string>
  }

  private _handleEventClick(event: unknown, domEvent: MouseEvent): void {
    if (domEvent.detail === 0) return
    if (this._clickTimer !== null) return
    const e = domEvent
    this._clickTimer = setTimeout(() => {
      this._clickTimer = null
      this._selectEvent(event)
      this._store?.eventHandlers.click(event, e)
    }, 250)
  }

  private _handleEventDblClick(event: unknown, domEvent: MouseEvent): void {
    if (this._clickTimer !== null) { clearTimeout(this._clickTimer); this._clickTimer = null }
    this._selectEvent(event)
    this._store?.eventHandlers.doubleClick(event, domEvent)
  }

  private _handleEventKeyDown(event: unknown, domEvent: KeyboardEvent): void {
    if (!this._store) return
    if (domEvent.key === 'Enter' || domEvent.key === ' ') {
      domEvent.preventDefault()
      this._selectEvent(event)
      this._store.eventHandlers.click(event, domEvent)
    } else if (domEvent.key === 'F2') {
      domEvent.preventDefault()
      this._selectEvent(event)
      this._store.eventHandlers.doubleClick(event, domEvent)
    }
  }

  private _handleEventContextMenu(event: unknown, domEvent: MouseEvent): void {
    const store = this._store
    if (store?.eventHandlers.hasRightClick) store.eventHandlers.rightClick(event, domEvent)
  }

  private _handleEventAuxClick(event: unknown, domEvent: MouseEvent): void {
    if (domEvent.button !== 1) return
    const store = this._store
    if (store?.eventHandlers.hasMiddleClick) store.eventHandlers.middleClick(event, domEvent)
  }

  private _initScroll(bodyEl: HTMLElement): void {
    if (this._scrolled) return
    const colEl = bodyEl.querySelector<HTMLElement>('.bc-day-column')
    if (!colEl || colEl.offsetHeight === 0) return
    const store = this._store
    if (!store) return
    const grid = this._grid
    if (!grid) return

    const firstCol =
      grid.columns[0] ??
      grid.resources?.[0]?.columns[0] ??
      grid.dayGroups?.[0]?.cells[0]?.column
    if (!firstCol) return

    const colHeight = colEl.offsetHeight
    const { localizer, scrollToTime, getNow } = store
    const dayStartMin = localizer.getMinutesFromMidnight(firstCol.min)
    const totalMin = localizer.getTotalMin({ start: firstCol.min, end: firstCol.max })
    if (totalMin === 0) return

    const targetMin =
      scrollToTime != null
        ? scrollToTime.hour * 60 + (scrollToTime.minute ?? 0)
        : localizer.getMinutesFromMidnight(getNow())

    const fraction = Math.max(0, Math.min(1, (targetMin - dayStartMin) / totalMin))
    bodyEl.scrollTo({ top: Math.round(fraction * colHeight), behavior: 'instant' })
    this._scrolled = true
  }

  private _renderTimedEvent(event: TimePositionedEvent<unknown>) {
    const draggable = this._isDraggable(event.event)
    const resizable = this._isResizable(event.event)
    const eventStyle: Record<string, string> = {
      top: `${event.top * 100}%`,
      height: `${event.height * 100}%`,
      left: `${event.left * 100}%`,
      width: `${event.width * 100}%`,
      'z-index': String(event.zIndex),
    }
    return html`
      <button
        type="button"
        class=${classMap({ 'bc-event': true, 'bc-event-draggable': draggable })}
        style=${styleMap(eventStyle)}
        data-bc-event=${this._getEventId(event.event) ?? ''}
        aria-selected=${this._isEventSelected(event.event)}
        @click=${(e: MouseEvent) => this._handleEventClick(event.event, e)}
        @dblclick=${(e: MouseEvent) => this._handleEventDblClick(event.event, e)}
        @keydown=${(e: KeyboardEvent) => this._handleEventKeyDown(event.event, e)}
        @contextmenu=${(e: MouseEvent) => this._handleEventContextMenu(event.event, e)}
        @auxclick=${(e: MouseEvent) => this._handleEventAuxClick(event.event, e)}
        @pointerdown=${(e: Event) => e.stopPropagation()}
      >
        <span class="bc-event-title">${event.title}</span>
        <time class="bc-event-time">${event.time}</time>
        ${when(resizable, () => html`
          <div class="bc-resize-handle bc-resize-handle-start" data-bc-resize="start"></div>
          <div class="bc-resize-handle bc-resize-handle-end" data-bc-resize="end"></div>
        `)}
      </button>
    `
  }

  private _renderAllDaySegment(segment: TimeAllDaySegment<unknown>, stacked = false) {
    const draggable = this._isDraggable(segment.event)
    const gridStyle: Record<string, string> = stacked ? {} : {
      'grid-column': `${segment.left} / span ${segment.span}`,
      'grid-row': String(segment.row),
    }
    const segClass = stacked ? { 'bc-segment': true, 'bc-segment-stacked': true, 'bc-event-draggable': draggable } : { 'bc-segment': true, 'bc-event-draggable': draggable }
    return html`
      <button
        type="button"
        class=${classMap(segClass)}
        style=${styleMap(gridStyle)}
        data-bc-event=${this._getEventId(segment.event) ?? ''}
        aria-selected=${this._isEventSelected(segment.event)}
        @click=${(e: MouseEvent) => this._handleEventClick(segment.event, e)}
        @dblclick=${(e: MouseEvent) => this._handleEventDblClick(segment.event, e)}
        @keydown=${(e: KeyboardEvent) => this._handleEventKeyDown(segment.event, e)}
        @contextmenu=${(e: MouseEvent) => this._handleEventContextMenu(segment.event, e)}
        @auxclick=${(e: MouseEvent) => this._handleEventAuxClick(segment.event, e)}
        @pointerdown=${(e: Event) => e.stopPropagation()}
      >
        <span class="bc-event-title">${segment.title}</span>
      </button>
    `
  }

  private _renderDayColumn(column: TimeColumn<unknown>, colIndex: number, resourceId?: ResourceId, resourceType?: string | null) {
    const selStyle = this._getTimeSelectionStyle(colIndex)
    const prevStyle = this._getPreviewStyle(column)
    return html`
      <div
        class=${classMap({ 'bc-day-column': true, 'bc-today': column.isToday })}
        data-bc-resource=${resourceId != null ? String(resourceId) : ''}
        data-bc-resource-type=${resourceType ?? ''}
      >
        <div class="bc-time-slots">
          ${column.slots.map((slot, slotIndex) => html`
            <div
              class="bc-time-slot"
              data-date=${column.day}
              data-slot-index=${colIndex * (this._grid?.slotCount ?? 0) + slotIndex}
              data-bc-instant=${slot}
              data-bc-resource=${resourceId != null ? String(resourceId) : ''}
            ></div>
          `)}
        </div>
        ${column.backgroundEvents.map((bg) => html`
          <div
            class="bc-bg-event"
            style=${styleMap({
              top: `${bg.top * 100}%`,
              height: `${bg.height * 100}%`,
              left: `${bg.left * 100}%`,
              width: `${bg.width * 100}%`,
            })}
          ></div>
        `)}
        ${column.events.map((event) => this._renderTimedEvent(event))}
        ${when(selStyle !== null, () => html`<div class="bc-selection" style=${styleMap(selStyle!)}></div>`)}
        ${when(prevStyle !== null, () => html`<div class="bc-drag-preview" style=${styleMap(prevStyle!)}></div>`)}
      </div>
    `
  }

  private _renderResourceDayColumn(column: TimeColumn<unknown>, colIndex: number, resourceId: ResourceId, resourceType: string | null) {
    const selStyle = this._getResourceSelectionStyle(resourceId, column.day)
    const prevStyle = this._getPreviewStyle(column)
    return html`
      <div
        class=${classMap({ 'bc-day-column': true, 'bc-today': column.isToday })}
        data-bc-resource=${String(resourceId)}
        data-bc-resource-type=${resourceType ?? ''}
      >
        <div class="bc-time-slots">
          ${column.slots.map((slot, slotIndex) => html`
            <div
              class="bc-time-slot"
              data-date=${column.day}
              data-slot-index=${colIndex * (this._grid?.slotCount ?? 0) + slotIndex}
              data-bc-instant=${slot}
              data-bc-resource=${String(resourceId)}
            ></div>
          `)}
        </div>
        ${column.events.map((event) => this._renderTimedEvent(event))}
        ${when(selStyle !== null, () => html`<div class="bc-selection" style=${styleMap(selStyle!)}></div>`)}
        ${when(prevStyle !== null, () => html`<div class="bc-drag-preview" style=${styleMap(prevStyle!)}></div>`)}
      </div>
    `
  }

  override render() {
    const grid = this._grid
    if (!grid) return html``

    const rootClass = computeRootClass(grid)
    const rootStyle = this._getRootStyle()
    const allDayLabel = this._ctx.value?.messages.allDay ?? 'All day'
    const nowTop = this._bodyNowTop()

    return html`
      <div class=${rootClass} style=${styleMap(rootStyle)}>

        <!-- ── Plain time-grid (no resources) ───────────────────────────── -->
        ${when(grid.resources === null && grid.dayGroups === null, () => html`
          <div class="bc-time-head">
            <div class="bc-time-header">
              <div class="bc-time-header-gutter"></div>
              ${grid.headings.map((heading) => html`
                <div
                  class=${classMap({ 'bc-day-heading': true, 'bc-today': heading.isToday })}
                  role="columnheader"
                >${heading.label}</div>
              `)}
            </div>
            <div class=${classMap({ 'bc-allday-row': true, 'bc-show-all-events': this._store?.showAllEvents ?? false })}>
              <div class="bc-allday-label">${allDayLabel}</div>
              <div class="bc-allday-slots" @pointerdown=${this._allDayHandler ?? null}>
                ${grid.headings.map((heading, i) => html`
                  <div
                    class="bc-allday-slot"
                    data-date=${heading.day}
                    data-slot-index=${i}
                    tabindex="0"
                  ></div>
                `)}
              </div>
              <div class="bc-allday-segments" data-bc-allday-segments="">
                ${grid.allDay.segments.map((seg) => this._renderAllDaySegment(seg))}
              </div>
            </div>
          </div>

          <div
            class="bc-time-body"
            @pointerdown=${this._slotsHandler ?? null}
            ${ref((el) => {
              if (el instanceof HTMLElement) {
                requestAnimationFrame(() => this._initScroll(el))
              }
            })}
          >
            <div class="bc-time-gutter">
              ${grid.gutter.map((label) => html`
                <div class="bc-time-label">${label.label}</div>
              `)}
            </div>
            ${grid.columns.map((column, colIndex) => this._renderDayColumn(column, colIndex))}
            ${when(nowTop !== null, () => html`
              <div class="bc-now-indicator" style="--bc-now-top: ${nowTop}"></div>
            `)}
          </div>
        `)}

        <!-- ── Resource layouts (resource-major) ────────────────────────── -->
        ${when(grid.resources !== null, () => {
          const isWeek = grid.headings.length > 1
          const daysPerGroup = grid.headings.length
          return html`
            <div class="bc-time-head">
              ${when(isWeek, () => html`
                <div class="bc-time-header bc-time-header-tiered">
                  <div class="bc-time-header-gutter" aria-hidden="true" style="grid-row: 1 / 3"></div>
                  ${grid.resources!.map((group, gi) => html`
                    <div
                      class="bc-header bc-resource-header"
                      role="columnheader"
                      style=${styleMap({ 'grid-column': `${2 + gi * daysPerGroup} / span ${daysPerGroup}`, 'grid-row': '1' })}
                    >${group.resourceTitle}</div>
                    ${group.columns.map((column, di) => html`
                      <div
                        class="bc-resource-day-head"
                        style=${styleMap({ 'grid-column': String(2 + gi * daysPerGroup + di), 'grid-row': '2' })}
                      >
                        <div
                          class=${classMap({ 'bc-day-heading': true, 'bc-today': column.isToday })}
                          role="columnheader"
                        >${grid.headings[di]?.label ?? ''}</div>
                      </div>
                    `)}
                  `)}
                </div>
              `, () => html`
                <div class="bc-time-header">
                  <div class="bc-time-header-gutter"></div>
                  ${grid.resources!.map((group) => html`
                    <div class="bc-header bc-resource-header" role="columnheader">${group.resourceTitle}</div>
                  `)}
                </div>
              `)}

              <div class=${classMap({ 'bc-allday-row': true, 'bc-show-all-events': this._store?.showAllEvents ?? false })} @pointerdown=${this._allDayHandler ?? null}>
                <div class="bc-allday-label">${allDayLabel}</div>
                ${when(isWeek, () => html`
                  ${grid.resources!.map((group, gi) => html`
                    <div
                      class="bc-allday-resource bc-allday-resource-week"
                      data-bc-resource=${String(group.resourceId)}
                      data-bc-resource-type=${group.resourceType ?? ''}
                      style=${styleMap({ 'grid-column': `${2 + gi * daysPerGroup} / span ${daysPerGroup}`, 'grid-row': '1' })}
                    >
                      <div
                        class="bc-allday-resource-slots"
                        style=${styleMap({ 'grid-template-columns': `repeat(${daysPerGroup}, minmax(0, 1fr))` })}
                      >
                        ${group.columns.map((column, di) => html`
                          <div
                            class=${classMap({ 'bc-allday-slot': true, 'bc-today': column.isToday })}
                            data-date=${column.day}
                            data-bc-allday=${column.day}
                            data-slot-index=${di}
                          ></div>
                        `)}
                      </div>
                      <div class="bc-allday-resource-segments" data-bc-allday-segments="">
                        ${group.allDay.segments.map((seg) => this._renderAllDaySegment(seg))}
                      </div>
                    </div>
                  `)}
                `, () => html`
                  ${grid.resources!.map((group) => html`
                    <div
                      class=${classMap({
                        'bc-allday-resource': true,
                        'bc-today': group.columns[0]?.isToday ?? false,
                      })}
                      data-bc-resource=${String(group.resourceId)}
                      data-bc-resource-type=${group.resourceType ?? ''}
                    >
                      <div
                        class=${classMap({
                          'bc-allday-slot': true,
                          'bc-today': group.columns[0]?.isToday ?? false,
                        })}
                        data-date=${group.columns[0]?.day ?? ''}
                        data-bc-allday=${group.columns[0]?.day ?? ''}
                        data-slot-index="0"
                      ></div>
                      <div class="bc-allday-resource-stack" data-bc-allday-segments="">
                        ${group.allDay.segments.map((seg) => this._renderAllDaySegment(seg, true))}
                      </div>
                    </div>
                  `)}
                `)}
              </div>
            </div>

            <div class="bc-time-body" @pointerdown=${this._slotsHandler ?? null}>
              <div class="bc-time-gutter">
                ${grid.gutter.map((label) => html`<div class="bc-time-label">${label.label}</div>`)}
              </div>
              ${grid.resources!.flatMap((group) =>
                group.columns.map((column, colIndex) =>
                  this._renderResourceDayColumn(column, colIndex, group.resourceId, group.resourceType),
                ),
              )}
              ${when(nowTop !== null, () => html`
                <div class="bc-now-indicator" style="--bc-now-top: ${nowTop}"></div>
              `)}
            </div>
          `
        })}

        <!-- ── Day-major resource layout ────────────────────────────────── -->
        ${when(grid.dayGroups !== null, () => {
          const numResources = grid.dayGroups![0]?.cells?.length ?? 0
          return html`
            <div class="bc-time-head">
              <div class="bc-time-header bc-time-header-tiered">
                <div class="bc-time-header-gutter" aria-hidden="true" style="grid-row: 1 / 3"></div>
                ${grid.dayGroups!.map((dayGroup, di) => html`
                  <div
                    class=${classMap({ 'bc-header bc-day-major-header': true, 'bc-today': dayGroup.isToday })}
                    role="columnheader"
                    style=${styleMap({ 'grid-column': `${2 + di * numResources} / span ${numResources}`, 'grid-row': '1' })}
                  >${dayGroup.label}</div>
                  ${dayGroup.cells.map((cell, ri) => html`
                    <div
                      class="bc-resource-day-head"
                      style=${styleMap({ 'grid-column': String(2 + di * numResources + ri), 'grid-row': '2' })}
                    >
                      <span class="bc-resource-header-label">${cell.resourceTitle}</span>
                    </div>
                  `)}
                `)}
              </div>
              <div class=${classMap({ 'bc-allday-row': true, 'bc-show-all-events': this._store?.showAllEvents ?? false })} @pointerdown=${this._allDayHandler ?? null}>
                <div class="bc-allday-label">${allDayLabel}</div>
                ${grid.dayGroups!.flatMap((dayGroup, di) =>
                  dayGroup.cells.map((cell) => html`
                    <div
                      class=${classMap({ 'bc-allday-resource': true, 'bc-today': dayGroup.isToday })}
                      data-bc-resource=${String(cell.resourceId)}
                      data-bc-resource-type=${cell.resourceType ?? ''}
                    >
                      <div
                        class=${classMap({ 'bc-allday-slot': true, 'bc-today': dayGroup.isToday })}
                        data-date=${dayGroup.date}
                        data-bc-allday=${dayGroup.date}
                        data-slot-index=${di}
                      ></div>
                      <div class="bc-allday-resource-stack" data-bc-allday-segments="">
                        ${cell.allDay.segments.map((seg) => this._renderAllDaySegment(seg, true))}
                      </div>
                    </div>
                  `),
                )}
              </div>
            </div>
            <div class="bc-time-body" @pointerdown=${this._slotsHandler ?? null}>
              <div class="bc-time-gutter">
                ${grid.gutter.map((label) => html`<div class="bc-time-label">${label.label}</div>`)}
              </div>
              ${grid.dayGroups!.flatMap((dayGroup) =>
                dayGroup.cells.map((cell, colIndex) =>
                  this._renderResourceDayColumn(cell.column, colIndex, cell.resourceId, cell.resourceType),
                ),
              )}
              ${when(nowTop !== null, () => html`
                <div class="bc-now-indicator" style="--bc-now-top: ${nowTop}"></div>
              `)}
            </div>
          `
        })}
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bc-time-grid-view': TimeGridViewElement
  }
}
