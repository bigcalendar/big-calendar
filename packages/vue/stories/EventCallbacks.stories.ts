import { Views } from '@big-calendar/core'
import type { ViewKey } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'
import Calendar from '../src/Calendar/Calendar.vue'
import CalendarProvider from '../src/CalendarProvider/CalendarProvider.vue'
import { demoEvents, FOCUS, localizer, NOW } from './harness'

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
  render: (args) => ({
    components: { CalendarProvider, Calendar },
    setup() {
      const getNow = () => NOW
      return { localizer, events: demoEvents, FOCUS, getNow, args }
    },
    template: `
      <div style="block-size: 100dvh; inline-size: 100%">
        <CalendarProvider
          :localizer="localizer"
          :events="events"
          :defaultDate="FOCUS"
          :getNow="getNow"
          :defaultView="args.view"
          :onEventClick="args.onEventClick"
          :onEventDoubleClick="args.onEventDoubleClick"
          :onEventRightClick="args.onEventRightClick"
          :onEventMiddleClick="args.onEventMiddleClick"
          :onRangeChange="args.onRangeChange"
        >
          <Calendar />
        </CalendarProvider>
      </div>
    `,
  }),
}
