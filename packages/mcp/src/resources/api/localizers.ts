export const URI = 'bc://api/localizers'

export const CONTENT = `# Localizers — Date Engine Options

Big Calendar requires a localizer — the date-math engine that handles all date
calculations without ever touching the native \`Date\` object directly.

## Available localizers

### LuxonLocalizer (recommended)

\`\`\`bash
pnpm add @big-calendar/localizer-luxon luxon
\`\`\`

\`\`\`typescript
import { LuxonLocalizer } from '@big-calendar/localizer-luxon'

const localizer = new LuxonLocalizer({
  // Optional: IANA time zone. Defaults to the local system zone.
  timeZone: 'America/New_York',
  // Optional: first day of week (0 = Sunday, 1 = Monday, …).
  firstDayOfWeek: 1,
})
\`\`\`

### TemporalLocalizer (experimental)

Uses the TC39 Temporal proposal (polyfill required).

\`\`\`bash
pnpm add @big-calendar/localizer-temporal @js-temporal/polyfill
\`\`\`

\`\`\`typescript
import { TemporalLocalizer } from '@big-calendar/localizer-temporal'

const localizer = await TemporalLocalizer.create({
  timeZone: 'America/New_York',
})
\`\`\`

## Key behaviours

- All dates flowing through BC are RFC 3339 / ISO 8601 **strings**, never native \`Date\` objects.
- Your event \`start\` and \`end\` accessors must return ISO 8601 strings.
- The localizer converts between ISO strings and internal date representations.
- Time zone is configured once on the localizer; all views respect it automatically.

## Instantiation tips

Create the localizer **once outside your component** (not inside the render function) to
avoid unnecessary re-instantiation:

\`\`\`typescript
// ✅ Outside the component — created once
const localizer = new LuxonLocalizer({ timeZone: 'UTC' })

export function MyCalendar() {
  return (
    <CalendarProvider localizer={localizer} events={events}>
      <Calendar />
    </CalendarProvider>
  )
}
\`\`\`

\`\`\`typescript
// ❌ Inside the component — re-created every render
export function MyCalendar() {
  const localizer = new LuxonLocalizer()  // avoid this
  return <CalendarProvider localizer={localizer}>…</CalendarProvider>
}
\`\`\`
`
