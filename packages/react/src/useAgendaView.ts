import type { ComponentType, CSSProperties } from 'react'
import { useCalendarContext } from './CalendarProvider'
import type { AgendaDateProps, AgendaEmptyProps, AgendaEventProps } from './components.type'
import { agendaRowsStyle } from './geometryStyles'
import DefaultAgendaDate from './DefaultAgendaDate'
import DefaultAgendaEmpty from './DefaultAgendaEmpty'
import DefaultAgendaEvent from './DefaultAgendaEvent'
import { useAgendaRows } from './useAgendaRows'
import type { AgendaRow } from './useAgendaRows'

/** Resolved component slots for the agenda view. */
export interface AgendaViewComponents<TEvent> {
  DateSlot: ComponentType<AgendaDateProps>
  EventSlot: ComponentType<AgendaEventProps<TEvent>>
  EmptySlot: ComponentType<AgendaEmptyProps>
}

/** Element-spread props for a rendered day row. */
export interface AgendaRowProps {
  className: string
  style: CSSProperties
}

/** Return value of {@link useAgendaView}. */
export interface UseAgendaViewReturn<TEvent> {
  /** Resolved rows, or `null` when the active view is not the agenda. */
  rows: AgendaRow<TEvent>[] | null
  /** Resolved component slots (defaults merged with `components.agenda` overrides). */
  components: AgendaViewComponents<TEvent>
  /** Resolved UI strings. */
  messages: { date: string; time: string; event: string; noEventsInRange: string }
  /** Element-spread props for the root `<div>`. */
  root: { className: string }
  /** Element-spread props for the sticky column-heading row. */
  header: { className: string }
  /** Element-spread props for the scrollable event list. */
  body: { className: string }
  /** Returns element-spread props for a day-group row. */
  getRowProps: (row: AgendaRow<TEvent>) => AgendaRowProps
}

/**
 * Composes all logic for {@link AgendaView} into a single hook. The view
 * component becomes a near-pure render function that spreads the returned
 * groups onto their target elements.
 */
export function useAgendaView<TEvent = unknown>(): UseAgendaViewReturn<TEvent> {
  const { components, messages } = useCalendarContext<TEvent>()
  const rows = useAgendaRows<TEvent>()

  return {
    rows,
    components: {
      DateSlot: components.agenda?.date ?? DefaultAgendaDate,
      EventSlot: (components.agenda?.event ?? DefaultAgendaEvent) as ComponentType<AgendaEventProps<TEvent>>,
      EmptySlot: components.agenda?.empty ?? DefaultAgendaEmpty,
    },
    messages: {
      date: messages.date,
      time: messages.time,
      event: messages.event,
      noEventsInRange: messages.noEventsInRange,
    },
    root: { className: 'bc-agenda' },
    header: { className: 'bc-agenda-header' },
    body: { className: 'bc-agenda-body' },
    getRowProps: (row: AgendaRow<TEvent>): AgendaRowProps => ({
      className: 'bc-agenda-day',
      style: agendaRowsStyle(row.events.length),
    }),
  }
}
