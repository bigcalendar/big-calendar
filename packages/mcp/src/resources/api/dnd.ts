export const URI = 'bc://api/dnd'

export const CONTENT = `# Drag and Drop — Setup Guide

Big Calendar DnD requires \`@big-calendar/dnd\` in addition to \`@big-calendar/react\`.

## Installation

\`\`\`bash
pnpm add @big-calendar/dnd
\`\`\`

## How it works

The DnD controller (\`bindCalendarDnd\`) is wired up via the \`useCalendarDnd\` hook,
which must be called inside a component rendered under \`<CalendarProvider>\`.

The hook takes a React ref pointing to the element that wraps the calendar.
It rebinds whenever the active view changes and tears down cleanly on unmount.

## Setup

\`\`\`tsx
import { useRef } from 'react'
import { LuxonLocalizer } from '@big-calendar/localizer-luxon'
import { CalendarProvider, Calendar, useCalendarDnd } from '@big-calendar/react'

const localizer = new LuxonLocalizer()

// Inner component: must be rendered inside <CalendarProvider>
function DndCalendar() {
  const containerRef = useRef<HTMLDivElement>(null)
  useCalendarDnd(containerRef)  // ← wires DnD to the store

  return (
    <div ref={containerRef}>
      <Calendar />
    </div>
  )
}

// Outer provider
export function MyCalendar() {
  return (
    <CalendarProvider
      localizer={localizer}
      events={events}
      onEventDrop={({ event, start, end, allDay }) => {
        // Optimistic update + save pattern
        setEvents((prev) =>
          prev.map((e) => (e.id === event.id ? { ...e, startDate: start, endDate: end } : e)),
        )
        saveEvent({ ...event, startDate: start, endDate: end }).catch(() => {
          // Rollback on failure
          setEvents(prev)
        })
      }}
      onEventResize={({ event, start, end }) => {
        setEvents((prev) =>
          prev.map((e) => (e.id === event.id ? { ...e, startDate: start, endDate: end } : e)),
        )
      }}
    >
      <DndCalendar />
    </CalendarProvider>
  )
}
\`\`\`

## Blocking drag per event

Use the \`draggable\` and \`resizable\` accessors to prevent specific events from being moved or resized:

\`\`\`tsx
<CalendarProvider
  accessors={{
    draggable: (event) => !event.locked,
    resizable: (event) => event.type !== 'holiday',
  }}
>
\`\`\`

## The controlled pattern

The calendar **never mutates your events array**. \`onEventDrop\` and \`onEventResize\`
receive the *proposed* new bounds — apply them to your state and save. On failure, rollback.

> Tip: run \`add-feature dnd\` for a ready-to-paste DnD code snippet tailored to your bc.md.
`
