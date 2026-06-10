import type { AgendaEventProps } from '../components.type'
import AgendaEventButton from '../AgendaEventButton'

/**
 * Default agenda event row: a time column and the event title. The title renders
 * as an interactive `<button>` (link-styled) when the app wired any event handler
 * (click / double-click / right / middle), otherwise as a plain `<span>` — see
 * {@link AgendaEventButton}. Replace the whole row via `components.agenda.event`.
 */
function DefaultAgendaEvent({ event, title, time }: AgendaEventProps<unknown>) {
  return (
    <div className="bc-agenda-row">
      <span className="bc-agenda-time">{time}</span>
      <AgendaEventButton event={event} title={title} />
    </div>
  )
}

export default DefaultAgendaEvent
