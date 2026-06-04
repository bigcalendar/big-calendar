import { Views } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Toolbar } from '../src'
import { CalendarStage } from './harness'

const meta: Meta<typeof Toolbar> = {
  title: 'React/Toolbar',
  component: Toolbar,
  parameters: {
    docs: {
      description: {
        component:
          'Navigation toolbar: today / prev / next, the current range label, and the view switcher. It reads everything from context and renders `components.toolbar ?? DefaultToolbar` with no wrapper element — so it can stand alone in a provider, outside `.bc-calendar`.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof Toolbar>

/** The toolbar rendered on its own inside a provider — no calendar view present. */
export const Standalone: Story = {
  render: () => (
    <CalendarStage defaultView={Views.MONTH} rows="auto" height="auto">
      <Toolbar />
    </CalendarStage>
  ),
}

/** Driven by the week view, showing the week range label and active view button. */
export const WeekView: Story = {
  render: () => (
    <CalendarStage defaultView={Views.WEEK} rows="auto" height="auto">
      <Toolbar />
    </CalendarStage>
  ),
}
