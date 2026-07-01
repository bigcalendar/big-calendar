import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import { styleMap } from 'lit/directives/style-map.js'
import { classMap } from 'lit/directives/class-map.js'
import { ref } from 'lit/directives/ref.js'
import { ContextConsumer } from '@lit/context'
import { effect } from '@preact/signals-core'
import { wrapAccessor } from '@big-calendar/core'
import type { CalendarStore, CalendarViewModel, ResizeEdge, SelectionRange } from '@big-calendar/core'
import { segmentStyle, monthGridStyle } from '@big-calendar/core/utils'
import { calendarContext } from '../CalendarController/calendarContext'
import type { CalendarContextValue } from '../CalendarController/calendarContext'
import { createSlotPointerHandler } from '../internal/slotSelection'

// ---- Data types --------------------------------------------------------

interface MonthWeekday {
  day: string
  long: string
  short: string
}

interface MonthDayCell<TEvent> {
  day: string
  label: string
  isToday: boolean
  isOffRange: boolean
  extra: { count: number; events: { key: string; event: TEvent; title: string }[] } | null
}

interface MonthSegmentCell<TEvent> {
  key: string
  event: TEvent
  title: string
  left: number
  span: number
  row: number
  resizeStart: boolean
  resizeEnd: boolean
}

interface MonthWeekCell<TEvent> {
  key: string
  days: MonthDayCell<TEvent>[]
  segments: MonthSegmentCell<TEvent>[]
  moreRow: number
}

interface MonthGrid<TEvent> {
  weekdays: MonthWeekday[]
  weeks: MonthWeekCell<TEvent>[]
}

@customElement('bc-month-view')
export class MonthViewElement extends LitElement {
  override createRenderRoot() {
    return this
  }

  private _grid: MonthGrid<unknown> | null = null
  private _selRange: SelectionRange | null = null
  private _selAnchor: { mode: string } | null = null
  private _dragPreview: { start: string; end: string } | null = null
  private _dndEnabled = false
  private _selectedId: string | null = null
  private _descriptionIds: { selection: string; event: string } = { selection: '', event: '' }
  private _store: CalendarStore | null = null
  private _disposes: (() => void)[] = []
  private _clickTimer: ReturnType<typeof setTimeout> | null = null
  private _monthGridEl: HTMLElement | null = null
  private _resizeObserver: ResizeObserver | null = null
  private _slotHandler: ((e: PointerEvent) => void) | null = null
  private _slotTeardown: (() => void) | null = null

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
    this._descriptionIds = ctx.descriptionIds
    const store = ctx.store
    if (!store) return
    this._store = store

    // Set up slot handler
    if (this._slotTeardown) this._slotTeardown()
    const { handler, teardown } = createSlotPointerHandler('day', () => this._store as CalendarStore | null)
    this._slotHandler = handler
    this._slotTeardown = teardown

    this._disposes.push(
      effect(() => {
        const vm = store.viewModel.value as CalendarViewModel<unknown>
        this._computeGrid(vm, store)
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
        this._selAnchor = store.selection.anchor.value as { mode: string } | null
        this.requestUpdate()
      }),
    )
    this._disposes.push(
      effect(() => {
        this._dragPreview = store.dragPreview.value
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
        const id = store.selected.value
        this._selectedId = id != null ? String(id) : null
        this.requestUpdate()
      }),
    )
  }

  private _computeGrid(vm: CalendarViewModel<unknown> | null, store: CalendarStore): void {
    if (!vm || vm.kind !== 'month') {
      this._grid = null
      return
    }

    const { localizer, accessors, getNow } = store
    const now = getNow()
    const focus = store.date.value
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

    const resolvedWeeks: MonthWeekCell<unknown>[] = weeks.map((week, weekIndex) => {
      const days: MonthDayCell<unknown>[] = week.days.map((day, dayIndex) => {
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

      const segments: MonthSegmentCell<unknown>[] = week.levels.flatMap((level, rowIndex) =>
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

    this._grid = { weekdays, weeks: resolvedWeeks }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this._disposes.forEach((d) => d())
    this._disposes = []
    if (this._clickTimer !== null) clearTimeout(this._clickTimer)
    this._slotTeardown?.()
    this._resizeObserver?.disconnect()
    this._resizeObserver = null
    this._store = null
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

  private _getWeekSelectionBand(weekIndex: number): { class: string; style: Record<string, string> } | null {
    const base = weekIndex * 7
    const range = this._selRange
    const anchor = this._selAnchor
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
  }

  private _getWeekPreviewBand(week: MonthWeekCell<unknown>): { class: string; style: Record<string, string> } | null {
    const preview = this._dragPreview
    if (preview === null || !this._store) return null
    const { localizer } = this._store
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
  }

  private _handleSegmentClick(event: unknown, domEvent: MouseEvent): void {
    if (domEvent.detail === 0) return
    if (this._clickTimer !== null) return
    const e = domEvent
    this._clickTimer = setTimeout(() => {
      this._clickTimer = null
      this._selectEvent(event)
      this._store?.eventHandlers.click(event, e)
    }, 250)
  }

  private _handleSegmentDblClick(event: unknown, domEvent: MouseEvent): void {
    if (this._clickTimer !== null) { clearTimeout(this._clickTimer); this._clickTimer = null }
    this._selectEvent(event)
    this._store?.eventHandlers.doubleClick(event, domEvent)
  }

  private _handleSegmentKeyDown(event: unknown, domEvent: KeyboardEvent): void {
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

  private _handleSegmentContextMenu(event: unknown, domEvent: MouseEvent): void {
    const store = this._store
    if (store?.eventHandlers.hasRightClick) store.eventHandlers.rightClick(event, domEvent)
  }

  private _handleSegmentAuxClick(event: unknown, domEvent: MouseEvent): void {
    if (domEvent.button !== 1) return
    const store = this._store
    if (store?.eventHandlers.hasMiddleClick) store.eventHandlers.middleClick(event, domEvent)
  }

  private _onMonthGridRef(el: HTMLElement | null): void {
    if (el === this._monthGridEl) return
    this._resizeObserver?.disconnect()
    this._resizeObserver = null
    this._monthGridEl = el
    if (!el) return
    const observer = new ResizeObserver(() => this._measureWeekLimit())
    observer.observe(el)
    this._resizeObserver = observer
    this._measureWeekLimit()
  }

  private _measureWeekLimit(): void {
    const gridEl = this._monthGridEl
    const store = this._store
    const grid = this._grid
    if (!gridEl || !store || !grid || grid.weeks.length === 0) {
      if (store) store.measuredWeekLimit.value = Infinity
      return
    }
    const rowHeight = gridEl.getBoundingClientRect().height / grid.weeks.length
    const eventsEl = gridEl.querySelector<HTMLElement>('.bc-week-events')
    if (!eventsEl) { store.measuredWeekLimit.value = Infinity; return }
    const style = getComputedStyle(eventsEl)
    const segmentHeight = parseFloat(style.gridAutoRows)
    const headerHeight = parseFloat(style.paddingBlockStart)
    if (!isFinite(segmentHeight) || segmentHeight <= 0) {
      store.measuredWeekLimit.value = Infinity
      return
    }
    store.measuredWeekLimit.value = Math.max(
      1,
      Math.floor((rowHeight - headerHeight) / segmentHeight),
    )
  }

  private _renderSegment(segment: MonthSegmentCell<unknown>) {
    const style = segmentStyle({ left: segment.left, span: segment.span, row: segment.row }) as Record<string, string>
    const resizeEdges: ResizeEdge[] = []
    if (segment.resizeStart) resizeEdges.push('start')
    if (segment.resizeEnd) resizeEdges.push('end')
    const draggable = this._isDraggable(segment.event)
    const resizable = this._isResizable(segment.event)

    return html`
      <button
        type="button"
        class=${classMap({ 'bc-segment': true, 'bc-event-draggable': draggable })}
        style=${styleMap(style)}
        data-bc-event=${this._getEventId(segment.event) ?? ''}
        aria-selected=${this._isEventSelected(segment.event)}
        @click=${(e: MouseEvent) => this._handleSegmentClick(segment.event, e)}
        @dblclick=${(e: MouseEvent) => this._handleSegmentDblClick(segment.event, e)}
        @keydown=${(e: KeyboardEvent) => this._handleSegmentKeyDown(segment.event, e)}
        @contextmenu=${(e: MouseEvent) => this._handleSegmentContextMenu(segment.event, e)}
        @auxclick=${(e: MouseEvent) => this._handleSegmentAuxClick(segment.event, e)}
        @pointerdown=${(e: Event) => e.stopPropagation()}
      >
        <span class="bc-event-title">${segment.title}</span>
        ${when(resizable, () => html`
          ${resizeEdges.map((edge) => html`
            <div class="bc-resize-handle bc-resize-handle-${edge}" data-bc-resize=${edge}></div>
          `)}
        `)}
      </button>
    `
  }

  override render() {
    const grid = this._grid
    if (!grid) return html``

    const gridStyle = monthGridStyle(grid.weeks.length) as Record<string, string>

    return html`
      <div class="bc-month">
        <div class="bc-month-header">
          ${grid.weekdays.map((weekday) => html`
            <span class="bc-weekday" role="columnheader">
              <span class="bc-weekday-long">${weekday.long}</span>
              <span class="bc-weekday-short" aria-hidden="true">${weekday.short}</span>
            </span>
          `)}
        </div>

        <div
          class="bc-month-grid"
          style=${styleMap(gridStyle)}
          ${ref((el) => { this._onMonthGridRef((el as HTMLElement | undefined) ?? null) })}
        >
          ${grid.weeks.map((week, weekIndex) => html`
            <div class="bc-month-week">

              <!-- Slot hit-targets -->
              <div class="bc-month-slots" @pointerdown=${this._slotHandler ?? null}>
                ${week.days.map((cell, dayIndex) => html`
                  <div
                    class="bc-month-slot"
                    data-date=${cell.day}
                    data-slot-index=${weekIndex * 7 + dayIndex}
                    aria-describedby=${this._descriptionIds.selection}
                    tabindex="0"
                  ></div>
                `)}
              </div>

              <!-- Date-cell backgrounds -->
              <div class="bc-week-backgrounds">
                ${week.days.map((cell) => html`
                  <div
                    class=${classMap({
                      'bc-date-cell': true,
                      'bc-today': cell.isToday,
                      'bc-off-range': cell.isOffRange,
                    })}
                  >
                    <button
                      type="button"
                      class="bc-date-number"
                      @click=${() => this._store?.drilldown({ date: cell.day })}
                    >${cell.label}</button>
                  </div>
                `)}
              </div>

              <!-- Live selection highlight -->
              ${when(this._getWeekSelectionBand(weekIndex) !== null, () => {
                const band = this._getWeekSelectionBand(weekIndex)!
                return html`<div class=${band.class} style=${styleMap(band.style)}></div>`
              })}

              <!-- Drag-move preview band -->
              ${when(this._getWeekPreviewBand(week) !== null, () => {
                const band = this._getWeekPreviewBand(week)!
                return html`<div class=${band.class} style=${styleMap(band.style)}></div>`
              })}

              <!-- Event segments + show-more cells -->
              <div class="bc-week-events">
                ${week.segments.map((segment) => this._renderSegment(segment))}

                ${week.days.map((cell, dayIndex) => {
                  const moreProps = (() => {
                    if (!cell.extra) return null
                    const msgs = this._ctx.value?.messages
                    if (!msgs) return null
                    const style = segmentStyle({ left: dayIndex + 1, span: 1, row: week.moreRow }) as Record<string, string>
                    return { style, count: cell.extra.count, label: msgs.showMore(cell.extra.count) }
                  })()
                  return when(moreProps !== null, () => html`
                    <div class="bc-show-more-cell" style=${styleMap(moreProps!.style)}>
                      <button type="button" class="bc-show-more">${moreProps!.label}</button>
                    </div>
                  `)
                })}
              </div>
            </div>
          `)}
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bc-month-view': MonthViewElement
  }
}
