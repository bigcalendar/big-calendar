import { Views } from '@big-calendar/core'
import type { ViewKey } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useState } from 'react'
import { fn } from 'storybook/test'
import { Calendar, useCalendarDnd } from '../src'
import type { DemoEvent } from './harness'
import { CalendarStage, demoEvents } from './harness'

type Resource = { id: string; title: string }

const rooms: Resource[] = [
  { id: 'board', title: 'Board room' },
  { id: 'training', title: 'Training room' },
  { id: 'mtg1', title: 'Meeting room 1' },
  { id: 'mtg2', title: 'Meeting room 2' },
  { id: 'mtg3', title: 'Meeting room 3' },
  { id: 'exec', title: 'Executive suite' },
]

function DraggableCalendar() {
  const ref = useRef<HTMLDivElement>(null)
  useCalendarDnd(ref)
  return (
    <div ref={ref} style={{ display: 'contents' }}>
      <Calendar />
    </div>
  )
}

type ResourceArgs = {
  layout: 'day' | 'week' | 'week-day-major'
  onRangeChange: (a: { range: { start: string; end: string }; view: ViewKey }) => void
}

function ResourceDemo({ layout, onRangeChange }: ResourceArgs) {
  const [events, setEvents] = useState<DemoEvent[]>(demoEvents)

  const apply = ({
    event,
    start,
    end,
    allDay,
    resourceId,
  }: {
    event: DemoEvent
    start: string
    end: string
    allDay: boolean
    resourceId?: string
  }) =>
    setEvents((prev) =>
      prev.map((e) =>
        e.id === event.id ? { ...e, start, end, allDay, resourceId: resourceId ?? e.resourceId } : e,
      ),
    )

  const defaultView = layout === 'day' ? Views.DAY : Views.WEEK
  const resourceLayout = layout === 'week-day-major' ? 'day' : undefined

  return (
    <CalendarStage
      defaultView={defaultView}
      views={layout === 'day' ? [Views.DAY] : [Views.WEEK, Views.WORK_WEEK]}
      resources={rooms}
      resourceLayout={resourceLayout}
      events={events}
      selectable
      onRangeChange={onRangeChange}
      onEventDrop={apply}
      onEventResize={apply}
    >
      <DraggableCalendar />
    </CalendarStage>
  )
}

const meta: Meta = {
  title: 'Resources/With Resources',
  args: { onRangeChange: fn() },
}
export default meta

/**
 * A resource calendar where each resource (room) gets its own column. Selection
 * and drag-and-drop both work exactly as in the standard calendar — the difference
 * is that the slot and drop callbacks also report the `resourceId` of the column
 * the user interacted with, so you can assign or reassign events to resources.
 *
 * Use the **Controls** panel to switch between layout modes:
 * - **day** — one column per resource under a single day header.
 * - **week** — resource-major: all days for one resource, then all days for the next.
 * - **week-day-major** — day-major: all resources for Monday, then all for Tuesday, etc.
 *
 * Drag an event into a different resource's column — `onEventDrop` reports the new
 * `resourceId` and your state update moves it there.
 */
export const WithResources: StoryObj<ResourceArgs> = {
  args: { layout: 'week' },
  argTypes: {
    layout: {
      control: 'select',
      options: ['day', 'week', 'week-day-major'],
      description:
        'Column ordering. "day" = one column per resource; "week" = resource-major; "week-day-major" = day-major.',
    },
  },
  render: (args) => <ResourceDemo {...args} />,
}
