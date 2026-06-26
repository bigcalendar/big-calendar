export const URI = 'bc://recipes/data-fetching'

export const CONTENT = `# Recipe: Fetching Events on Range Change

Load events from your API whenever the visible date range changes (navigation or view switch).

## Pattern

\`\`\`tsx
import { useState, useCallback } from 'react'
import { LuxonLocalizer } from '@big-calendar/localizer-luxon'
import { CalendarProvider, Calendar } from '@big-calendar/react'
import type { ViewKey } from '@big-calendar/core'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
}

const localizer = new LuxonLocalizer()

export function MyCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)

  const handleRangeChange = useCallback(
    async ({ range }: { range: { start: string; end: string }; view: ViewKey }) => {
      setLoading(true)
      try {
        const fetched = await api.getEvents({
          start: range.start,
          end: range.end,
        })
        setEvents(fetched)
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  return (
    <CalendarProvider<CalendarEvent>
      localizer={localizer}
      events={events}
      accessors={{ id: 'id', title: 'title', start: 'start', end: 'end' }}
      onRangeChange={handleRangeChange}
    >
      {loading && <div className="bc-loading-overlay">Loading…</div>}
      <Calendar />
    </CalendarProvider>
  )
}
\`\`\`

## Notes

- \`onRangeChange\` fires whenever the visible range changes due to navigation or view switching.
- It does **not** fire on the initial mount — fetch initial data separately (e.g. in \`useEffect\`).
- \`range.start\` and \`range.end\` are ISO 8601 strings spanning the full visible window.
- Debounce the handler if your API is expensive:

\`\`\`typescript
import { useDebouncedCallback } from 'use-debounce'

const handleRangeChange = useDebouncedCallback(async ({ range }) => {
  const events = await api.getEvents(range)
  setEvents(events)
}, 300)
\`\`\`

## Initial load

Fetch events on mount as well, since \`onRangeChange\` won't fire until the user navigates:

\`\`\`typescript
useEffect(() => {
  const now = new Date()
  // Approximate the initial month view range
  api.getEvents({
    start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString(),
  }).then(setEvents)
}, [])
\`\`\`
`
