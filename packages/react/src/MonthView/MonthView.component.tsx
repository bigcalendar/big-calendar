import type { ComponentType } from 'react'
import { useCalendarContext } from '../CalendarProvider'
import type {
  MonthDateProps,
  MonthEventProps,
  MonthShowMoreProps,
  MonthWeekdayProps,
} from '../components.type'
import { monthGridStyle, segmentStyle } from '../internal/geometry.function'
import DefaultMonthDate from './components/DefaultMonthDate.component'
import DefaultMonthEvent from './components/DefaultMonthEvent.component'
import DefaultMonthShowMore from './components/DefaultMonthShowMore.component'
import DefaultMonthWeekday from './components/DefaultMonthWeekday.component'
import { useMonthWeeks } from './hooks'

/**
 * The month view: a padded day grid split into week rows, with overlapping
 * events laid out as day-column segments. Reads the month model from context and
 * renders nothing when the active view is not the month. Day-cell state
 * (today / off-range) and overflow come from the model; every slot
 * (`weekday` / `dateCell` / `event` / `showMore`) is overridable via
 * `components.month`. Must render inside a {@link CalendarProvider}.
 */
function MonthView<TEvent = unknown>() {
  const { store, components, messages } = useCalendarContext<TEvent>()
  const grid = useMonthWeeks<TEvent>()

  if (grid === null) return null

  const Weekday: ComponentType<MonthWeekdayProps> = components.month?.weekday ?? DefaultMonthWeekday
  const DateCell: ComponentType<MonthDateProps> = components.month?.dateCell ?? DefaultMonthDate
  const EventSlot: ComponentType<MonthEventProps<TEvent>> =
    components.month?.event ?? DefaultMonthEvent
  const ShowMore: ComponentType<MonthShowMoreProps> =
    components.month?.showMore ?? DefaultMonthShowMore

  return (
    <div className="bc-month">
      <div className="bc-month-header">
        {grid.weekdays.map((weekday) => (
          <Weekday key={weekday.day} day={weekday.day} long={weekday.long} short={weekday.short} />
        ))}
      </div>
      <div className="bc-month-grid" style={monthGridStyle(grid.weeks.length)}>
        {grid.weeks.map((week) => (
          <div key={week.key} className="bc-month-week">
            <div className="bc-week-backgrounds">
              {week.days.map((cell) => (
                <DateCell
                  key={cell.day}
                  day={cell.day}
                  label={cell.label}
                  isToday={cell.isToday}
                  isOffRange={cell.isOffRange}
                  onDrillDown={() => store.drilldown({ date: cell.day })}
                />
              ))}
            </div>
            <div className="bc-week-events">
              {week.segments.map((segment) => (
                <div
                  key={segment.key}
                  className="bc-segment"
                  style={segmentStyle({ left: segment.left, span: segment.span, row: segment.row })}
                >
                  <EventSlot event={segment.event} title={segment.title} />
                </div>
              ))}
              {week.extra !== null && (
                <ShowMore
                  count={week.extra.count}
                  label={messages.showMore(week.extra.count)}
                  day={week.extra.day}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MonthView
