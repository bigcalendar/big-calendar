import { Views } from '@big-calendar/core'
import type { ViewKey } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useState } from 'react'
import { Calendar, useCalendarDnd } from '../src'
import type { DemoEvent } from './harness'
import { CalendarStage, demoEvents } from './harness'

/**
 * `<Calendar>` wrapped so its events can be dragged. `useCalendarDnd(ref)` turns
 * on the optional `@big-calendar/dnd` controller for everything inside `ref`; the
 * wrapper uses `display: contents` so it adds no layout box. The hook must sit
 * inside the `CalendarProvider` (here, `CalendarStage`).
 */
function DraggableCalendar() {
  const ref = useRef<HTMLDivElement>(null)
  useCalendarDnd(ref)
  return (
    <div ref={ref} style={{ display: 'contents' }}>
      <Calendar />
    </div>
  )
}

/**
 * Holds the event list in React state. The calendar never mutates your data — it
 * only *tells* you where an event was dropped via `onEventDrop`, and you apply
 * the new bounds. Here we map the moved event to its recomputed `start`/`end`.
 * `view` switches the surface: the **month** grid moves by whole days; the
 * **time-grid** views snap the event's start to the dropped slot (its duration
 * is preserved). The wiring is identical — only `useCalendarDnd`'s mode differs.
 */
function DragDemo({
  view = Views.MONTH,
  draggableAccessor,
}: {
  view?: ViewKey
  draggableAccessor?: (e: DemoEvent) => boolean
}) {
  const [events, setEvents] = useState<DemoEvent[]>(demoEvents)
  return (
    <CalendarStage
      defaultView={view}
      events={events}
      draggableAccessor={draggableAccessor}
      onEventDrop={({ event, start, end, allDay }) =>
        setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, start, end, allDay } : e)))
      }
    >
      <DraggableCalendar />
    </CalendarStage>
  )
}

/**
 * The realistic flow: a drop kicks off an async save that can fail. We update
 * the events **optimistically** (move it right away), then `await` a simulated
 * request; on failure we **roll back** to the events we captured before the move.
 * The calendar itself never holds this state — it only renders the `events` we
 * pass and reports the proposed change. Use the checkbox to force the next save
 * to fail and watch the event snap back.
 */
function AsyncMoveDemo() {
  const [events, setEvents] = useState<DemoEvent[]>(demoEvents)
  const [status, setStatus] = useState('Drag an event to another day — the save is simulated (~800ms).')
  const failNext = useRef(false)

  const handleDrop = ({
    event,
    start,
    end,
    allDay,
  }: {
    event: DemoEvent
    start: string
    end: string
    allDay: boolean
  }) => {
    const previous = events // snapshot for rollback
    setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, start, end, allDay } : e)))
    setStatus(`Saving "${event.title}"…`)
    void (async () => {
      await new Promise((resolve) => setTimeout(resolve, 800))
      if (failNext.current) {
        setEvents(previous) // ← rollback to the original state
        setStatus(`Save failed — "${event.title}" was reverted to its original time.`)
      } else {
        setStatus(`Saved "${event.title}".`)
      }
    })()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <label style={{ fontSize: '0.8rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
        <input type="checkbox" onChange={(e) => (failNext.current = e.target.checked)} />
        Make the next save fail (forces a rollback)
      </label>
      <CalendarStage defaultView={Views.MONTH} events={events} onEventDrop={handleDrop}>
        <DraggableCalendar />
      </CalendarStage>
      <output
        style={{
          fontSize: '0.8rem',
          padding: '0.4rem 0.6rem',
          border: '1px solid var(--bc-color-border, #d4d4d8)',
          borderRadius: '4px',
        }}
      >
        {status}
      </output>
    </div>
  )
}

const meta: Meta = {
  title: 'React/Drag and drop',
  parameters: {
    docs: {
      description: {
        component:
          'Drag an event to move it — to another day in the month grid, or onto another slot in the time-grid (week/day) views. The drag is powered by the optional `@big-calendar/dnd` package, wired with the `useCalendarDnd` hook. Core does the date-math (month = a whole-day shift that keeps the time of day; time-grid = snap the start to the dropped slot, keep the duration) and reports the result through `onEventDrop`; your code applies it to the event data. Resize, drop-from-outside, and keyboard DnD are later slices.',
      },
    },
  },
}
export default meta
type Story = StoryObj

/** Drag any event onto another day; its time of day is preserved. */
export const MonthEventMove: Story = {
  render: () => <DragDemo />,
}

/**
 * Time-grid (week) move: drag a timed event onto another slot — its start snaps
 * to that slot and its duration is kept. Drag across day columns to move it to a
 * different day at the same kind of time. (All-day → timed promotion is a later
 * slice, so the all-day row isn't a drop target yet.)
 */
export const WeekEventMove: Story = {
  render: () => <DragDemo view={Views.WEEK} />,
}

/**
 * `draggableAccessor` decides which events may be dragged. Here the all-day
 * "Offsite" event (id 4) is locked in place; every other event still moves.
 */
export const LockedEvent: Story = {
  render: () => <DragDemo draggableAccessor={(e) => e.id !== 4} />,
}

/**
 * Optimistic update with rollback on a failed async save — the real-world flow.
 * Tick the checkbox to force the next save to fail and watch the event revert.
 */
export const AsyncSaveWithRollback: Story = {
  render: () => <AsyncMoveDemo />,
}
