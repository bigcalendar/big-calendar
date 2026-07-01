import { Views } from '@big-calendar/core'
import type { ViewKey } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'
import Calendar from '../src/Calendar/Calendar.vue'
import CalendarProvider from '../src/CalendarProvider/CalendarProvider.vue'
import { demoEvents, FOCUS, localizer, NOW } from './harness'

const meta: Meta = {
  title: 'Selection/Selectable',
  args: {
    onSlotClick: fn(),
    onSlotDoubleClick: fn(),
    onSlotSelect: fn(),
    onEventClick: fn(),
    onEventDoubleClick: fn(),
    onEventRightClick: fn(),
    onEventMiddleClick: fn(),
    onRangeChange: fn(),
  },
}
export default meta

/**
 * Calendar with slot and event selection enabled. Every gesture — click,
 * double-click, drag-to-select — fires a callback logged in the **Actions**
 * panel below. Switch views with the **Controls** panel to explore how slot
 * payloads differ between the month grid and the time grid.
 */
export const Selectable: StoryObj<{ selectable: boolean; view: ViewKey }> = {
  args: { selectable: true, view: Views.MONTH },
  argTypes: {
    selectable: {
      control: 'boolean',
      description:
        'Enable slot and day selection. When off, clicking or dragging the grid produces no slot callbacks.',
    },
    view: {
      control: 'select',
      options: [Views.MONTH, Views.WEEK, Views.WORK_WEEK, Views.DAY, Views.AGENDA],
      description: 'The calendar view to display.',
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
          :selectable="args.selectable"
          :onSlotClick="args.onSlotClick"
          :onSlotDoubleClick="args.onSlotDoubleClick"
          :onSlotSelect="args.onSlotSelect"
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
