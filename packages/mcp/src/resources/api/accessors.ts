export const URI = 'bc://api/accessors'

export const CONTENT = `# Accessors — Configuration Guide

Accessors tell Big Calendar how to read fields from your event and resource objects.
They are set on \`CalendarProvider\` via the \`accessors\` prop and support both
string property names and functions.

## Accessor types

\`\`\`typescript
type Accessor<TData, TResult> = string | ((data: TData) => TResult)
\`\`\`

A string means "read this key from the object". A function gives you full control.

## Full accessor map

| Key | Reads from | Type | Notes |
|-----|-----------|------|-------|
| \`id\` | event | \`string \\| number\` | Stable identity. Required for DnD and optimistic updates. |
| \`title\` | event | \`string\` | Display title shown on event blocks. |
| \`tooltip\` | event | \`string\` | Hover/aria tooltip. Defaults to title if omitted. |
| \`start\` | event | \`string\` | RFC 3339 / ISO 8601 start datetime. |
| \`end\` | event | \`string\` | RFC 3339 / ISO 8601 end datetime. |
| \`allDay\` | event | \`boolean\` | Whether the event spans whole days. |
| \`resource\` | event | \`string \\| string[]\` | Resource id(s) the event belongs to. |
| \`type\` | event | \`string\` | Optional event type label (e.g. \`'meeting'\`). |
| \`draggable\` | event | \`boolean\` | Return \`false\` to block drag for a specific event. |
| \`resizable\` | event | \`boolean\` | Return \`false\` to block resize for a specific event. |
| \`resourceId\` | resource | \`string \\| number\` | Identity of the resource object. |
| \`resourceTitle\` | resource | \`string\` | Display label for the resource. |
| \`resourceType\` | resource | \`string\` | Optional resource type label. |

All accessors are optional. Omitting one uses the BC default (usually the key name itself).

## String accessor example

\`\`\`tsx
// Your event shape
interface MyEvent {
  id: string
  name: string       // ← title lives here
  startDate: string  // ← ISO date string
  endDate: string
  isAllDay: boolean
}

<CalendarProvider
  accessors={{
    id: 'id',
    title: 'name',
    start: 'startDate',
    end: 'endDate',
    allDay: 'isAllDay',
  }}
  events={events}
>
\`\`\`

## Function accessor example

\`\`\`tsx
// Computed or nested values
<CalendarProvider
  accessors={{
    title: (event) => \`[\${event.type}] \${event.subject}\`,
    start: (event) => event.schedule.from,
    end: (event) => event.schedule.to,
  }}
  events={events}
>
\`\`\`

## Blocking DnD per event

\`\`\`tsx
<CalendarProvider
  accessors={{
    draggable: (event) => !event.locked,
    resizable: (event) => event.type !== 'holiday',
  }}
>
\`\`\`

## bc.md reference

When you run the \`init\` or \`update-memory\` tool, accessor string mappings
are saved in bc.md so subsequent tool calls can tailor generated code to your
event shape without asking again.
`
