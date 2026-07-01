import type { MonthShowMoreProps } from '../components.type'
import EventButton from '../EventButton'
import { Popover } from '../Popover'

/**
 * Default week overflow indicator: a `.bc-show-more` button that opens a
 * top-layer {@link Popover} listing the events that did not fit the week's row
 * limit. Replace via `components.month.showMore`.
 *
 * The popover matches the day cell's width (`sameWidth`) and renders each
 * overflowed event as a full {@link EventButton} using the configured
 * `EventSlot` — identical look, feel, and handler bindings to the month grid.
 */
function DefaultMonthShowMore<TEvent>({ label, events, EventSlot }: MonthShowMoreProps<TEvent>) {
  return (
    <Popover
      placement="bottom-start"
      sameWidth
      className="bc-popover bc-show-more-popover"
      trigger={(triggerProps) => (
        <button {...triggerProps} type="button" className="bc-show-more">
          {label}
        </button>
      )}
    >
      {events.map((item) => (
        <EventButton key={item.key} className="bc-segment" event={item.event} title={item.title} resizeEdges={[]}>
          <EventSlot event={item.event} title={item.title} />
        </EventButton>
      ))}
    </Popover>
  )
}

export default DefaultMonthShowMore
