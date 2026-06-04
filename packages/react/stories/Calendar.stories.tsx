import { Views } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Calendar } from '../src'
import { CalendarStage } from './harness'

const meta: Meta<typeof Calendar> = {
  title: 'React/Calendar',
  component: Calendar,
  parameters: {
    docs: {
      description: {
        component:
          'The default calendar tree. Reads the active view from context and renders the matching view inside `.bc-calendar`, with the toolbar as a sibling outside it. One view renders at a time — the toolbar switches between them. Must be wrapped in a `CalendarProvider`.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof Calendar>

/** Month view with the toolbar (the default). Use the toolbar to switch views. */
export const Default: Story = {
  render: () => (
    <CalendarStage defaultView={Views.MONTH}>
      <Calendar />
    </CalendarStage>
  ),
}

/** Opened on the week view. */
export const Week: Story = {
  render: () => (
    <CalendarStage defaultView={Views.WEEK}>
      <Calendar />
    </CalendarStage>
  ),
}

/** Opened on the agenda view. */
export const Agenda: Story = {
  render: () => (
    <CalendarStage defaultView={Views.AGENDA}>
      <Calendar />
    </CalendarStage>
  ),
}

/** `toolbar={false}` omits the navigation toolbar; the view fills the stage. */
export const WithoutToolbar: Story = {
  render: () => (
    <CalendarStage defaultView={Views.MONTH} rows="1fr">
      <Calendar toolbar={false} />
    </CalendarStage>
  ),
}
