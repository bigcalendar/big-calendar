import { Views } from '@big-calendar/core'
import type { ViewKey } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Calendar from '../src/Calendar/Calendar.vue'
import CalendarProvider from '../src/CalendarProvider/CalendarProvider.vue'
import { demoEvents, FOCUS, localizer, NOW } from './harness'

const meta: Meta = {
  title: 'Calendar/Standard',
}
export default meta

/**
 * The full calendar with toolbar and all five views. Use the **Controls** panel
 * to choose which view opens first, then switch between views with the toolbar.
 */
export const Standard: StoryObj<{ defaultView: ViewKey }> = {
  args: { defaultView: Views.MONTH },
  argTypes: {
    defaultView: {
      control: 'select',
      options: [Views.MONTH, Views.WEEK, Views.WORK_WEEK, Views.DAY, Views.AGENDA],
      description:
        'The view the calendar opens on. Switch views with the toolbar after it loads.',
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
          :defaultView="args.defaultView"
        >
          <Calendar />
        </CalendarProvider>
      </div>
    `,
  }),
}

/**
 * Opens directly on the week grid (Mon Jun 15, 2026). Navigate to any other
 * day column in the Day view to see the side-by-side overlap layout for
 * concurrent events.
 */
export const WeekView: StoryObj = {
  render: () => ({
    components: { CalendarProvider, Calendar },
    setup() {
      const getNow = () => NOW
      return { localizer, events: demoEvents, FOCUS, getNow }
    },
    template: `
      <div style="block-size: 100dvh; inline-size: 100%">
        <CalendarProvider
          :localizer="localizer"
          :events="events"
          :defaultDate="FOCUS"
          :getNow="getNow"
          defaultView="${Views.WEEK}"
        >
          <Calendar />
        </CalendarProvider>
      </div>
    `,
  }),
}

/**
 * Single-day view for Mon Jun 15, 2026 — the focus date. Several overlapping
 * events are scheduled for the morning block; the day layout algorithm
 * (default: `overlap`) packs them side-by-side.
 */
export const DayView: StoryObj = {
  render: () => ({
    components: { CalendarProvider, Calendar },
    setup() {
      const getNow = () => NOW
      return { localizer, events: demoEvents, FOCUS, getNow }
    },
    template: `
      <div style="block-size: 100dvh; inline-size: 100%">
        <CalendarProvider
          :localizer="localizer"
          :events="events"
          :defaultDate="FOCUS"
          :getNow="getNow"
          defaultView="${Views.DAY}"
        >
          <Calendar />
        </CalendarProvider>
      </div>
    `,
  }),
}

/**
 * Agenda view — a scrollable list of upcoming events starting from the focus
 * date. Spans 30 days by default; change the `length` prop to show more.
 */
export const AgendaView: StoryObj = {
  render: () => ({
    components: { CalendarProvider, Calendar },
    setup() {
      const getNow = () => NOW
      return { localizer, events: demoEvents, FOCUS, getNow }
    },
    template: `
      <div style="block-size: 100dvh; inline-size: 100%">
        <CalendarProvider
          :localizer="localizer"
          :events="events"
          :defaultDate="FOCUS"
          :getNow="getNow"
          defaultView="${Views.AGENDA}"
        >
          <Calendar />
        </CalendarProvider>
      </div>
    `,
  }),
}
