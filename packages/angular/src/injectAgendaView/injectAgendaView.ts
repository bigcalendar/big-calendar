import { computed, effect, inject, signal } from '@angular/core'
import type { Signal } from '@angular/core'
import { DestroyRef } from '@angular/core'
import { wrapAccessor } from '@big-calendar/core'
import type { CalendarViewModel } from '@big-calendar/core'
import { formatEventTime } from '@big-calendar/core/utils'
import { agendaRowsStyle } from '@big-calendar/core/utils'
import { injectCalendar } from '../CalendarProvider/injectCalendar'

// ---- Data types (framework-agnostic) -----------------------------------

/** A resolved agenda event row. */
export interface AgendaRowEvent<TEvent> {
  key: string
  event: TEvent
  title: string
  time: string
  allDay: boolean
}

/** A resolved agenda day group. */
export interface AgendaRow<TEvent> {
  day: string
  label: string
  events: AgendaRowEvent<TEvent>[]
}

// ---- Prop types --------------------------------------------------------

/** Element attrs for a day-group row `<div>`. */
export interface AgendaRowProps {
  class: string
  style: Record<string, string>
}

/** Return value of {@link injectAgendaView}. */
export interface InjectAgendaViewReturn<TEvent> {
  /** Resolved rows, or `null` when the active view is not the agenda. */
  rows: Signal<AgendaRow<TEvent>[] | null>
  /** Resolved messages subset (column labels + empty-state string). */
  messages: Signal<{ date: string; time: string; event: string; noEventsInRange: string }>
  /** Element attrs for the root `<div>`. */
  root: { class: string }
  /** Element attrs for the sticky column-heading row. */
  header: { class: string }
  /** Element attrs for each column-heading cell. */
  headingCell: { class: string }
  /** Element attrs for the scrollable event list. */
  body: { class: string }
  /** Returns element attrs for a day-group row. */
  getRowProps: (row: AgendaRow<TEvent>) => AgendaRowProps
  /** Whether any event click handler is registered; drives button vs span rendering. */
  eventHas: Signal<boolean>
  /** Returns the stringified event id for `data-bc-event` attribute. */
  getEventId: (event: TEvent) => string | undefined
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
}

/**
 * Inject all state for an Angular agenda-view template. Reads from the nearest
 * `<bc-calendar-provider>` ancestor via `injectCalendar()`.
 *
 * Returns `Signal<AgendaRow<TEvent>[] | null>` — re-computes automatically when
 * events, view, or date change. `null` when the active view is not the agenda.
 *
 * Must be called in an Angular injection context (constructor or field initializer).
 */
export function injectAgendaView<TEvent = unknown>(): InjectAgendaViewReturn<TEvent> {
  const ctx = injectCalendar<TEvent>()
  const destroyRef = inject(DestroyRef)
  const { messages: rawMessages } = ctx

  // Angular writable signal — populated once CalendarProviderComponent's
  // store-creation effect fires via the storeSignal bridge.
  const _viewModel = signal<CalendarViewModel<TEvent> | null>(null)

  const cleanups: (() => void)[] = []

  // Whether any event click handler is registered (determined at store creation).
  const _eventHas = signal<boolean>(false)

  effect(() => {
    const store = ctx.storeSignal()
    if (!store) return
    cleanups.push(
      store.viewModel.subscribe((vm) => _viewModel.set(vm as CalendarViewModel<TEvent>)),
    )
    _eventHas.set(store.eventHandlers.has)
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

  const rows = computed((): AgendaRow<TEvent>[] | null => {
    const store = ctx.storeSignal()
    if (!store) return null
    const vm = _viewModel()
    if (!vm || vm.kind !== 'agenda') return null

    const { localizer, accessors } = store
    const id = wrapAccessor(accessors.id)
    const title = wrapAccessor(accessors.title)
    const start = wrapAccessor(accessors.start)
    const end = wrapAccessor(accessors.end)
    const allDay = wrapAccessor(accessors.allDay)

    return vm.agenda.days.map((day) => ({
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
            allDayLabel: rawMessages.allDay,
            start: start(event),
            end: end(event),
            allDay: isAllDay,
          }),
          allDay: isAllDay,
        }
      }),
    }))
  })

  const messages = computed(() => ({
    date: rawMessages.date,
    time: rawMessages.time,
    event: rawMessages.event,
    noEventsInRange: rawMessages.noEventsInRange,
  }))

  return {
    rows,
    messages,
    root: { class: 'bc-agenda' },
    header: { class: 'bc-agenda-header' },
    headingCell: { class: 'bc-agenda-heading' },
    body: { class: 'bc-agenda-body' },
    getRowProps: (row) => ({
      class: 'bc-agenda-day',
      style: agendaRowsStyle(row.events.length) as Record<string, string>,
    }),
    eventHas: _eventHas.asReadonly(),
    getEventId: _getEventId,
    handleEventClick: (event, domEvent) => {
      if (domEvent.detail === 0) return
      if (_clickTimer !== null) return
      const e = domEvent
      _clickTimer = setTimeout(() => {
        _clickTimer = null
        ctx.storeSignal()?.eventHandlers.click(event, e)
      }, 250)
    },
    handleEventDblClick: (event, domEvent) => {
      if (_clickTimer !== null) { clearTimeout(_clickTimer); _clickTimer = null }
      ctx.storeSignal()?.eventHandlers.doubleClick(event, domEvent)
    },
    handleEventKeyDown: (event, domEvent) => {
      const store = ctx.storeSignal()
      if (!store) return
      if (domEvent.key === 'Enter' || domEvent.key === ' ') {
        domEvent.preventDefault()
        store.eventHandlers.click(event, domEvent)
      } else if (domEvent.key === 'F2') {
        domEvent.preventDefault()
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
  }
}
