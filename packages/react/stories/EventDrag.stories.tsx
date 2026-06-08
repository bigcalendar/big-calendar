import { Views } from '@big-calendar/core'
import type { ViewKey } from '@big-calendar/core'
import { EVENT_MIME, EXTERNAL_MIME } from '@big-calendar/dnd'
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
 * only *tells* you where an event was dropped (`onEventDrop`) or resized
 * (`onEventResize`), and you apply the new bounds. Both reports share the same
 * `{ event, start, end, allDay }` shape, so a single `apply` covers them.
 * `view` switches the surface: the **month** grid moves by whole days; the
 * **time-grid** views snap to the dropped slot (move preserves the duration;
 * resize drags one edge). The wiring is identical — only `useCalendarDnd`'s mode
 * differs. Resize handles appear on the top/bottom edge of a timed event on hover.
 */
function DragDemo({
  view = Views.MONTH,
  draggableAccessor,
}: {
  view?: ViewKey
  draggableAccessor?: (e: DemoEvent) => boolean
}) {
  const [events, setEvents] = useState<DemoEvent[]>(demoEvents)
  const apply = ({ event, start, end, allDay }: { event: DemoEvent; start: string; end: string; allDay: boolean }) =>
    setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, start, end, allDay } : e)))
  return (
    <CalendarStage
      defaultView={view}
      events={events}
      draggableAccessor={draggableAccessor}
      onEventDrop={apply}
      onEventResize={apply}
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

/**
 * Drop-from-outside: a palette of plain native `draggable="true"` chips beside a
 * week calendar. Each chip writes its duration onto the drag's `dataTransfer`
 * under the `EXTERNAL_MIME` type; dropping on a slot fires `onDropFromOutside`
 * with the proposed bounds and we append a brand-new event. Because a native
 * drag's payload is hidden until the drop, the live preview is a single landing
 * slot (the real duration applies on release).
 */
function DropFromOutsideDemo() {
  const palette = [
    { label: '30-min meeting', durationMinutes: 30 },
    { label: '1-hour focus block', durationMinutes: 60 },
    { label: '90-min workshop', durationMinutes: 90 },
  ]
  const [events, setEvents] = useState<DemoEvent[]>(demoEvents)
  const nextId = useRef(1000)

  return (
    <div style={{ display: 'flex', gap: '1rem', blockSize: '100%' }}>
      <aside style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: '0 0 12rem' }}>
        <strong style={{ fontSize: '0.8rem' }}>Drag onto the grid →</strong>
        {palette.map((item) => (
          <div
            key={item.label}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'copy'
              e.dataTransfer.setData(EXTERNAL_MIME, JSON.stringify({ durationMinutes: item.durationMinutes }))
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
          defaultView={Views.WEEK}
          events={events}
          onDropFromOutside={({ start, end, allDay }) =>
            setEvents((prev) => [...prev, { id: nextId.current++, title: 'New event', start, end, allDay }])
          }
        >
          <DraggableCalendar />
        </CalendarStage>
      </div>
    </div>
  )
}

/**
 * Drag-out: the reverse direction. Each calendar event exposes its data on the
 * native `dataTransfer` (under `EVENT_MIME`), so a plain HTML5 dropzone outside
 * the calendar can receive it. Drag an event onto the "Unschedule" bin and we
 * read the event id off the drop and remove it from `events`. `onEventDragStart`
 * fires as the drag begins (used here just to update the read-out).
 */
function DragOutDemo() {
  const [events, setEvents] = useState<DemoEvent[]>(demoEvents)
  const [status, setStatus] = useState('Drag an event onto the bin to unschedule it.')
  const [over, setOver] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <CalendarStage
        defaultView={Views.WEEK}
        events={events}
        onEventDragStart={({ event }) => setStatus(`Dragging "${event.title}" — drop it on the bin to remove it.`)}
      >
        <DraggableCalendar />
      </CalendarStage>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          const raw = e.dataTransfer.getData(EVENT_MIME)
          if (!raw) return
          const data = JSON.parse(raw) as { id: string; title: string }
          setEvents((prev) => prev.filter((ev) => String(ev.id) !== data.id))
          setStatus(`Unscheduled "${data.title}".`)
        }}
        style={{
          padding: '1rem',
          border: `2px dashed ${over ? 'var(--bc-color-primary, #2563eb)' : 'var(--bc-color-border, #d4d4d8)'}`,
          borderRadius: '8px',
          textAlign: 'center',
          fontSize: '0.85rem',
          background: over ? 'var(--bc-color-selection-bg, #eff6ff)' : 'transparent',
        }}
      >
        🗑 Unschedule bin — drop an event here to remove it
      </div>
      <output style={{ fontSize: '0.8rem' }}>{status}</output>
    </div>
  )
}

const meta: Meta = {
  title: 'React/Drag and drop',
  parameters: {
    docs: {
      description: {
        component:
          'Drag an event to move it (to another day in the month grid, or onto another slot in the time-grid week/day views), or drag a timed event’s top/bottom edge to resize it. Powered by the optional `@big-calendar/dnd` package, wired with the `useCalendarDnd` hook. Core does the date-math (month move = a whole-day shift that keeps the time of day; time-grid move = snap the start to the dropped slot, keep the duration; resize = snap the dragged edge, keep the other) and reports the result through `onEventDrop` / `onEventResize`; your code applies it to the event data. You can also drag items in from outside (`onDropFromOutside`) and drag events out to your own dropzone (`onEventDragStart`); keyboard DnD is a later slice.',
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
 * Time-grid (week) resize: hover a timed event to reveal a grab bar on its top
 * and bottom edge, then drag an edge to a different slot. A dashed **live preview**
 * box follows the drag so you can see the proposed new size before releasing. The
 * dragged edge snaps to the slot (the other edge stays); drag past a day boundary
 * to grow an event across midnight, the same cross-day behaviour as a slot
 * selection. The event is clamped to a one-slot minimum so it can't collapse.
 * (Same demo as the move story — `onEventDrop` and `onEventResize` both feed the
 * one `apply`.)
 */
export const WeekEventResize: Story = {
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

/**
 * Drop-from-outside: drag a chip from the palette onto a week slot to create a
 * new event of that duration. The drop reports `{ start, end, allDay }`; your
 * code appends the event (the calendar never creates it). Native drag, so the
 * live preview is a single landing slot until you release.
 */
export const DropFromOutside: Story = {
  render: () => <DropFromOutsideDemo />,
}

/**
 * Drag-out: drag any event onto the "Unschedule" bin below the grid to remove it.
 * The event carries its data on the native `dataTransfer`, so a plain HTML5
 * dropzone reads it on drop — no calendar wiring on the bin side.
 */
export const DragOutToUnschedule: Story = {
  render: () => <DragOutDemo />,
}

/**
 * Keyboard drag (no mouse): Tab to a timed event, then **Space** to pick it up.
 * **↑/↓** move it a slot earlier/later, **←/→** move it a day, **Shift+↓ / Shift+↑**
 * grow / shrink its end edge, **Enter** drops it, **Escape** cancels. A dashed box
 * previews where it will land and each step is announced to screen readers. This
 * is the same demo as WeekEventMove — keyboard support is built into the time grid,
 * so no extra wiring beyond `onEventDrop` / `onEventResize`. (`useCalendarDnd` here
 * only adds the *pointer* drag; the keyboard path works without it.)
 */
export const KeyboardDrag: Story = {
  render: () => <DragDemo view={Views.WEEK} />,
}
