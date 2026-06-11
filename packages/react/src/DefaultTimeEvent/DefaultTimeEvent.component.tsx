import type { TimeEventProps } from '../components.type'

/**
 * Default timed event content: the time and title. Rendered inside the view's
 * positioned `.bc-event` box. Replace via `components.time.event`.
 */
function DefaultTimeEvent({ title, time }: TimeEventProps<unknown>) {
  return (
    <>
      <span className="bc-event-title">{title}</span>
      <span className="bc-event-time">{time}</span>
    </>
  )
}

export default DefaultTimeEvent
