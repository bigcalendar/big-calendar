import { Views } from '@big-calendar/core'
import type { DayLayoutAlgorithmKey, ViewKey } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { fn } from 'storybook/test'
import DndBgCalendarStory from './DndBgCalendarStory.svelte'
import CalendarStory from './CalendarStory.svelte'

const singleDayBg = [
  { id: 1001, title: 'Deep work', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T12:00:00.000Z' },
  { id: 1002, title: 'Sprint focus', start: '2026-06-16T09:00:00.000Z', end: '2026-06-18T17:00:00.000Z' },
  { id: 1003, title: 'Review window', start: '2026-06-19T13:00:00.000Z', end: '2026-06-19T17:00:00.000Z' },
]

const overlappingBg = [
  { id: 1004, title: 'Focus block A', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T13:00:00.000Z' },
  { id: 1005, title: 'Focus block B', start: '2026-06-15T11:00:00.000Z', end: '2026-06-15T15:00:00.000Z' },
  { id: 1006, title: 'Sprint focus', start: '2026-06-16T09:00:00.000Z', end: '2026-06-18T17:00:00.000Z' },
]

const dayLayoutArgType = {
  control: 'select',
  options: ['overlap', 'no-overlap'] as DayLayoutAlgorithmKey[],
  description:
    '`overlap` packs concurrent events side-by-side. `no-overlap` gives each event its own lane.',
}

const meta: Meta = {
  title: 'Background Events/With Background Events',
  args: {
    onSlotClick: fn(),
    onSlotDoubleClick: fn(),
    onSlotSelect: fn(),
    onSlotSelecting: fn(),
    onEventDrop: fn(),
    onEventResize: fn(),
    onRangeChange: fn(),
  },
}
export default meta

type BgArgs = { view: ViewKey; overlapping: boolean; dayLayoutAlgorithm: DayLayoutAlgorithmKey }

/**
 * Background events appear behind timed events as coloured bands. Pointer events
 * pass straight through them — slot selection and event interaction still work
 * anywhere on their surface.
 *
 * Toggle **Overlapping** in Controls to see two background events share the
 * column width on the same day.
 */
export const WithBackgroundEvents: StoryObj<BgArgs> = {
  args: { view: Views.WEEK, overlapping: false, dayLayoutAlgorithm: 'overlap' },
  argTypes: {
    view: {
      control: 'select',
      options: [Views.WEEK, Views.WORK_WEEK, Views.DAY],
      description: 'Time-grid view to render.',
    },
    overlapping: {
      control: 'boolean',
      description: 'Show two overlapping background events on Jun 15.',
    },
    dayLayoutAlgorithm: dayLayoutArgType,
  },
  render: (args) => ({
    Component: CalendarStory,
    props: {
      defaultView: args.view,
      views: [Views.WEEK, Views.WORK_WEEK, Views.DAY],
      backgroundEvents: args.overlapping ? overlappingBg : singleDayBg,
      dayLayoutAlgorithm: args.dayLayoutAlgorithm,
    },
  }),
}

/**
 * Slot selection with background events present. Check the **Actions** panel
 * after clicking or dragging — when your selection overlaps a background event
 * a `backgroundEvents` field appears in the payload.
 */
export const SelectableWithBackgroundEvents: StoryObj<BgArgs> = {
  args: { view: Views.WEEK, overlapping: false, dayLayoutAlgorithm: 'overlap' },
  argTypes: {
    view: {
      control: 'select',
      options: [Views.WEEK, Views.WORK_WEEK, Views.DAY],
      description: 'Time-grid view to render.',
    },
    overlapping: {
      control: 'boolean',
      description: 'Use overlapping background events to show multiple entries in the payload.',
    },
    dayLayoutAlgorithm: dayLayoutArgType,
  },
  render: (args) => ({
    Component: CalendarStory,
    props: {
      defaultView: args.view,
      views: [Views.WEEK, Views.WORK_WEEK, Views.DAY],
      backgroundEvents: args.overlapping ? overlappingBg : singleDayBg,
      dayLayoutAlgorithm: args.dayLayoutAlgorithm,
      selectable: true,
      onSlotClick: (args as Record<string, unknown>).onSlotClick,
      onSlotDoubleClick: (args as Record<string, unknown>).onSlotDoubleClick,
      onSlotSelect: (args as Record<string, unknown>).onSlotSelect,
      onSlotSelecting: (args as Record<string, unknown>).onSlotSelecting,
    },
  }),
}

/**
 * Drag and resize events over a calendar that has background events. Check the
 * **Actions** panel after each drop or resize — when the event's new bounds
 * overlap a background event, a `backgroundEvents` field appears in the payload.
 */
export const DragAndDropWithBackgroundEvents: StoryObj<BgArgs> = {
  args: { view: Views.WEEK, overlapping: false, dayLayoutAlgorithm: 'overlap' },
  argTypes: {
    view: {
      control: 'select',
      options: [Views.WEEK, Views.WORK_WEEK, Views.DAY],
      description: 'Time-grid view to render.',
    },
    overlapping: {
      control: 'boolean',
      description: 'Switch to the overlapping background event set.',
    },
    dayLayoutAlgorithm: dayLayoutArgType,
  },
  render: (args) => ({
    Component: DndBgCalendarStory,
    props: args,
  }),
}
