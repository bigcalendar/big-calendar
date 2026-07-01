import type { Component } from 'vue'
import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import { agendaRowsStyle } from '../internal/geometryStyles'
import { useCalendarContext } from '../CalendarProvider'
import { useAgendaRows } from '../useAgendaRows'
import type { AgendaRow } from '../useAgendaRows'
import DefaultAgendaDate from '../DefaultAgendaDate/DefaultAgendaDate.vue'
import DefaultAgendaEmpty from '../DefaultAgendaEmpty/DefaultAgendaEmpty.vue'
import DefaultAgendaEvent from '../DefaultAgendaEvent/DefaultAgendaEvent.vue'

/** Resolved component slots for the agenda view. */
export interface AgendaViewComponents {
  DateSlot: Component
  EventSlot: Component
  EmptySlot: Component
}

/** Element-spread props for a rendered day row. */
export interface AgendaRowProps {
  class: string
  style: Record<string, string>
}

/** Element-spread props for each column-heading cell. */
export interface AgendaHeadingCellProps {
  class: string
}

/** Return value of {@link useAgendaView}. */
export interface UseAgendaViewReturn<TEvent> {
  /** Resolved rows, or `null` when the active view is not the agenda. */
  rows: ComputedRef<AgendaRow<TEvent>[] | null>
  /** Resolved component slots (defaults merged with `components.agenda` overrides). */
  components: AgendaViewComponents
  /** Resolved UI strings. */
  messages: ComputedRef<{ date: string; time: string; event: string; noEventsInRange: string }>
  /** Element-spread props for the root `<div>`. */
  root: { class: string }
  /** Element-spread props for the sticky column-heading row. */
  header: { class: string }
  /** Element-spread props for each column-heading cell. */
  headingCell: AgendaHeadingCellProps
  /** Element-spread props for the scrollable event list. */
  body: { class: string }
  /** Returns element-spread props for a day-group row. */
  getRowProps: (row: AgendaRow<TEvent>) => AgendaRowProps
}

/**
 * Composes all state for `<AgendaView>`. The view component spreads the
 * returned groups onto their target elements.
 */
export function useAgendaView<TEvent = unknown>(): UseAgendaViewReturn<TEvent> {
  const { components: ctxComponents, messages: rawMessages } = useCalendarContext<TEvent>()
  const rows = useAgendaRows<TEvent>()

  const messages = computed(() => ({
    date: rawMessages.date,
    time: rawMessages.time,
    event: rawMessages.event,
    noEventsInRange: rawMessages.noEventsInRange,
  }))

  const agenda = ctxComponents.agenda ?? {}

  return {
    rows,
    components: {
      DateSlot: (agenda.date ?? DefaultAgendaDate) as Component,
      EventSlot: (agenda.event ?? DefaultAgendaEvent) as Component,
      EmptySlot: (agenda.empty ?? DefaultAgendaEmpty) as Component,
    },
    messages,
    root: { class: 'bc-agenda' },
    header: { class: 'bc-agenda-header' },
    headingCell: { class: 'bc-agenda-heading' },
    body: { class: 'bc-agenda-body' },
    getRowProps: (row: AgendaRow<TEvent>): AgendaRowProps => ({
      class: 'bc-agenda-day',
      style: agendaRowsStyle(row.events.length) as Record<string, string>,
    }),
  }
}
