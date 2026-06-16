import { Views } from '@big-calendar/core'
import type { ViewKey } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Calendar } from '../src'
import { CalendarStage } from './harness'

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
        'Enable slot and day selection. When off, click/drag on the grid produces no slot callbacks.',
    },
    view: {
      control: 'select',
      options: [Views.MONTH, Views.WEEK, Views.WORK_WEEK, Views.DAY, Views.AGENDA],
      description: 'The calendar view to display.',
    },
  },
  render: ({ selectable, view, ...callbacks }) => (
    <CalendarStage defaultView={view} selectable={selectable} {...callbacks}>
      <Calendar />
    </CalendarStage>
  ),
}
