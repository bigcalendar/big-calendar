import { Views } from '@big-calendar/core'
import type { ViewKey } from '@big-calendar/core'
import { EXTERNAL_MIME } from '@big-calendar/dnd'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useState } from 'react'
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

const PALETTE: { label: string; payload: Record<string, unknown> }[] = [
  { label: '30-min meeting', payload: { durationMinutes: 30 } },
  { label: '1-hour focus block', payload: { durationMinutes: 60 } },
  { label: '90-min workshop', payload: { durationMinutes: 90 } },
  { label: 'Holiday (all-day)', payload: {} },
  {
    label: '9–10am standup (re-dated)',
    payload: { start: '2020-01-01T09:00:00.000Z', end: '2020-01-01T10:00:00.000Z' },
  },
]

type DropArgs = { view: ViewKey }

function DropFromOutsideDemo({ view }: DropArgs) {
  const [events, setEvents] = useState<DemoEvent[]>(demoEvents)
  const nextId = useRef(1000)

  return (
    <div style={{ display: 'flex', gap: '1rem', blockSize: '100%' }}>
      <aside
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          flex: '0 0 13rem',
          paddingBlockStart: '0.5rem',
        }}
      >
        <strong style={{ fontSize: '0.8rem' }}>Drag onto the calendar →</strong>
        {PALETTE.map((item) => (
          <div
            key={item.label}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'copy'
              e.dataTransfer.setData(EXTERNAL_MIME, JSON.stringify(item.payload))
            }}
            style={{
              padding: '0.5rem 0.6rem',
              border: '1px solid var(--bc-color-border, #d4d4d8)',
              borderRadius: '6px',
              background: 'var(--bc-color-surface, #fff)',
              cursor: 'grab',
              fontSize: '0.8rem',
            }}
          >
            {item.label}
          </div>
        ))}
      </aside>
      <div style={{ flex: 1, minInlineSize: 0 }}>
        <CalendarStage
          defaultView={view}
          events={events}
          onDropFromOutside={({ start, end, allDay }) =>
            setEvents((prev) => [
              ...prev,
              { id: nextId.current++, title: 'New event', start, end, allDay },
            ])
          }
        >
          <DraggableCalendar />
        </CalendarStage>
      </div>
    </div>
  )
}

const meta: Meta = {
  title: 'Drag & Drop/Drop from Outside',
}
export default meta

/**
 * Drag a chip from the palette on the left onto the calendar to create a new event.
 * Duration chips write their payload onto the drag's `dataTransfer` under the
 * `EXTERNAL_MIME` type; dropping on a slot fires `onDropFromOutside` with the
 * proposed `start`/`end`/`allDay` and your code appends the event.
 *
 * On a **time-grid** slot, timed chips snap to the dropped slot for the given
 * duration. On the **month** grid, an empty payload creates an all-day event;
 * a chip with a `start`/`end` template is re-dated to the dropped day (the
 * time-of-day is preserved). Use the **Controls** panel to switch between views.
 */
export const DropFromOutside: StoryObj<DropArgs> = {
  args: { view: Views.WEEK },
  argTypes: {
    view: {
      control: 'select',
      options: [Views.MONTH, Views.WEEK, Views.WORK_WEEK, Views.DAY],
      description:
        'Calendar view to drop onto. Time-grid views snap to the slot; month view re-dates or creates an all-day event.',
    },
  },
  render: (args) => <DropFromOutsideDemo {...args} />,
}
