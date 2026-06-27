import { Views } from '@big-calendar/core'
import type { ViewKey } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Calendar from '../src/Calendar/Calendar.vue'
import CalendarProvider from '../src/CalendarProvider/CalendarProvider.vue'
import { demoEvents, FOCUS, localizer, NOW } from './harness'

const meta: Meta = {
  title: 'Selection/Selectable',
}
export default meta

/**
 * Calendar with slot and event selection enabled. Click or drag on empty time
 * to see the selection highlight. Actions fired by each gesture are logged in
 * the browser console — wire `onSlotClick`, `onSlotDoubleClick`, and
 * `onSlotSelect` to your own handlers to open a create-event modal.
 *
 * Switch views with the **Controls** panel to compare how slot payloads differ
 * between the month grid and the time grid.
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
      const onSlotClick = (payload: unknown) => console.log('onSlotClick', payload)
      const onSlotDoubleClick = (payload: unknown) => console.log('onSlotDoubleClick', payload)
      const onSlotSelect = (payload: unknown) => console.log('onSlotSelect', payload)
      return { localizer, events: demoEvents, FOCUS, getNow, args, onSlotClick, onSlotDoubleClick, onSlotSelect }
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
          :onSlotClick="onSlotClick"
          :onSlotDoubleClick="onSlotDoubleClick"
          :onSlotSelect="onSlotSelect"
        >
          <Calendar />
        </CalendarProvider>
      </div>
    `,
  }),
}
