import { Views } from '@big-calendar/core'
import type { DayLayoutAlgorithmKey, ViewKey } from '@big-calendar/core'
import type { PlainTimeInput } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Calendar } from '../src'
import { CalendarStage } from './harness'

const meta: Meta<typeof Calendar> = {
  title: 'Calendar/Standard',
  component: Calendar,
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
  args: { defaultView: Views.MONTH, weekEventLimit: undefined, showAllEvents: false, dayLayoutAlgorithm: 'overlap', onRangeChange: fn() },
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
      options: ['overlap', 'no-overlap'] satisfies DayLayoutAlgorithmKey[],
      description:
        'Week / Work Week / Day views only. `overlap` packs concurrent events into side-by-side columns that share the full width. `no-overlap` stacks events that touch in time into narrower independent columns so nothing overlaps visually.',
    },
  },
  render: ({ defaultView, weekEventLimit, showAllEvents, dayLayoutAlgorithm, ...callbacks }) => (
    <CalendarStage
      key={`${String(showAllEvents)}-${weekEventLimit}`}
      defaultView={defaultView}
      weekEventLimit={weekEventLimit}
      showAllEvents={showAllEvents}
      dayLayoutAlgorithm={dayLayoutAlgorithm}
      {...callbacks}
    >
      <Calendar />
    </CalendarStage>
  ),
}

/**
 * Use `min` and `max` to restrict the visible time window in the Week, Work
 * Week, and Day views. Both props accept a `{ hour, minute? }` object where
 * `hour` is 0–23 and `minute` defaults to 0.
 *
 * The grid always shows full slots up to (but not including) the `max` boundary
 * — you will never see a label for that hour itself, because it would be the
 * start of the next, invisible slot. Events that fall outside the window are
 * still tracked; they are clipped at the top or bottom edge.
 *
 * Use the **Controls** panel to adjust the start and end hours and observe how
 * the grid and event positions change. The calendar remounts when either value
 * changes because `min` and `max` are resolved once at store creation.
 */
export const TimeWindow: StoryObj<{
  minHour: number
  maxHour: number
}> = {
  args: { minHour: 8, maxHour: 18 },
  argTypes: {
    minHour: {
      control: { type: 'number', min: 0, max: 23 },
      description:
        'Earliest hour shown in the time grid (0–23). Passed as `min: { hour }`. ' +
        '0 = start of day (midnight). Increase to hide early-morning hours.',
    },
    maxHour: {
      control: { type: 'number', min: 1, max: 23 },
      description:
        'Exclusive end hour of the visible window (1–23). Passed as `max: { hour }`. ' +
        'The last visible slot begins just before this boundary. ' +
        '0 = full day (same as omitting max entirely).',
    },
  },
  render: ({ minHour, maxHour }) => {
    const min: PlainTimeInput = { hour: minHour }
    const max: PlainTimeInput = { hour: maxHour }
    return (
      <CalendarStage
        key={`${minHour}-${maxHour}`}
        defaultView={Views.WEEK}
        min={min}
        max={max}
      >
        <Calendar />
      </CalendarStage>
    )
  },
}
