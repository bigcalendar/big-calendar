export const URI = 'bc://recipes/event-editing'

export const CONTENT = `# Recipe: Event Editing Modal

Open a modal to view or edit an event when the user clicks it.

## Pattern

\`\`\`tsx
import { useState } from 'react'
import { LuxonLocalizer } from '@big-calendar/localizer-luxon'
import { CalendarProvider, Calendar } from '@big-calendar/react'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
}

const localizer = new LuxonLocalizer()

export function MyCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  function handleEventClick(event: CalendarEvent) {
    setSelectedEvent(event)
  }

  async function handleSave(updated: CalendarEvent) {
    // Optimistic update
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
    setSelectedEvent(null)

    try {
      await api.updateEvent(updated)
    } catch {
      // Rollback
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? selectedEvent! : e)))
    }
  }

  async function handleDelete(event: CalendarEvent) {
    setEvents((prev) => prev.filter((e) => e.id !== event.id))
    setSelectedEvent(null)
    await api.deleteEvent(event.id)
  }

  return (
    <>
      <CalendarProvider<CalendarEvent>
        localizer={localizer}
        events={events}
        accessors={{ id: 'id', title: 'title', start: 'start', end: 'end' }}
        onEventClick={handleEventClick}
      >
        <Calendar />
      </CalendarProvider>

      {selectedEvent && (
        <EventEditModal
          event={selectedEvent}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </>
  )
}
\`\`\`

## Notes

- \`onEventClick\` receives the original event object from your events array.
- Use your UI library's modal/drawer/dialog for \`EventEditModal\` (shadcn/ui, Radix, etc.).
- The calendar is **controlled** — always update your \`events\` state; never mutate the array.
- Apply optimistic updates immediately and roll back on failure for the best UX.

> Run \`scaffold-calendar\` to get a tailored starter for your accessor mappings.
`
