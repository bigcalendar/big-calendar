import { html } from 'lit'
import { Views } from '@big-calendar/core'
import type { ViewKey } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { fn } from 'storybook/test'
import '@big-calendar/lit'
import { demoEvents, FOCUS, litLocalizer, NOW } from './harness'

const meta: Meta = {
  title: 'Selection/Selectable',
  args: {
    onSlotClick: fn(),
    onSlotDoubleClick: fn(),
    onSlotSelect: fn(),
    onSlotSelecting: fn(),
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
  render: (args) => html`
    <div style="block-size:100dvh;inline-size:100%">
      <bc-calendar
        style="display:grid;grid-template-rows:auto 1fr;row-gap:0.5rem;block-size:100%;inline-size:100%"
        .localizer=${litLocalizer.current}
        .events=${demoEvents}
        .defaultDate=${FOCUS}
        .getNow=${() => NOW}
        .defaultView=${args.view}
        .selectable=${args.selectable}
        .onSlotClick=${args.onSlotClick}
        .onSlotDoubleClick=${args.onSlotDoubleClick}
        .onSlotSelect=${args.onSlotSelect}
        .onSlotSelecting=${args.onSlotSelecting}
        .onEventClick=${args.onEventClick}
        .onEventDoubleClick=${args.onEventDoubleClick}
        .onEventRightClick=${args.onEventRightClick}
        .onEventMiddleClick=${args.onEventMiddleClick}
        .onRangeChange=${args.onRangeChange}
      >
        <bc-default-toolbar></bc-default-toolbar>
        <div class="bc-calendar">
          <bc-month-view></bc-month-view>
          <bc-time-grid-view></bc-time-grid-view>
          <bc-agenda-view></bc-agenda-view>
        </div>
      </bc-calendar>
    </div>
  `,
}
