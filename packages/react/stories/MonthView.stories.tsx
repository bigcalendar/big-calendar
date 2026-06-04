import { Views } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { MonthView, Toolbar } from '../src'
import { CalendarStage } from './harness'

const meta: Meta<typeof MonthView> = {
  title: 'React/Views/MonthView',
  component: MonthView,
  parameters: {
    docs: {
      description: {
        component:
          'Month grid: a 5- or 6-week view of date cells with multi-day event segments. Self-gates to `null` unless the active view is `month`, so it renders here under a `month` provider.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof MonthView>

export const Default: Story = {
  render: () => (
    <CalendarStage defaultView={Views.MONTH}>
      <Toolbar />
      <div className="bc-calendar">
        <MonthView />
      </div>
    </CalendarStage>
  ),
}
