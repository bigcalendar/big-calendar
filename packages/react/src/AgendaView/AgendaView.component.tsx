import { useAgendaView } from '../useAgendaView'

/**
 * The agenda view: a chronological list of days that have events. Reads the
 * agenda model from context and renders nothing when the active view is not the
 * agenda. Each slot (date / event / empty) is overridable via
 * `components.agenda`. Must render inside a {@link CalendarProvider}.
 */
function AgendaView<TEvent = unknown>() {
  const { rows, components, messages, root, header, headingCell, body, getRowProps } = useAgendaView<TEvent>()

  if (rows === null) return null

  const { DateSlot, EventSlot, EmptySlot } = components

  return (
    <div {...root}>
      <div {...header}>
        <span {...headingCell}>{messages.date}</span>
        <span {...headingCell}>{messages.time}</span>
        <span {...headingCell}>{messages.event}</span>
      </div>
      {rows.length === 0 ? (
        <EmptySlot message={messages.noEventsInRange} />
      ) : (
        <div {...body}>
          {rows.map((row) => (
            <div key={row.day} {...getRowProps(row)}>
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
