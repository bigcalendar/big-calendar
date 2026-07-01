import { Views } from '@big-calendar/core'
import type { ViewKey } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { fn } from 'storybook/test'
import DndCalendarStory from './DndCalendarStory.svelte'

type DndArgs = {
  view: ViewKey
  lockAllDayEvents: boolean
  onRangeChange: (a: unknown) => void
  onEventDrop: (a: unknown) => void
  onEventResize: (a: unknown) => void
}

const meta: Meta = {
  title: 'Drag & Drop/Event Drag & Drop',
  args: {
    onRangeChange: fn(),
    onEventDrop: fn(),
    onEventResize: fn(),
  },
}
export default meta

/**
 * Full drag-and-drop calendar: move events by dragging to a new day or slot,
 * resize timed events by dragging their top/bottom edge (time-grid views) or
 * leading/trailing edge (month view). Keyboard DnD is also available — Tab to
 * an event, Space to pick it up, arrow keys to move, Shift+arrows to resize,
 * Enter or Escape to drop or cancel.
 *
 * Use the **Controls** panel to switch between views and toggle **Lock all-day
 * events** to see `accessors.draggable` prevent picks on all-day events while
 * timed events still move.
 *
 * Events update in place on every drop so you can reposition them repeatedly.
 */
export const EventDragAndDrop: StoryObj<DndArgs> = {
  args: { view: Views.WEEK, lockAllDayEvents: false },
  argTypes: {
    view: {
      control: 'select',
      options: [Views.MONTH, Views.WEEK, Views.WORK_WEEK, Views.DAY],
      description:
        'Calendar view. Month moves by whole day; time-grid views snap to the dropped slot and preserve duration.',
    },
    lockAllDayEvents: {
      control: 'boolean',
      description:
        'Set accessors.draggable to return false for all-day events, preventing them from being picked up.',
    },
  },
  render: (args) => ({
    Component: DndCalendarStory,
    props: { defaultView: args.view, ...args },
  }),
}
