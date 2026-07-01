import { Views } from '@big-calendar/core'
import type { ViewKey } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Calendar } from '../src'
import { CalendarStage } from './harness'

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
 *
 * **Tip:** Right-click fires `onEventRightClick` with the DOM `MouseEvent` as a
 * second argument. The browser's native context menu still appears unless you
 * call `e.preventDefault()` in your handler. Middle-click (scroll-wheel click)
 * fires `onEventMiddleClick` — some browsers and pointer devices suppress
 * middle-click inside iframes, so test it in your own app if it doesn't trigger
 * here in Storybook.
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
  render: ({ view, ...callbacks }) => (
    <CalendarStage defaultView={view} {...callbacks}>
      <Calendar />
    </CalendarStage>
  ),
}
