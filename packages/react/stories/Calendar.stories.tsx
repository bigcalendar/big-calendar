import { Views } from '@big-calendar/core'
import type { ViewKey } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Calendar } from '../src'
import { CalendarStage } from './harness'

const meta: Meta<typeof Calendar> = {
  title: 'Calendar/Standard',
  component: Calendar,
}
export default meta

/**
 * The full calendar with toolbar and all five views. Use the **Controls** panel
 * to choose which view opens first, then switch between views using the toolbar.
 *
 * `weekEventLimit` controls the month view's show-more threshold. `showAllEvents`
 * controls the all-day strip height cap in the week / work-week / day views.
 */
export const Standard: StoryObj<{
  defaultView: ViewKey
  weekEventLimit: number | undefined
  showAllEvents: boolean
}> = {
  args: { defaultView: Views.MONTH, weekEventLimit: undefined, showAllEvents: false },
  argTypes: {
    defaultView: {
      control: 'select',
      options: [Views.MONTH, Views.WEEK, Views.WORK_WEEK, Views.DAY, Views.AGENDA],
      description:
        'The view the calendar opens on. Use the toolbar to switch between views once it loads.',
    },
    weekEventLimit: {
      control: { type: 'number', min: 1 },
      description:
        'Month view only. Fix the number of visible event rows per week cell before the "+ N more" button appears. When unset, the cell height is measured automatically.',
    },
    showAllEvents: {
      control: 'boolean',
      description:
        'Week / Work Week / Day views only. Remove the default 2-row cap on the all-day strip so every all-day and multi-day event is always visible.',
    },
  },
  render: ({ defaultView, weekEventLimit, showAllEvents }) => (
    <CalendarStage
      defaultView={defaultView}
      weekEventLimit={weekEventLimit}
      showAllEvents={showAllEvents}
    >
      <Calendar />
    </CalendarStage>
  ),
}
