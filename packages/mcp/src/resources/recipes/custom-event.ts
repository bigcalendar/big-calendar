export const URI = 'bc://recipes/custom-event'

export const CONTENT = `# Recipe: Custom Event Component

Replace the default event block with your own React component.

## Pattern

\`\`\`tsx
import { LuxonLocalizer } from '@big-calendar/localizer-luxon'
import { CalendarProvider, Calendar } from '@big-calendar/react'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  color?: string
  assignee?: string
}

const localizer = new LuxonLocalizer()

// Your custom event component
function EventBlock({ event }: { event: CalendarEvent }) {
  return (
    <div
      style={{
        background: event.color ?? '#3174ad',
        borderRadius: '4px',
        padding: '2px 4px',
        color: '#fff',
        fontSize: '0.85em',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
      }}
    >
      <strong>{event.title}</strong>
      {event.assignee && <span> · {event.assignee}</span>}
    </div>
  )
}

export function MyCalendar() {
  return (
    <CalendarProvider<CalendarEvent>
      localizer={localizer}
      events={events}
      accessors={{ id: 'id', title: 'title', start: 'start', end: 'end' }}
      components={{
        event: EventBlock,       // month grid and time grid events
        // agenda: AgendaEvent,  // agenda list rows (optional separate component)
      }}
    >
      <Calendar />
    </CalendarProvider>
  )
}
\`\`\`

## Available component slots

Pass custom components via the \`components\` prop:

| Slot | Description |
|------|-------------|
| \`event\` | Event block in month grid and time grid |
| \`agenda\` | Event row in the agenda view |
| \`toolbar\` | Entire toolbar — replaces the default navigation bar |
| \`dateCellWrapper\` | Wraps each day cell in the month grid |
| \`timeSlotWrapper\` | Wraps each time slot in the time grid |
| \`dayColumnWrapper\` | Wraps each day column in the time grid |

## Component props

Your event component receives the original event object:

\`\`\`typescript
function EventBlock({ event }: { event: CalendarEvent }) {
  // 'event' is the exact object from your events array
}
\`\`\`

## Notes

- Custom components are purely presentational — interaction (clicks, etc.) still flows through
  the \`onEventClick\` and related callbacks on \`CalendarProvider\`.
- Keep custom event components lightweight; they render once per visible event on every update.
`
