import { html } from 'lit'
import { Views } from '@big-calendar/core'
import type { ViewKey } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { fn } from 'storybook/test'
import '@big-calendar/lit'
import { demoEvents, FOCUS, litLocalizer, NOW } from './harness'

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
 * second argument. The browser's native context menu still appears unless you call
 * `e.preventDefault()` in your handler. Middle-click (scroll-wheel click) fires
 * `onEventMiddleClick` — some browsers suppress middle-click inside iframes, so
 * test it in your own app if it does not trigger here.
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
  render: (args) => html`
    <div style="block-size:100dvh;inline-size:100%">
      <bc-calendar
        .localizer=${litLocalizer.current}
        .events=${demoEvents}
        .defaultDate=${FOCUS}
        .getNow=${() => NOW}
        .defaultView=${args.view}
        .onEventClick=${args.onEventClick}
        .onEventDoubleClick=${args.onEventDoubleClick}
        .onEventRightClick=${args.onEventRightClick}
        .onEventMiddleClick=${args.onEventMiddleClick}
        .onRangeChange=${args.onRangeChange}
      >
        <bc-default-toolbar></bc-default-toolbar>
        <bc-month-view></bc-month-view>
        <bc-time-grid-view></bc-time-grid-view>
        <bc-agenda-view></bc-agenda-view>
      </bc-calendar>
    </div>
  `,
}
