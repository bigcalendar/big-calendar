import type { ComponentType } from 'react'
import { useCalendarContext } from '../CalendarProvider'
import type {
  TimeAllDayEventProps,
  TimeDayHeadingProps,
  TimeEventProps,
  TimeLabelProps,
  TimeShowMoreProps,
} from '../components.type'
import {
  dayCountStyle,
  eventBoxStyle,
  nowIndicatorStyle,
  segmentStyle,
  slotCountStyle,
} from '../internal/geometry.function'
import DefaultTimeAllDayEvent from './components/DefaultTimeAllDayEvent.component'
import DefaultTimeDayHeading from './components/DefaultTimeDayHeading.component'
import DefaultTimeEvent from './components/DefaultTimeEvent.component'
import DefaultTimeLabel from './components/DefaultTimeLabel.component'
import DefaultTimeShowMore from './components/DefaultTimeShowMore.component'
import { useTimeGrid } from './hooks'

/**
 * The time-grid view (day / week / work-week): a day-column header, an all-day
 * segment row, and a scrollable body of time columns with timed events
 * positioned as fractions of each column. Reads the time-grid model from context
 * and renders nothing when the active view is not a time grid. The now-line
 * shows only on today's column. Every slot (`dayHeading` / `timeLabel` /
 * `event` / `allDayEvent` / `showMore`) is overridable via `components.time`.
 * Must render inside a {@link CalendarProvider}.
 */
function TimeGridView<TEvent = unknown>() {
  const { store, components, messages } = useCalendarContext<TEvent>()
  const grid = useTimeGrid<TEvent>()

  if (grid === null) return null

  const DayHeading: ComponentType<TimeDayHeadingProps> =
    components.time?.dayHeading ?? DefaultTimeDayHeading
  const TimeLabel: ComponentType<TimeLabelProps> = components.time?.timeLabel ?? DefaultTimeLabel
  const EventSlot: ComponentType<TimeEventProps<TEvent>> =
    components.time?.event ?? DefaultTimeEvent
  const AllDayEvent: ComponentType<TimeAllDayEventProps<TEvent>> =
    components.time?.allDayEvent ?? DefaultTimeAllDayEvent
  const ShowMore: ComponentType<TimeShowMoreProps> =
    components.time?.showMore ?? DefaultTimeShowMore

  return (
    <div className="bc-time-grid">
      <div className="bc-time-header" style={dayCountStyle(grid.headings.length)}>
        {grid.headings.map((heading) => (
          <DayHeading
            key={heading.day}
            day={heading.day}
            label={heading.label}
            isToday={heading.isToday}
            onDrillDown={() => store.drilldown({ date: heading.day })}
          />
        ))}
      </div>

      <div className="bc-allday-row">
        <div className="bc-allday-label">{messages.allDay}</div>
        <div className="bc-allday-segments" style={dayCountStyle(grid.headings.length)}>
          {grid.allDay.segments.map((segment) => (
            <div
              key={segment.key}
              className="bc-segment"
              style={segmentStyle({ left: segment.left, span: segment.span, row: segment.row })}
            >
              <AllDayEvent event={segment.event} title={segment.title} />
            </div>
          ))}
          {grid.allDay.extra !== null && (
            <ShowMore
              count={grid.allDay.extra.count}
              label={messages.showMore(grid.allDay.extra.count)}
            />
          )}
        </div>
      </div>

      <div className="bc-time-body" style={slotCountStyle(grid.slotCount)}>
        <div className="bc-time-gutter">
          {grid.gutter.map((label) => (
            <TimeLabel key={label.key} time={label.time} label={label.label} />
          ))}
        </div>
        {grid.columns.map((column) => {
          const className = ['bc-day-column', column.isToday && 'bc-today'].filter(Boolean).join(' ')
          return (
            <div key={column.key} className={className}>
              {column.backgroundEvents.map((bg) => (
                <div
                  key={bg.key}
                  className="bc-bg-event"
                  style={eventBoxStyle({ top: bg.top, height: bg.height, left: 0, width: 1, zIndex: 0 })}
                />
              ))}
              {column.events.map((event) => (
                <div
                  key={event.key}
                  className="bc-event"
                  style={eventBoxStyle({
                    top: event.top,
                    height: event.height,
                    left: event.left,
                    width: event.width,
                    zIndex: event.zIndex,
                  })}
                >
                  <EventSlot event={event.event} title={event.title} time={event.time} />
                </div>
              ))}
              {column.nowTop !== null && (
                <div className="bc-now-indicator" style={nowIndicatorStyle(column.nowTop)} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TimeGridView
