import type { AgendaEmptyProps } from '../components.type'

/** Default agenda empty state. Replace via `components.agenda.empty`. */
function DefaultAgendaEmpty({ message }: AgendaEmptyProps) {
  return <div className="bc-agenda-empty">{message}</div>
}

export default DefaultAgendaEmpty
