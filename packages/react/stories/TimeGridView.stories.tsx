import { Views } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { TimeGridView, Toolbar } from '../src'
import { CalendarStage, SelectionDemo } from './harness'

const meta: Meta<typeof TimeGridView> = {
  title: 'React/Views/TimeGridView',
  component: TimeGridView,
  parameters: {
    docs: {
      description: {
        component:
          'Time grid shared by the day / week / work-week views: a scrollable slot body with positioned event boxes, an all-day row, and a now-indicator. Renders under any `time`-kind view.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof TimeGridView>

const render = (defaultView: (typeof Views)[keyof typeof Views]) => () => (
  <CalendarStage defaultView={defaultView}>
    <Toolbar />
    <div className="bc-calendar">
      <TimeGridView />
    </div>
  </CalendarStage>
)

export const Week: Story = { render: render(Views.WEEK) }
export const WorkWeek: Story = { render: render(Views.WORK_WEEK) }
export const Day: Story = { render: render(Views.DAY) }

/**
 * `selectable` on. Drag down a column to select a time range, click or
 * double-click a slot, or click a timed/all-day event. Each gesture's payload
 * (ISO `start`/`end`/`slots` + `action`) shows in the read-out below the grid.
 */
export const Selectable: Story = {
  render: () => (
    <SelectionDemo defaultView={Views.WEEK}>
      <Toolbar />
      <div className="bc-calendar">
        <TimeGridView />
      </div>
    </SelectionDemo>
  ),
}
