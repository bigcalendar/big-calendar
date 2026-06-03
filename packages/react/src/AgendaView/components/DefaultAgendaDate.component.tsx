import type { AgendaDateProps } from '../../components.type'

/** Default agenda date label. Replace via `components.agenda.date`. */
function DefaultAgendaDate({ label }: AgendaDateProps) {
  return <div className="bc-agenda-date">{label}</div>
}

export default DefaultAgendaDate
