import type { TimeAllDayEventProps } from '../components.type'

/** Default all-day event segment: just the title. Replace via `components.time.allDayEvent`. */
function DefaultTimeAllDayEvent({ title }: TimeAllDayEventProps<unknown>) {
  return <span className="bc-event-title">{title}</span>
}

export default DefaultTimeAllDayEvent
