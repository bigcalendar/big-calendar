import { Views } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { MonthView, TimeGridView, Toolbar } from '../src'
import { CalendarStage, SelectionDemo } from './harness'

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
    <CalendarStage defaultView={Views.MONTH} views={[Views.MONTH, Views.DAY]}>
      <Toolbar />
      <div className="bc-calendar">
        <MonthView />
        <TimeGridView />
      </div>
    </CalendarStage>
  ),
}

/**
 * `selectable` on, day mode. Drag across day cells to select a range of days
 * (the highlight bands per week row), or click / double-click a single day. The
 * emitted payload (ISO `start`/`end`/`slots` + `action`) shows below the grid;
 * clicking the date number still drills into that day, and events stay clickable.
 */
export const Selectable: Story = {
  render: () => (
    <SelectionDemo defaultView={Views.MONTH} views={[Views.MONTH, Views.DAY]}>
      <Toolbar />
      <div className="bc-calendar">
        <MonthView />
        <TimeGridView />
      </div>
    </SelectionDemo>
  ),
}
