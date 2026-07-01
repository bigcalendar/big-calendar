import { Views } from '@big-calendar/core'
import type { DayLayoutAlgorithmKey, ViewKey } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useState } from 'react'
import { fn } from 'storybook/test'
import { Calendar, useCalendarDnd } from '../src'
import type { DemoEvent } from './harness'
import { CalendarStage, demoEvents } from './harness'

const singleDayBg: DemoEvent[] = [
  { id: 1001, title: 'Deep work', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T12:00:00.000Z' },
  { id: 1002, title: 'Sprint focus', start: '2026-06-16T09:00:00.000Z', end: '2026-06-18T17:00:00.000Z' },
  { id: 1003, title: 'Review window', start: '2026-06-19T13:00:00.000Z', end: '2026-06-19T17:00:00.000Z' },
]

const overlappingBg: DemoEvent[] = [
  { id: 1004, title: 'Focus block A', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T13:00:00.000Z' },
  { id: 1005, title: 'Focus block B', start: '2026-06-15T11:00:00.000Z', end: '2026-06-15T15:00:00.000Z' },
  { id: 1006, title: 'Sprint focus', start: '2026-06-16T09:00:00.000Z', end: '2026-06-18T17:00:00.000Z' },
]

type BgArgs = { view: ViewKey; overlapping: boolean; dayLayoutAlgorithm: DayLayoutAlgorithmKey }

type DndDropArgs = {
  event: DemoEvent
  start: string
  end: string
  allDay: boolean
  backgroundEvents?: DemoEvent[]
}

type DndBgArgs = {
  view: ViewKey
  overlapping: boolean
  dayLayoutAlgorithm: DayLayoutAlgorithmKey
  onEventDrop: (a: DndDropArgs) => void
  onEventResize: (a: DndDropArgs) => void
  onRangeChange: (a: { range: { start: string; end: string }; view: ViewKey }) => void
}

function DraggableCalendar() {
  const ref = useRef<HTMLDivElement>(null)
  useCalendarDnd(ref)
  return (
    <div ref={ref} style={{ display: 'contents' }}>
      <Calendar />
    </div>
  )
}

const dayLayoutAlgorithmArgType = {
  control: 'select',
  options: ['overlap', 'no-overlap'] satisfies DayLayoutAlgorithmKey[],
  description:
    '`overlap` packs concurrent events side-by-side sharing the full column width. `no-overlap` gives each event its own column so nothing overlaps visually.',
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

/**
 * Background events appear behind timed events as coloured bands. Pointer events
 * pass straight through them — slot selection and event interaction still work
 * anywhere on their surface.
 *
 * A single-day background event has rounded corners on both edges. A multi-day
 * event is clipped at midnight per column: the first column gets the top corners
 * rounded, the last column gets the bottom corners, and middle columns have none.
 *
 * Toggle **Overlapping** in Controls to see two background events on the same day
 * share the column width using the same layout algorithm as regular timed events.
 * Switch to the **Day** view and navigate to Monday Jun 15 to see them side by side.
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
      description:
        'Show two overlapping background events on Jun 15. They share the column width, same as timed events.',
    },
    dayLayoutAlgorithm: dayLayoutAlgorithmArgType,
  },
  render: ({ view, overlapping, dayLayoutAlgorithm }) => (
    <CalendarStage
      defaultView={view}
      views={[Views.WEEK, Views.WORK_WEEK, Views.DAY]}
      events={demoEvents}
      backgroundEvents={overlapping ? overlappingBg : singleDayBg}
      dayLayoutAlgorithm={dayLayoutAlgorithm}
    >
      <Calendar />
    </CalendarStage>
  ),
}

/**
 * Slot selection with background events present. Click or drag in the time grid
 * and check the **Actions** panel to see the full selection payload — including
 * `backgroundEvents` when your selection overlaps one of the coloured bands.
 *
 * The payload omits `backgroundEvents` entirely when the selection does not
 * intersect any background event. `onSlotSelecting` receives the same field
 * during a live drag.
 */
export const SelectableWithBackgroundEvents: StoryObj<{ view: ViewKey; overlapping: boolean; dayLayoutAlgorithm: DayLayoutAlgorithmKey }> = {
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
    dayLayoutAlgorithm: dayLayoutAlgorithmArgType,
  },
  render: ({ view, overlapping, dayLayoutAlgorithm, ...callbacks }) => (
    <CalendarStage
      defaultView={view}
      views={[Views.WEEK, Views.WORK_WEEK, Views.DAY]}
      events={demoEvents}
      backgroundEvents={overlapping ? overlappingBg : singleDayBg}
      selectable
      dayLayoutAlgorithm={dayLayoutAlgorithm}
      {...callbacks}
    >
      <Calendar />
    </CalendarStage>
  ),
}

function DndWithBgDemo({ view, overlapping, dayLayoutAlgorithm, onEventDrop, onEventResize, onRangeChange }: DndBgArgs) {
  const [events, setEvents] = useState<DemoEvent[]>(demoEvents)

  const apply = ({ event, start, end, allDay }: DndDropArgs) =>
    setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, start, end, allDay } : e)))

  return (
    <CalendarStage
      defaultView={view}
      views={[Views.WEEK, Views.WORK_WEEK, Views.DAY]}
      events={events}
      backgroundEvents={overlapping ? overlappingBg : singleDayBg}
      dayLayoutAlgorithm={dayLayoutAlgorithm}
      onRangeChange={onRangeChange}
      onEventDrop={(args) => { onEventDrop(args); apply(args) }}
      onEventResize={(args) => { onEventResize(args); apply(args) }}
    >
      <DraggableCalendar />
    </CalendarStage>
  )
}

/**
 * Drag and resize events over a calendar that has background events. Check the
 * **Actions** panel after each drop or resize to see the full payload — when the
 * event's new bounds overlap a background event, a `backgroundEvents` field
 * appears in the payload listing every background event that intersects.
 *
 * Events actually update on drop so you can reposition them and repeat the test.
 * Keyboard drag is also available — Tab to an event, Space to pick it up, arrow
 * keys to move, Shift+arrows to resize, Enter to commit.
 */
export const DragAndDropWithBackgroundEvents: StoryObj<DndBgArgs> = {
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
    dayLayoutAlgorithm: dayLayoutAlgorithmArgType,
  },
  render: (args) => <DndWithBgDemo {...args} />,
}
