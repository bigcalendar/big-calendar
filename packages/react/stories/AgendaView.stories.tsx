import { Views } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { AgendaView, Toolbar } from '../src'
import { CalendarStage } from './harness'

const meta: Meta<typeof AgendaView> = {
  title: 'React/Views/AgendaView',
  component: AgendaView,
  parameters: {
    docs: {
      description: {
        component:
          'Agenda view: a scrollable, chronological list of events grouped by day (date · time · event). Self-gates to `null` unless the active view is `agenda`.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof AgendaView>

export const Default: Story = {
  render: () => (
    <CalendarStage defaultView={Views.AGENDA}>
      <Toolbar />
      <div className="bc-calendar">
        <AgendaView />
      </div>
    </CalendarStage>
  ),
}
