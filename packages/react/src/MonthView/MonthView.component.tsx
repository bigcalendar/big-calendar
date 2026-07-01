import clsx from 'clsx'
import EventButton from '../EventButton'
import { useMonthView } from '../useMonthView'

/**
 * The month view: a padded day grid split into week rows, with overlapping
 * events laid out as day-column segments. Reads the month model from context and
 * renders nothing when the active view is not the month. Day-cell state
 * (today / off-range) and overflow come from the model; every slot
 * (`weekday` / `dateCell` / `event` / `showMore`) is overridable via
 * `components.month`. Must render inside a {@link CalendarProvider}.
 */
function MonthView<TEvent = unknown>() {
  const {
    grid,
    components,
    announcement,
    announcer,
    drilldown,
    root,
    monthHeader,
    monthGrid,
    weekRow,
    slotsContainer,
    backgroundsContainer,
    eventsContainer,
    getDaySlotProps,
    getWeekSelectionBand,
    getWeekPreviewBand,
    getSegmentProps,
    getShowMoreCellProps,
  } = useMonthView<TEvent>()

  if (grid === null) return null

  const { Weekday, DateCell, EventSlot, ShowMore } = components

  return (
    <div {...root}>
      <div {...announcer}>{announcement}</div>
      <div {...monthHeader}>
        {grid.weekdays.map((weekday) => (
          <Weekday key={weekday.day} day={weekday.day} long={weekday.long} short={weekday.short} />
        ))}
      </div>
      <div {...monthGrid}>
        {grid.weeks.map((week, weekIndex) => {
          const selBand = getWeekSelectionBand(weekIndex)
          const prevBand = getWeekPreviewBand(week)
          return (
            <div key={week.key} {...weekRow}>
              {/* Non-overridable per-day hit targets for slot selection. */}
              <div {...slotsContainer}>
                {week.days.map((cell, dayIndex) => (
                  <div key={cell.day} {...getDaySlotProps(cell, weekIndex, dayIndex)} />
                ))}
              </div>
              <div {...backgroundsContainer}>
                {week.days.map((cell) => (
                  <div key={cell.day} className={clsx('bc-date-cell', cell.isToday && 'bc-today', cell.isOffRange && 'bc-off-range')}>
                    <DateCell
                      day={cell.day}
                      label={cell.label}
                      isToday={cell.isToday}
                      isOffRange={cell.isOffRange}
                      onDrillDown={() => drilldown(cell.day)}
                    />
                  </div>
                ))}
              </div>
              {selBand && <div {...selBand} />}
              {prevBand && <div {...prevBand} />}
              <div {...eventsContainer}>
                {week.segments.map((segment) => {
                  const segProps = getSegmentProps(segment)
                  return (
                    <EventButton key={segment.key} {...segProps}>
                      <EventSlot event={segment.event} title={segment.title} />
                    </EventButton>
                  )
                })}
                {week.days.map((cell, dayIndex) => {
                  const moreProps = getShowMoreCellProps(cell, dayIndex, week.moreRow)
                  if (moreProps === null) return null
                  const { className, style, ...showMoreProps } = moreProps
                  return (
                    <div key={`more-${cell.day}`} className={className} style={style}>
                      <ShowMore {...showMoreProps} />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MonthView
