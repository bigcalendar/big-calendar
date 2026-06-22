import { Views } from '@big-calendar/core'
import type { ViewKey } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useState } from 'react'
import { fn } from 'storybook/test'
import { Calendar, useCalendarDnd } from '../src'
import type { DemoEvent } from './harness'
import { CalendarStage, demoEvents } from './harness'

function DraggableCalendar() {
  const ref = useRef<HTMLDivElement>(null)
  useCalendarDnd(ref)
  return (
    <div ref={ref} style={{ display: 'contents' }}>
      <Calendar />
    </div>
  )
}

type DndArgs = {
  view: ViewKey
  lockAllDayEvents: boolean
  onRangeChange: (a: { range: { start: string; end: string }; view: ViewKey }) => void
}

function DndDemo({ view, lockAllDayEvents, onRangeChange }: DndArgs) {
  const [events, setEvents] = useState<DemoEvent[]>(demoEvents)

  const apply = ({
    event,
    start,
    end,
    allDay,
  }: {
    event: DemoEvent
    start: string
    end: string
    allDay: boolean
  }) => setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, start, end, allDay } : e)))

  return (
    <CalendarStage
      defaultView={view}
      events={events}
      draggableAccessor={lockAllDayEvents ? (e: DemoEvent) => !e.allDay : undefined}
      onRangeChange={onRangeChange}
      onEventDrop={apply}
      onEventResize={apply}
    >
      <DraggableCalendar />
    </CalendarStage>
  )
}

const meta: Meta = {
  title: 'Drag & Drop/Event Drag & Drop',
  args: { onRangeChange: fn() },
}
export default meta

/**
 * Full drag-and-drop calendar: move events by dragging to a new day or slot,
 * resize timed events by dragging their top/bottom edge (time-grid) or leading/
 * trailing edge (month). Keyboard drag is also available — Tab to an event, Space
 * to pick it up, arrows to move, Shift+arrows to resize, Enter/Escape to drop or
 * cancel. See the **Drag & Drop Overview** for full details.
 *
 * Use the **Controls** panel to switch between the month grid (whole-day moves)
 * and the time-grid views (slot-snapping moves + resize handles). Toggle
 * **Lock all-day events** to see `draggableAccessor` prevent picks on all-day events
 * while timed events still move.
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
        'Pass a draggableAccessor that returns false for all-day events, preventing them from being picked up.',
    },
  },
  render: (args) => <DndDemo {...args} />,
}
