import type { MonthEventProps } from '../components.type'

/** Default month event segment: just the title. Replace via `components.month.event`. */
function DefaultMonthEvent({ title }: MonthEventProps<unknown>) {
  return <span className="bc-event-title">{title}</span>
}

export default DefaultMonthEvent
