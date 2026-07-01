export const URI = 'bc://recipes/create-event'

export const CONTENT = `# Recipe: Create Events from Slot Selection

Let users create events by clicking or dragging in empty calendar cells.

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
  allDay: boolean
}

const localizer = new LuxonLocalizer()

export function MyCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [newEventRange, setNewEventRange] = useState<{
    start: string
    end: string
    allDay: boolean
  } | null>(null)

  function handleSlotSelect({
    start,
    end,
    allDay,
  }: {
    start: string
    end: string
    allDay: boolean
  }) {
    // Open a creation modal pre-filled with the selected range
    setNewEventRange({ start, end, allDay })
  }

  async function handleCreate(title: string) {
    if (!newEventRange) return
    const event: CalendarEvent = {
      id: crypto.randomUUID(),
      title,
      start: newEventRange.start,
      end: newEventRange.end,
      allDay: newEventRange.allDay,
    }

    // Optimistic add
    setEvents((prev) => [...prev, event])
    setNewEventRange(null)

    try {
      const saved = await api.createEvent(event)
      // Replace the temp event with the server-assigned one
      setEvents((prev) => prev.map((e) => (e.id === event.id ? saved : e)))
    } catch {
      // Rollback
      setEvents((prev) => prev.filter((e) => e.id !== event.id))
    }
  }

  return (
    <>
      <CalendarProvider<CalendarEvent>
        localizer={localizer}
        events={events}
        accessors={{ id: 'id', title: 'title', start: 'start', end: 'end', allDay: 'allDay' }}
        onSlotSelect={handleSlotSelect}
      >
        <Calendar />
      </CalendarProvider>

      {newEventRange && (
        <CreateEventModal
          start={newEventRange.start}
          end={newEventRange.end}
          allDay={newEventRange.allDay}
          onCreate={handleCreate}
          onClose={() => setNewEventRange(null)}
        />
      )}
    </>
  )
}
\`\`\`

## Notes

- \`onSlotSelect\` fires after the user finishes a click or drag selection.
- \`start\` and \`end\` are ISO 8601 strings; \`allDay\` is \`true\` for whole-day selections (month grid).
- \`onSlotSelecting\` fires continuously during drag — return \`false\` to cancel the selection.
- \`onSlotClick\` fires on a single-slot click (before \`onSlotSelect\`).
`
