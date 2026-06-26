export const URI = 'bc://recipes/basic-setup'

export const CONTENT = `# Recipe: Basic Calendar Setup

A minimal working Big Calendar integration in React.

## Prerequisites

\`\`\`bash
pnpm add @big-calendar/react @big-calendar/localizer-temporal @big-calendar/styles
\`\`\`

> **Luxon user?** If your project already depends on Luxon, use \`@big-calendar/localizer-luxon\` and \`luxon\` instead. The \`TemporalLocalizer\` is preferred for new projects because it uses the browser's built-in Temporal API with no extra dependency.

## Step 1 — Import the styles

In your app entry point (e.g. \`main.tsx\` or \`App.tsx\`):

\`\`\`typescript
import '@big-calendar/styles/bc.css'
\`\`\`

## Step 2 — Create the component

\`\`\`tsx
import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'
import { CalendarProvider, Calendar } from '@big-calendar/react'

// Define your event shape
interface CalendarEvent {
  id: string
  title: string
  start: string  // ISO 8601 datetime string
  end: string
}

// createTemporalLocalizer is async — call it once at module level or in a top-level await
const localizer = await createTemporalLocalizer()

// Sample events for testing
const sampleEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Team Standup',
    start: '2026-06-25T09:00:00',
    end: '2026-06-25T09:30:00',
  },
]

export function MyCalendar() {
  return (
    <CalendarProvider<CalendarEvent>
      localizer={localizer}
      events={sampleEvents}
      accessors={{
        id: 'id',
        title: 'title',
        start: 'start',
        end: 'end',
      }}
      view="month"
      enabledViews={['month', 'week', 'day', 'agenda']}
    >
      <Calendar />
    </CalendarProvider>
  )
}
\`\`\`

## Step 3 — Use it in your app

\`\`\`tsx
import { MyCalendar } from './MyCalendar'

export function App() {
  return (
    <div style={{ height: '600px' }}>
      <MyCalendar />
    </div>
  )
}
\`\`\`

> **Height required.** The calendar fills its container. Give the container an explicit height.

## Next steps

- Run \`add-feature dnd\` to add drag-and-drop
- Run \`add-feature selection\` to let users create events by clicking slots
- Run \`add-handler onEventClick\` to open an edit modal on event click
- Run \`add-handler onRangeChange\` to fetch events from your API
`
