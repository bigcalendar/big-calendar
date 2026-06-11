import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  DefaultTimeAllDayEvent,
  DefaultTimeDayHeading,
  DefaultTimeEvent,
  DefaultTimeLabel,
  DefaultTimeShowMore,
} from '../src'

const meta: Meta = {
  title: 'React/Default Components/TimeGrid',
  parameters: {
    docs: {
      description: {
        component:
          'Default slot components for the time-grid view (day / week / work-week). Replace any of them via `components.time` on `CalendarProvider`.',
      },
    },
  },
}
export default meta

type Story = StoryObj

/** A day column heading: the date label and a drilldown button. Replace via `components.time.dayHeading`. */
export const TimeDayHeading: Story = {
  name: 'DefaultTimeDayHeading',
  render: () => (
    <div className="bc-calendar">
      <div style={{ display: 'flex', gap: '1rem' }}>
        <DefaultTimeDayHeading day="2026-06-14" label="Sun 14" isToday={false} onDrillDown={() => {}} />
        <DefaultTimeDayHeading day="2026-06-15" label="Mon 15" isToday={true} onDrillDown={() => {}} />
      </div>
    </div>
  ),
}

/** A time label in the left gutter. Replace via `components.time.timeLabel`. */
export const TimeLabel: Story = {
  name: 'DefaultTimeLabel',
  render: () => (
    <div className="bc-calendar">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <DefaultTimeLabel time="2026-06-15T09:00:00" label="9 AM" />
        <DefaultTimeLabel time="2026-06-15T10:00:00" label="10 AM" />
        <DefaultTimeLabel time="2026-06-15T11:00:00" label="11 AM" />
      </div>
    </div>
  ),
}

/**
 * A timed event's content: time range on top, title below. Rendered inside
 * the view's positioned `.bc-event` box; shown here in a mock wrapper so the
 * layout context is visible. Replace via `components.time.event`.
 */
export const TimeEvent: Story = {
  name: 'DefaultTimeEvent',
  render: () => (
    <div className="bc-calendar">
      <div
        className="bc-event"
        style={{ position: 'relative', inlineSize: '120px', blockSize: '60px', padding: '4px' }}
      >
        <DefaultTimeEvent
          event={{ id: '1', title: 'Team standup' }}
          title="Team standup"
          time="9:00 – 9:30 AM"
        />
      </div>
    </div>
  ),
}

/** An all-day event segment in the header row: just the title. Replace via `components.time.allDayEvent`. */
export const TimeAllDayEvent: Story = {
  name: 'DefaultTimeAllDayEvent',
  render: () => (
    <div className="bc-calendar">
      <DefaultTimeAllDayEvent
        event={{ id: '1', title: 'Company holiday' }}
        title="Company holiday"
      />
    </div>
  ),
}

/**
 * The "+N more" overflow indicator for the all-day row when too many all-day
 * events are stacked. Opens a popover listing the overflowed events. Replace
 * via `components.time.showMore`.
 */
export const TimeShowMore: Story = {
  name: 'DefaultTimeShowMore',
  render: () => (
    <div className="bc-calendar">
      <DefaultTimeShowMore
        count={2}
        label="+2 more"
        events={[
          { key: 'a', event: { id: 'a', title: 'Sprint review' }, title: 'Sprint review' },
          { key: 'b', event: { id: 'b', title: 'Team lunch' }, title: 'Team lunch' },
        ]}
      />
    </div>
  ),
}
