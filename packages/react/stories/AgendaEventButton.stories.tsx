import { Views } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { AgendaEventButton, AgendaView, Toolbar } from '../src'
import { CalendarStage, SelectionDemo } from './harness'

const meta: Meta<typeof AgendaEventButton> = {
  title: 'React/AgendaEventButton',
  component: AgendaEventButton,
  parameters: {
    docs: {
      description: {
        component:
          "Agenda event title element. Renders as an interactive `<button>` when `CalendarProvider` has event handlers (`onEventClick`, `onEventDoubleClick`, etc.) wired, or a plain `<span>` when none are provided. The button is styled to read as a link — it signals an action, not navigation.",
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof AgendaEventButton>

/**
 * Event handlers (`onEventClick`, `onEventDoubleClick`) are wired on the
 * provider via `SelectionDemo`. Every event title in the list renders as a
 * focusable `<button>`. Click or double-click an event to see the payload in
 * the read-out below the view.
 */
export const Interactive: Story = {
  render: () => (
    <SelectionDemo defaultView={Views.AGENDA} views={[Views.AGENDA]}>
      <Toolbar />
      <div className="bc-calendar">
        <AgendaView />
      </div>
    </SelectionDemo>
  ),
}

/**
 * No event handlers on the provider — every event title renders as a plain,
 * non-interactive `<span>`. Use this when the calendar is display-only and
 * you do not need to respond to event clicks.
 */
export const Static: Story = {
  render: () => (
    <CalendarStage defaultView={Views.AGENDA} views={[Views.AGENDA]}>
      <Toolbar />
      <div className="bc-calendar">
        <AgendaView />
      </div>
    </CalendarStage>
  ),
}
