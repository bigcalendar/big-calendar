import { Views } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { EventButton, useTimeGridView, Toolbar } from '../src'
import { CalendarStage } from './harness'

/**
 * A custom time-grid view written entirely with `useTimeGridView`. Covers the
 * plain (non-resource) layout — the same path used by Day, Week, and Work-Week
 * views. The hook returns all data and element-spread props; this component is
 * a near-pure render function on top of them.
 */
function CustomTimeGridView<TEvent = unknown>() {
  const { grid, announcement, announcer, root, getRootStyle, header, body } = useTimeGridView<TEvent>()

  if (grid === null) return null

  // Resource layouts (grid.resources / grid.dayGroups) have their own render
  // paths — see TimeGridView.component.tsx. This example covers plain grids only.
  if (grid.resources !== null || grid.dayGroups !== null) return null

  const {
    components: { DayHeading, AllDayEvent, ShowMore },
    messages: hdrMessages,
    timeHeader,
    timeHeaderGutter,
    allDayLabel,
    allDaySlots,
    allDaySegments,
    allDaySelectionWrapper,
    allDayRow,
    getHeadingProps,
    getAllDaySlotProps,
    allDaySelectionBand,
    getAllDaySegmentProps,
  } = header

  const {
    components: { TimeLabel, EventSlot },
    body: bodyRoot,
    gutter,
    timeSlotsContainer,
    getColumnProps,
    getSlotProps,
    getTimeSelectionDivProps,
    getPreviewDivProps,
    getBgEventProps,
    getEventProps,
    getNowIndicatorProps,
  } = body

  return (
    <div style={getRootStyle(grid.headings.length)} {...root}>
      <div {...announcer}>{announcement}</div>

      <div {...timeHeader}>
        <div {...timeHeaderGutter} />
        {grid.headings.map((heading) => (
          <DayHeading key={heading.day} {...getHeadingProps(heading)} />
        ))}
      </div>

      <div {...allDayRow}>
        <div {...allDayLabel}>{hdrMessages.allDay}</div>
        <div {...allDaySlots}>
          {grid.columns.map((column, colIndex) => (
            <div key={column.key} {...getAllDaySlotProps(column, colIndex)} />
          ))}
        </div>
        {allDaySelectionBand && (
          <div {...allDaySelectionWrapper}>
            <div {...allDaySelectionBand} />
          </div>
        )}
        <div {...allDaySegments}>
          {grid.allDay.segments.map((segment) => (
            <EventButton key={segment.key} {...getAllDaySegmentProps(segment)}>
              <AllDayEvent event={segment.event} title={segment.title} />
            </EventButton>
          ))}
          {grid.allDay.extra !== null && (
            <ShowMore
              count={grid.allDay.extra.count}
              label={hdrMessages.showMore(grid.allDay.extra.count)}
              events={grid.allDay.extra.events}
            />
          )}
        </div>
      </div>

      <div {...bodyRoot}>
        <div {...gutter}>
          {grid.gutter.map((label) => (
            <TimeLabel key={label.key} time={label.time} label={label.label} />
          ))}
        </div>
        {grid.columns.map((column, colIndex) => {
          const colProps = getColumnProps(column)
          const nowProps = getNowIndicatorProps(column)
          const selDiv = getTimeSelectionDivProps(colIndex)
          const prevDiv = getPreviewDivProps(column)
          return (
            <div key={column.key} {...colProps}>
              <div {...timeSlotsContainer}>
                {Array.from({ length: grid.slotCount }, (_, slotIndex) => (
                  <div key={slotIndex} {...getSlotProps(column, colIndex, slotIndex)} />
                ))}
              </div>
              {column.backgroundEvents.map((bg) => (
                <div key={bg.key} {...getBgEventProps(bg)} />
              ))}
              {column.events.map((event) => (
                <EventButton key={event.key} {...getEventProps(event)}>
                  <EventSlot event={event.event} title={event.title} time={event.time} />
                </EventButton>
              ))}
              {nowProps && <div {...nowProps} />}
              {selDiv && <div {...selDiv} />}
              {prevDiv && <div {...prevDiv} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const meta: Meta = {
  title: 'React/Hooks/useTimeGridView',
  parameters: {
    docs: {
      description: {
        component:
          'Composed hook for a custom time-grid view. Calls `useTimeGrid` once, passes the grid to `useTimeGridHeader` and `useTimeGridBody`, and wires up root-level event-roving and keyboard DnD.',
      },
    },
  },
}
export default meta

type Story = StoryObj

const TIME_VIEWS = [Views.WEEK, Views.WORK_WEEK, Views.DAY]

/**
 * `CustomTimeGridView` implements the plain (non-resource) time-grid layout
 * using `useTimeGridView`. Switch between Week, Work-Week, and Day in the
 * toolbar — the same component handles all three.
 */
export const Default: Story = {
  render: () => (
    <CalendarStage defaultView={Views.WEEK} views={TIME_VIEWS}>
      <Toolbar />
      <div className="bc-calendar">
        <CustomTimeGridView />
      </div>
    </CalendarStage>
  ),
}
