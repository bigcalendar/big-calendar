import type { Component } from 'svelte'
import { agendaRowsStyle } from '../internal/geometryStyles'
import { toStyle } from '../internal/toStyle'
import { useCalendarContext } from '../CalendarProvider'
import { useAgendaRows } from '../useAgendaRows'
import type { AgendaRow } from '../useAgendaRows'
import DefaultAgendaDate from '../DefaultAgendaDate/DefaultAgendaDate.svelte'
import DefaultAgendaEmpty from '../DefaultAgendaEmpty/DefaultAgendaEmpty.svelte'
import DefaultAgendaEvent from '../DefaultAgendaEvent/DefaultAgendaEvent.svelte'

export interface AgendaViewComponents {
  DateSlot: Component
  EventSlot: Component
  EmptySlot: Component
}

export interface AgendaRowProps {
  class: string
  style: string
}

export interface UseAgendaViewReturn<TEvent> {
  rows: { readonly current: AgendaRow<TEvent>[] | null }
  components: AgendaViewComponents
  messages: { date: string; time: string; event: string; noEventsInRange: string }
  root: { class: string }
  header: { class: string }
  headingCell: { class: string }
  body: { class: string }
  getRowProps: (row: AgendaRow<TEvent>) => AgendaRowProps
}

export function useAgendaView<TEvent = unknown>(): UseAgendaViewReturn<TEvent> {
  const { components: ctxComponents, messages } = useCalendarContext<TEvent>()
  const rows = useAgendaRows<TEvent>()
  const agenda = ctxComponents.agenda ?? {}

  return {
    rows,
    components: {
      DateSlot: (agenda.date ?? DefaultAgendaDate) as Component,
      EventSlot: (agenda.event ?? DefaultAgendaEvent) as Component,
      EmptySlot: (agenda.empty ?? DefaultAgendaEmpty) as Component,
    },
    messages: {
      date: messages.date,
      time: messages.time,
      event: messages.event,
      noEventsInRange: messages.noEventsInRange,
    },
    root: { class: 'bc-agenda' },
    header: { class: 'bc-agenda-header' },
    headingCell: { class: 'bc-agenda-heading' },
    body: { class: 'bc-agenda-body' },
    getRowProps: (row: AgendaRow<TEvent>): AgendaRowProps => ({
      class: 'bc-agenda-day',
      style: toStyle(agendaRowsStyle(row.events.length) as Record<string, string>),
    }),
  }
}
