export const URI = 'bc://recipes/basic-setup-svelte'

export const CONTENT = `# Recipe: Basic Calendar Setup (Svelte 5)

A minimal working Big Calendar integration in Svelte 5.

## Prerequisites

\`\`\`bash
yarn add @big-calendar/svelte @big-calendar/localizer-temporal @big-calendar/styles
\`\`\`

> **Luxon user?** If your project already depends on Luxon, use \`@big-calendar/localizer-luxon\`
> and \`luxon\` instead. The TemporalLocalizer is preferred for new projects because it uses
> the browser's built-in Temporal API with no extra dependency.

## Step 1 — Import the styles

In your app entry point (e.g. \`+layout.svelte\`):

\`\`\`typescript
import '@big-calendar/styles/index.css'
\`\`\`

## Step 2 — Create the component

\`\`\`svelte
<!-- MyCalendar.svelte -->
<script>
  import { CalendarProvider, Calendar } from '@big-calendar/svelte'
  import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'

  // createTemporalLocalizer is async — use top-level await in a Svelte component
  const localizer = await createTemporalLocalizer()

  // Define your event list — use $state for reactivity
  let events = $state([
    {
      id: '1',
      title: 'Team Standup',
      start: '2026-06-25T09:00:00',
      end: '2026-06-25T09:30:00',
    },
  ])
</script>

<div style="height: 600px">
  <CalendarProvider {localizer} {events} defaultView="month" defaultDate="2026-06-25">
    <Calendar />
  </CalendarProvider>
</div>
\`\`\`

> **Height required.** The calendar fills its container. Give the container an explicit height.

## Step 3 — Add a localizer with time zone (optional)

Pass a \`timeZone\` to the localizer so the calendar formats and places events in the right
local time. The default is UTC.

\`\`\`typescript
const localizer = await createTemporalLocalizer({ locale: 'en-US', timeZone: 'America/New_York' })
\`\`\`

## Svelte 5 specific notes

- **Top-level await** — \`createTemporalLocalizer()\` is async. Svelte 5 components support
  top-level \`await\` in \`<script>\` blocks, so you can await the localizer directly without
  an \`onMount\` wrapper or a loading state.
- **Reactive events with \`$state\`** — Use Svelte 5's \`$state\` rune for reactive event
  arrays. The calendar re-renders automatically when the reference changes. Always replace
  the array (\`events = [...events, newEvent]\`) rather than mutating it in place.
- **\`$props()\` in slot components** — Custom slot components (event blocks, toolbar items,
  etc.) receive props via \`let { event } = $props()\`. The Svelte 4 \`export let event\`
  syntax is not supported.
- **Context** — \`CalendarProvider\` uses Svelte's built-in \`setContext\` / \`getContext\`.
  Composables like \`useCalendarContext()\` and \`useMonthView()\` must be called in a
  component that is a descendant of \`CalendarProvider\`.

## Next steps

- Add \`selectable={true}\` and an \`onSlotSelect\` prop to let users create events by clicking
- Install \`@big-calendar/dnd\` and use the \`useCalendarDnd\` composable to enable drag-and-drop
- Pass \`onEventClick={handler}\` to open an edit panel when a user clicks an existing event
- Pass \`onRangeChange={handler}\` to fetch events from your API as the user navigates
`
