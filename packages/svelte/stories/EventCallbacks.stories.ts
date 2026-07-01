import { Views } from '@big-calendar/core'
import type { ViewKey } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { fn } from 'storybook/test'
import CalendarStory from './CalendarStory.svelte'

const meta: Meta = {
  title: 'Events/Event Callbacks',
  args: {
    onEventClick: fn(),
    onEventDoubleClick: fn(),
    onEventRightClick: fn(),
    onEventMiddleClick: fn(),
    onRangeChange: fn(),
  },
}
export default meta

/**
 * All four event callbacks wired to the **Actions** panel. Click, double-click,
 * right-click, or middle-click any event block to see the full event object logged.
 *
 * These callbacks fire whether or not `selectable` is enabled — they are
 * completely independent of slot selection.
 */
export const EventCallbacks: StoryObj<{ view: ViewKey }> = {
  args: { view: Views.WEEK },
  argTypes: {
    view: {
      control: 'select',
      options: [Views.MONTH, Views.WEEK, Views.WORK_WEEK, Views.DAY, Views.AGENDA],
      description: 'Switch views to explore how event callbacks behave across different layouts.',
    },
  },
  render: (args) => ({
    Component: CalendarStory,
    props: { defaultView: args.view, ...args },
  }),
}
