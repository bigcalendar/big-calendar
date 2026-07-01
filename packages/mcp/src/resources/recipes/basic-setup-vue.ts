export const URI = 'bc://recipes/basic-setup-vue'

export const CONTENT = `# Recipe: Basic Calendar Setup (Vue 3)

A minimal working Big Calendar integration in Vue 3.

## Prerequisites

\`\`\`bash
pnpm add @big-calendar/vue @big-calendar/localizer-temporal @big-calendar/styles
\`\`\`

> **Luxon user?** If your project already depends on Luxon, use \`@big-calendar/localizer-luxon\`
> and \`luxon\` instead. The TemporalLocalizer is preferred for new projects because it uses
> the browser's built-in Temporal API with no extra dependency.

## Step 1 — Import the styles

In your app entry point (e.g. \`main.ts\`):

\`\`\`typescript
import '@big-calendar/styles/index.css'
\`\`\`

## Step 2 — Create the component

\`\`\`vue
<script setup lang="ts">
import { CalendarProvider, Calendar } from '@big-calendar/vue'
import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'

// Define your event shape
interface CalendarEvent {
  id: string
  title: string
  start: string  // ISO 8601 datetime string
  end: string
}

// createTemporalLocalizer is async — call it once at module level or top-level await
const localizer = await createTemporalLocalizer()

const events: CalendarEvent[] = [
  {
    id: '1',
    title: 'Team Standup',
    start: '2026-06-25T09:00:00',
    end: '2026-06-25T09:30:00',
  },
]
</script>

<template>
  <CalendarProvider :localizer="localizer" :events="events" defaultDate="2026-06-25">
    <Calendar />
  </CalendarProvider>
</template>
\`\`\`

## Step 3 — Use it in your app

\`\`\`vue
<script setup>
import MyCalendar from './MyCalendar.vue'
</script>

<template>
  <div style="height: 600px">
    <MyCalendar />
  </div>
</template>
\`\`\`

> **Height required.** The calendar fills its container. Give the container an explicit height.

## Step 4 — Add a localizer with time zone (optional)

Pass a \`timeZone\` to the localizer so the calendar formats and places events in the right
local time. The default is UTC.

\`\`\`typescript
const localizer = await createTemporalLocalizer({ locale: 'en-US', timeZone: 'America/New_York' })
\`\`\`

## Next steps

- Add \`selectable: true\` and an \`onSlotSelect\` handler to let users create events by clicking
- Install \`@big-calendar/dnd\` and call \`useCalendarDnd\` to enable drag-and-drop
- Pass \`onEventClick\` to open an edit panel when a user clicks an existing event
- Pass \`onRangeChange\` to fetch events from your API as the user navigates
`
