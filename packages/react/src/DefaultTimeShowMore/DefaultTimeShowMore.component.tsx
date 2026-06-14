import type { TimeShowMoreProps } from '../components.type'
import EventButton from '../EventButton'
import { Popover } from '../Popover'

/**
 * Default all-day overflow indicator: a `.bc-show-more` button that opens a
 * top-layer {@link Popover} listing the all-day events that did not fit the
 * row limit. Replace via `components.time.showMore`.
 *
 * Each overflowed event is rendered as a full {@link EventButton} using the
 * configured `EventSlot` — identical look, feel, and handler bindings to the
 * all-day strip.
 */
function DefaultTimeShowMore<TEvent>({ label, events, EventSlot }: TimeShowMoreProps<TEvent>) {
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

export default DefaultTimeShowMore
