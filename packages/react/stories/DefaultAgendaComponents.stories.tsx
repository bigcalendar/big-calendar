import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  DefaultAgendaDate,
  DefaultAgendaEmpty,
  DefaultAgendaEvent,
} from '../src'
import { CalendarStage } from './harness'

const meta: Meta = {
  title: 'React/Default Components/Agenda',
  parameters: {
    docs: {
      description: {
        component:
          'Default slot components for the agenda view. Replace any of them via `components.agenda` on `CalendarProvider`.',
      },
    },
  },
}
export default meta

type Story = StoryObj

/** The date label for a group of events on the same day. Replace via `components.agenda.date`. */
export const AgendaDate: Story = {
  name: 'DefaultAgendaDate',
  render: () => (
    <div className="bc-calendar">
      <DefaultAgendaDate day="2026-06-15" label="Monday, Jun 15" />
    </div>
  ),
}

/**
 * The empty state shown when the agenda range has no events. Replace via
 * `components.agenda.empty`.
 */
export const AgendaEmpty: Story = {
  name: 'DefaultAgendaEmpty',
  render: () => (
    <div className="bc-calendar">
      <DefaultAgendaEmpty message="No events in this range." />
    </div>
  ),
}

/**
 * A single event row: a formatted time on the left and the event title as an
 * interactive button on the right. The button only renders when the
 * `CalendarProvider` has event handlers wired — here `onEventClick` is present
 * so it renders as a `<button>`. Replace via `components.agenda.event`.
 */
export const AgendaEvent: Story = {
  name: 'DefaultAgendaEvent',
  render: () => (
    <CalendarStage height="auto" rows="auto" onEventClick={() => {}}>
      <div className="bc-calendar">
        <DefaultAgendaEvent
          event={{ id: '1', title: 'Team standup' }}
          title="Team standup"
          time="9:00 – 9:30 AM"
          allDay={false}
        />
      </div>
    </CalendarStage>
  ),
}

/**
 * Same component with `allDay={true}` — the time column shows the all-day
 * label instead of a time range.
 */
export const AgendaEventAllDay: Story = {
  name: 'DefaultAgendaEvent (all-day)',
  render: () => (
    <CalendarStage height="auto" rows="auto" onEventClick={() => {}}>
      <div className="bc-calendar">
        <DefaultAgendaEvent
          event={{ id: '2', title: 'Company holiday' }}
          title="Company holiday"
          time="All day"
          allDay={true}
        />
      </div>
    </CalendarStage>
  ),
}
