export const URI = 'bc://api/calendar-provider'

export const CONTENT = `# CalendarProvider — Props Reference

\`CalendarProvider\` is the required outer container. It owns the calendar store
and publishes it to all children via context. Wrap \`<Calendar>\` and any other
components that read or drive calendar state inside one provider.

## Required props

| Prop | Type | Description |
|------|------|-------------|
| \`localizer\` | \`LocalizerContract\` | Date-math engine. Use \`LuxonLocalizer\` or \`TemporalLocalizer\`. Required. |

## Events

| Prop | Type | Description |
|------|------|-------------|
| \`events\` | \`TEvent[]\` | Foreground events array. Calendar is controlled — update this array to reflect changes. |
| \`backgroundEvents\` | \`TEvent[]\` | Background events rendered behind foreground events; not selectable. |

## Accessors

| Prop | Type | Description |
|------|------|-------------|
| \`accessors\` | \`Partial<Accessors<TEvent, TResource>>\` | Maps BC accessor keys to property names or functions on your event shape. |

### Accessor keys

\`id\`, \`title\`, \`tooltip\`, \`start\`, \`end\`, \`allDay\`, \`resource\`, \`resourceId\`, \`resourceTitle\`, \`type\`, \`resourceType\`, \`draggable\`, \`resizable\`

Each value is either a string (field name) or a function \`(data: TData) => TResult\`.

## View control

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| \`view\` | \`ViewKey\` | \`'month'\` | Initial active view. |
| \`enabledViews\` | \`ViewKey[]\` | all | Which views appear in the toolbar. |
| \`date\` | \`string\` | now | Initial focus date as ISO 8601 string. |

## Callbacks

| Prop | Signature | Description |
|------|-----------|-------------|
| \`onNavigate\` | \`({ date, view }) => void\` | Fired after the focus date changes. |
| \`onView\` | \`({ view }) => void\` | Fired after the active view changes. |
| \`onRangeChange\` | \`({ range, view }) => void\` | Fired when the visible range changes. |
| \`onEventClick\` | \`(event: TEvent) => void\` | Fired on event click. |
| \`onEventDrop\` | \`({ event, start, end, allDay }) => void\` | Fired after a drag-to-move (DnD required). |
| \`onEventResize\` | \`({ event, start, end }) => void\` | Fired after a drag-to-resize (DnD required). |
| \`onSlotSelect\` | \`({ start, end, allDay }) => void\` | Fired when a slot selection completes. |
| \`onSlotClick\` | \`({ date, allDay }) => void\` | Fired on a single-slot click. |
| \`onDrillDown\` | \`({ date, view }) => void\` | Fired when the user drills down into a date cell. |

## Display

| Prop | Type | Description |
|------|------|-------------|
| \`components\` | \`CalendarComponents<TEvent>\` | Per-slot component overrides. |
| \`messages\` | \`Partial<Messages>\` | UI string overrides (localization). |
| \`drilldownView\` | \`ViewKey \\| null\` | View to navigate to on date cell click. Set to \`null\` to disable drilldown. |

## Minimal example

\`\`\`tsx
import { LuxonLocalizer } from '@big-calendar/localizer-luxon'
import { CalendarProvider, Calendar } from '@big-calendar/react'

const localizer = new LuxonLocalizer()

export function MyCalendar() {
  return (
    <CalendarProvider
      localizer={localizer}
      events={events}
      accessors={{ id: 'id', title: 'name', start: 'startDate', end: 'endDate' }}
      view="month"
      enabledViews={['month', 'week', 'day', 'agenda']}
    >
      <Calendar />
    </CalendarProvider>
  )
}
\`\`\`
`
