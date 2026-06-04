import type { AgendaEventProps } from '../../components.type'

/** Default agenda event row: a time column and the event title. Replace via `components.agenda.event`. */
function DefaultAgendaEvent({ title, time }: AgendaEventProps<unknown>) {
  return (
    <div className="bc-agenda-row">
      <span className="bc-agenda-time">{time}</span>
      <span className="bc-agenda-event">
        <span className="bc-event-title">{title}</span>
      </span>
    </div>
  )
}

export default DefaultAgendaEvent
