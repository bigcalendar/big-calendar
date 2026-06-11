import { Views } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { EventButton, useMonthView, Toolbar } from '../src'
import { CalendarStage } from './harness'

/**
 * A custom month view written entirely with `useMonthView`. The hook returns
 * all the data, element-spread props, and resolved component slots — this
 * component is a near-pure render function on top of them. This is how
 * `MonthView` itself is built.
 */
function CustomMonthView<TEvent = unknown>() {
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
              <div {...slotsContainer}>
                {week.days.map((cell, dayIndex) => (
                  <div key={cell.day} {...getDaySlotProps(cell, weekIndex, dayIndex)} />
                ))}
              </div>
              <div {...backgroundsContainer}>
                {week.days.map((cell) => (
                  <DateCell
                    key={cell.day}
                    day={cell.day}
                    label={cell.label}
                    isToday={cell.isToday}
                    isOffRange={cell.isOffRange}
                    onDrillDown={() => drilldown(cell.day)}
                  />
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

const meta: Meta = {
  title: 'React/Hooks/useMonthView',
  parameters: {
    docs: {
      description: {
        component:
          'Composes all logic for a custom month view: signal subscriptions, roving focus, keyboard DnD, slot selection, drag-preview geometry, and component slot resolution. The view component is a near-pure render function on top.',
      },
    },
  },
}
export default meta

type Story = StoryObj

/**
 * `CustomMonthView` is a complete month view implemented entirely with
 * `useMonthView`. The built-in `MonthView` component is just this hook plus
 * the same render function — you can copy it and change any part.
 */
export const Default: Story = {
  render: () => (
    <CalendarStage defaultView={Views.MONTH} views={[Views.MONTH]}>
      <Toolbar />
      <div className="bc-calendar">
        <CustomMonthView />
      </div>
    </CalendarStage>
  ),
}
