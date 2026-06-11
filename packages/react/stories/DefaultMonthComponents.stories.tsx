import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  DefaultMonthDate,
  DefaultMonthEvent,
  DefaultMonthShowMore,
  DefaultMonthWeekday,
} from '../src'

const meta: Meta = {
  title: 'React/Default Components/Month',
  parameters: {
    docs: {
      description: {
        component:
          'Default slot components for the month view. Replace any of them via `components.month` on `CalendarProvider`.',
      },
    },
  },
}
export default meta

type Story = StoryObj

/** A weekday column heading. Renders both the full and abbreviated names; CSS shows whichever fits. Replace via `components.month.weekday`. */
export const MonthWeekday: Story = {
  name: 'DefaultMonthWeekday',
  render: () => (
    <div className="bc-calendar">
      <div style={{ display: 'flex', gap: '1rem' }}>
        <DefaultMonthWeekday day="2026-06-15" long="Monday" short="Mon" />
        <DefaultMonthWeekday day="2026-06-16" long="Tuesday" short="Tue" />
        <DefaultMonthWeekday day="2026-06-17" long="Wednesday" short="Wed" />
      </div>
    </div>
  ),
}

/** A day cell's date number, clickable to drill into that day. Replace via `components.month.dateCell`. */
export const MonthDate: Story = {
  name: 'DefaultMonthDate',
  render: () => (
    <div className="bc-calendar">
      <div style={{ display: 'flex', gap: '1rem' }}>
        <DefaultMonthDate day="2026-06-10" label="10" isToday={false} isOffRange={false} onDrillDown={() => {}} />
        <DefaultMonthDate day="2026-06-15" label="15" isToday={true} isOffRange={false} onDrillDown={() => {}} />
        <DefaultMonthDate day="2026-05-31" label="31" isToday={false} isOffRange={true} onDrillDown={() => {}} />
      </div>
    </div>
  ),
}

/** An event segment inside a week row. Rendered inside an `EventButton`; receives the event and its resolved title. Replace via `components.month.event`. */
export const MonthEvent: Story = {
  name: 'DefaultMonthEvent',
  render: () => (
    <div className="bc-calendar">
      <DefaultMonthEvent
        event={{ id: '1', title: 'Team standup' }}
        title="Team standup"
      />
    </div>
  ),
}

/**
 * The "+N more" overflow button shown when events exceed the week row limit.
 * Opens a popover listing the overflowed events. Replace via
 * `components.month.showMore`.
 */
export const MonthShowMore: Story = {
  name: 'DefaultMonthShowMore',
  render: () => (
    <div className="bc-calendar">
      <DefaultMonthShowMore
        count={3}
        label="+3 more"
        day="2026-06-15"
        events={[
          { key: 'a', event: { id: 'a', title: 'Sprint planning' }, title: 'Sprint planning' },
          { key: 'b', event: { id: 'b', title: 'Code review' }, title: 'Code review' },
          { key: 'c', event: { id: 'c', title: 'Deploy to staging' }, title: 'Deploy to staging' },
        ]}
      />
    </div>
  ),
}
