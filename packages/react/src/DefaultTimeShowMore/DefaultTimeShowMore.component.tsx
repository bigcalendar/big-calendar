import type { TimeShowMoreProps } from '../components.type'
import { Popover } from '../Popover'

/**
 * Default all-day overflow indicator: a `.bc-show-more` button that opens a
 * top-layer {@link Popover} listing the all-day events that did not fit the
 * row limit. Replace via `components.time.showMore`.
 */
function DefaultTimeShowMore<TEvent>({ label, events }: TimeShowMoreProps<TEvent>) {
  return (
    <Popover
      placement="bottom-start"
      trigger={(triggerProps) => (
        <button {...triggerProps} type="button" className="bc-show-more">
          {label}
        </button>
      )}
    >
      <ul className="bc-popover-events">
        {events.map((item) => (
          <li key={item.key} className="bc-popover-event">
            {item.title}
          </li>
        ))}
      </ul>
    </Popover>
  )
}

export default DefaultTimeShowMore
