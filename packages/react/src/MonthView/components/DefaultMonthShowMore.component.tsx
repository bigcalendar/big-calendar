import type { MonthShowMoreProps } from '../../components.type'
import { Popover } from '../../Popover'

/**
 * Default week overflow indicator: a `.bc-show-more` button that opens a
 * top-layer {@link Popover} listing the events that did not fit the week's row
 * limit. Replace via `components.month.showMore`.
 */
function DefaultMonthShowMore<TEvent>({ label, events }: MonthShowMoreProps<TEvent>) {
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

export default DefaultMonthShowMore
