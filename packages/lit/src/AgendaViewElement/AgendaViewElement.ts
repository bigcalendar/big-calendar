import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import { styleMap } from 'lit/directives/style-map.js'
import { ContextConsumer } from '@lit/context'
import { effect } from '@preact/signals-core'
import { wrapAccessor } from '@big-calendar/core'
import type { CalendarStore, CalendarViewModel } from '@big-calendar/core'
import { formatEventTime, agendaRowsStyle } from '@big-calendar/core/utils'
import { calendarContext } from '../CalendarController/calendarContext'
import type { CalendarContextValue } from '../CalendarController/calendarContext'

// ---- Data types --------------------------------------------------------

interface AgendaRowEvent<TEvent> {
  key: string
  event: TEvent
  title: string
  time: string
  allDay: boolean
}

interface AgendaRow<TEvent> {
  day: string
  label: string
  events: AgendaRowEvent<TEvent>[]
}

@customElement('bc-agenda-view')
export class AgendaViewElement extends LitElement {
  override createRenderRoot() {
    return this
  }

  private _rows: AgendaRow<unknown>[] | null = null
  private _eventHas = false
  private _store: CalendarStore | null = null
  private _disposes: (() => void)[] = []
  private _clickTimer: ReturnType<typeof setTimeout> | null = null

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
    this._eventHas = store.eventHandlers.has

    this._disposes.push(
      effect(() => {
        const vm = store.viewModel.value as CalendarViewModel<unknown>
        this._computeRows(vm, store, ctx)
        this.requestUpdate()
      }),
    )
  }

  private _computeRows(vm: CalendarViewModel<unknown> | null, store: CalendarStore, ctx: CalendarContextValue): void {
    if (!vm || vm.kind !== 'agenda') {
      this._rows = null
      return
    }

    const { localizer, accessors } = store
    const msgs = ctx.messages
    const id = wrapAccessor(accessors.id)
    const title = wrapAccessor(accessors.title)
    const start = wrapAccessor(accessors.start)
    const end = wrapAccessor(accessors.end)
    const allDay = wrapAccessor(accessors.allDay)

    this._rows = vm.agenda.days.map((day) => ({
      day: day.day,
      label: localizer.format({ value: day.day, format: 'agendaDate' }),
      events: day.events.map((event, index) => {
        const isAllDay = allDay(event) ?? false
        return {
          key: String(id(event) ?? index),
          event,
          title: title(event) ?? '',
          time: formatEventTime({
            localizer,
            allDayLabel: msgs.allDay,
            start: start(event),
            end: end(event),
            allDay: isAllDay,
          }),
          allDay: isAllDay,
        }
      }),
    }))
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this._disposes.forEach((d) => d())
    this._disposes = []
    if (this._clickTimer !== null) clearTimeout(this._clickTimer)
    this._store = null
  }

  private _getEventId(event: unknown): string | undefined {
    if (!this._store) return undefined
    const id = wrapAccessor(this._store.accessors.id)(event)
    return id != null ? String(id) : undefined
  }

  private _handleEventClick(event: unknown, domEvent: MouseEvent): void {
    if (domEvent.detail === 0) return
    if (this._clickTimer !== null) return
    const e = domEvent
    this._clickTimer = setTimeout(() => {
      this._clickTimer = null
      this._store?.eventHandlers.click(event, e)
    }, 250)
  }

  private _handleEventDblClick(event: unknown, domEvent: MouseEvent): void {
    if (this._clickTimer !== null) { clearTimeout(this._clickTimer); this._clickTimer = null }
    this._store?.eventHandlers.doubleClick(event, domEvent)
  }

  private _handleEventKeyDown(event: unknown, domEvent: KeyboardEvent): void {
    const store = this._store
    if (!store) return
    if (domEvent.key === 'Enter' || domEvent.key === ' ') {
      domEvent.preventDefault()
      store.eventHandlers.click(event, domEvent)
    } else if (domEvent.key === 'F2') {
      domEvent.preventDefault()
      store.eventHandlers.doubleClick(event, domEvent)
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

  override render() {
    const rows = this._rows
    if (rows === null) return html``

    const msgs = this._ctx.value?.messages
    const dateLabel = msgs?.date ?? 'Date'
    const timeLabel = msgs?.time ?? 'Time'
    const eventLabel = msgs?.event ?? 'Event'
    const noEventsLabel = msgs?.noEventsInRange ?? 'No events in range'

    return html`
      <div class="bc-agenda">
        <div class="bc-agenda-header">
          <span class="bc-agenda-heading">${dateLabel}</span>
          <span class="bc-agenda-heading">${timeLabel}</span>
          <span class="bc-agenda-heading">${eventLabel}</span>
        </div>

        ${when(rows.length === 0,
          () => html`<div class="bc-agenda-empty">${noEventsLabel}</div>`,
          () => html`
            <div class="bc-agenda-body">
              ${rows.map((row) => html`
                <div
                  class="bc-agenda-day"
                  style=${styleMap(agendaRowsStyle(row.events.length) as Record<string, string>)}
                >
                  <div class="bc-agenda-date">${row.label}</div>

                  ${row.events.map((item) => html`
                    <time class="bc-agenda-time">${item.time}</time>
                    ${when(this._eventHas,
                      () => html`
                        <button
                          type="button"
                          class="bc-agenda-event"
                          data-bc-event=${this._getEventId(item.event) ?? ''}
                          @click=${(e: MouseEvent) => this._handleEventClick(item.event, e)}
                          @dblclick=${(e: MouseEvent) => this._handleEventDblClick(item.event, e)}
                          @keydown=${(e: KeyboardEvent) => this._handleEventKeyDown(item.event, e)}
                          @contextmenu=${(e: MouseEvent) => this._handleEventContextMenu(item.event, e)}
                          @auxclick=${(e: MouseEvent) => this._handleEventAuxClick(item.event, e)}
                        >${item.title}</button>
                      `,
                      () => html`<div class="bc-agenda-event">${item.title}</div>`,
                    )}
                  `)}
                </div>
              `)}
            </div>
          `,
        )}
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bc-agenda-view': AgendaViewElement
  }
}
