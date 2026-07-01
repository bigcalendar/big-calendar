import { Views } from '@big-calendar/core'
import type { DayLayoutAlgorithmKey, ViewKey } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { fn } from 'storybook/test'
import CalendarStory from './CalendarStory.svelte'

const meta: Meta = {
  title: 'Calendar/Standard',
}
export default meta

/**
 * The full calendar with toolbar and all five views. Use the **Controls** panel
 * to choose which view opens first, then switch between views using the toolbar.
 *
 * `weekEventLimit` controls the month view's show-more threshold. `showAllEvents`
 * controls the all-day strip height cap in the week / work-week / day views.
 * `dayLayoutAlgorithm` controls how overlapping timed events are packed
 * horizontally in the time-grid views (Week / Work Week / Day).
 */
export const Standard: StoryObj<{
  defaultView: ViewKey
  weekEventLimit: number | undefined
  showAllEvents: boolean
  dayLayoutAlgorithm: DayLayoutAlgorithmKey
}> = {
  args: {
    defaultView: Views.MONTH,
    weekEventLimit: undefined,
    showAllEvents: false,
    dayLayoutAlgorithm: 'overlap',
    onRangeChange: fn(),
  },
  argTypes: {
    defaultView: {
      control: 'select',
      options: [Views.MONTH, Views.WEEK, Views.WORK_WEEK, Views.DAY, Views.AGENDA],
      description:
        'The view the calendar opens on. Use the toolbar to switch between views once it loads.',
    },
    weekEventLimit: {
      control: { type: 'number', min: 1 },
      description:
        'Month view only. Fix the number of visible event rows per week cell before the "+ N more" button appears. When unset, the cell height is measured automatically.',
    },
    showAllEvents: {
      control: 'boolean',
      description:
        'Week / Work Week / Day views only. Remove the default 2-row cap on the all-day strip so every all-day and multi-day event is always visible.',
    },
    dayLayoutAlgorithm: {
      control: 'select',
      options: ['overlap', 'no-overlap'] as DayLayoutAlgorithmKey[],
      description:
        'Week / Work Week / Day views only. `overlap` packs concurrent events into side-by-side columns that share the full width. `no-overlap` stacks events that touch in time into narrower independent columns so nothing overlaps visually.',
    },
  },
  render: (args) => ({
    Component: CalendarStory,
    props: {
      ...args,
      storeKey: `${String(args.showAllEvents)}-${args.weekEventLimit}`,
    },
  }),
}

/**
 * The time grid scrolls to a specific time on load. When `scrollToTime` is
 * omitted the calendar defaults to the **current time** in the configured
 * time zone. Pass a fixed value like `{ hour: 8 }` to always open at the
 * same hour regardless of when the page loads.
 */
export const ScrollToTime: StoryObj<{ scrollToHour: number }> = {
  args: { scrollToHour: new Date().getHours() },
  argTypes: {
    scrollToHour: {
      control: { type: 'number', min: 0, max: 23 },
      description:
        'Hour the time grid scrolls to on load (0–23). Passed as `scrollToTime: { hour }`. Defaults to the current hour.',
    },
  },
  render: (args) => ({
    Component: CalendarStory,
    props: {
      defaultView: Views.WEEK,
      scrollToTime: { hour: args.scrollToHour },
      storeKey: `scroll-${args.scrollToHour}`,
    },
  }),
}

/**
 * Use `min` and `max` to restrict the visible time window in the Week, Work
 * Week, and Day views. Events outside the window are clipped at the edges.
 */
export const TimeWindow: StoryObj<{ minHour: number; maxHour: number }> = {
  args: { minHour: 8, maxHour: 18 },
  argTypes: {
    minHour: {
      control: { type: 'number', min: 0, max: 23 },
      description:
        'Earliest hour shown in the time grid (0–23). Passed as `min: { hour }`. 0 = start of day.',
    },
    maxHour: {
      control: { type: 'number', min: 1, max: 23 },
      description:
        'Exclusive end hour of the visible window (1–23). Passed as `max: { hour }`. 0 = full day.',
    },
  },
  render: (args) => ({
    Component: CalendarStory,
    props: {
      defaultView: Views.WEEK,
      min: { hour: args.minHour },
      max: { hour: args.maxHour },
      storeKey: `window-${args.minHour}-${args.maxHour}`,
    },
  }),
}
