import type { ComponentType } from 'react'
import { useCalendarContext } from '../CalendarProvider'
import type { AgendaDateProps, AgendaEmptyProps, AgendaEventProps } from '../components.type'
import { agendaRowsStyle } from '../internal/geometry.function'
import DefaultAgendaDate from './components/DefaultAgendaDate.component'
import DefaultAgendaEmpty from './components/DefaultAgendaEmpty.component'
import DefaultAgendaEvent from './components/DefaultAgendaEvent.component'
import { useAgendaRows } from './hooks'

/**
 * The agenda view: a chronological list of days that have events. Reads the
 * agenda model from context and renders nothing when the active view is not the
 * agenda. Each slot (date / event / empty) is overridable via
 * `components.agenda`. Must render inside a {@link CalendarProvider}.
 */
function AgendaView<TEvent = unknown>() {
  const { components, messages } = useCalendarContext<TEvent>()
  const rows = useAgendaRows<TEvent>()

  if (rows === null) return null

  const DateSlot: ComponentType<AgendaDateProps> = components.agenda?.date ?? DefaultAgendaDate
  const EventSlot: ComponentType<AgendaEventProps<TEvent>> =
    components.agenda?.event ?? DefaultAgendaEvent
  const EmptySlot: ComponentType<AgendaEmptyProps> = components.agenda?.empty ?? DefaultAgendaEmpty

  return (
    <div className="bc-agenda">
      <div className="bc-agenda-header">
        <span className="bc-agenda-heading">{messages.date}</span>
        <span className="bc-agenda-heading">{messages.time}</span>
        <span className="bc-agenda-heading">{messages.event}</span>
      </div>
      {rows.length === 0 ? (
        <EmptySlot message={messages.noEventsInRange} />
      ) : (
        <div className="bc-agenda-body">
          {rows.map((row) => (
            <div key={row.day} className="bc-agenda-day" style={agendaRowsStyle(row.events.length)}>
              <DateSlot day={row.day} label={row.label} />
              {row.events.map((item) => (
                <EventSlot
                  key={item.key}
                  event={item.event}
                  title={item.title}
                  time={item.time}
                  allDay={item.allDay}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AgendaView
