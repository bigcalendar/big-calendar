# @big-calendar/svelte

The Svelte 5 adapter for Big Calendar. Install this package to add a fully interactive event calendar — with month, week, work-week, day, and agenda views — to any Svelte 5 application.

---

## Requirements

- Svelte 5.0 or later

---

## Installation

```bash
yarn add @big-calendar/svelte @big-calendar/localizer-temporal @big-calendar/styles
```

For drag-and-drop support, also install the optional DnD package:

```bash
yarn add @big-calendar/dnd
```

---

## Basic usage

```svelte
<!-- MyCalendar.svelte -->
<script>
  import { CalendarProvider, Calendar } from '@big-calendar/svelte'
  import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'
  import '@big-calendar/styles/index.css'

  // createTemporalLocalizer is async — await it at module level with top-level await
  const localizer = await createTemporalLocalizer({ locale: 'en-US', timeZone: 'UTC' })

  const events = [
    {
      id: '1',
      title: 'Team standup',
      start: '2026-06-15T09:00:00Z',
      end: '2026-06-15T09:30:00Z',
    },
  ]
</script>

<div style="height: 600px">
  <CalendarProvider {localizer} {events} defaultView="month">
    <Calendar />
  </CalendarProvider>
</div>
```

> **Height required.** The calendar fills its container. Give the outer `<div>` an explicit height.

---

## How it works

Big Calendar separates **state** from **rendering**. `CalendarProvider` owns all the calendar state (which view is active, the focus date, the event list). It shares that state via Svelte's context system. The view components and composables inside it read from that shared state automatically — no prop drilling needed.

```svelte
<!-- CalendarProvider: owns the state -->
<CalendarProvider {localizer} {events}>
  <!-- Your own toolbar component goes here -->
  <MyToolbar />
  <!-- One (or more) view components render the grid -->
  <TimeGridView />
</CalendarProvider>
```

---

## Localizers

A localizer handles all date formatting and arithmetic. Pick one based on what your project already uses.

### Temporal (recommended for new projects)

Uses the browser's built-in Temporal API. No extra dependency beyond the adapter package.

```bash
yarn add @big-calendar/localizer-temporal
```

```ts
import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'
const localizer = await createTemporalLocalizer({ locale: 'en-US', timeZone: 'America/New_York' })
```

### Luxon (for projects already using Luxon)

```bash
yarn add @big-calendar/localizer-luxon luxon
```

```ts
import { createLuxonLocalizer } from '@big-calendar/localizer-luxon'
const localizer = await createLuxonLocalizer({ locale: 'en-US', timeZone: 'America/New_York' })
```

---

## Reactive events

Use Svelte 5's `$state` rune to keep your event list reactive. The calendar re-renders automatically when the array reference changes.

```svelte
<script>
  import { CalendarProvider, Calendar } from '@big-calendar/svelte'

  let events = $state([
    { id: '1', title: 'Standup', start: '2026-06-15T09:00:00Z', end: '2026-06-15T09:30:00Z' },
  ])

  function addEvent(newEvent) {
    events = [...events, newEvent]
  }
</script>

<CalendarProvider {localizer} {events}>
  <Calendar />
</CalendarProvider>
```

---

## Slot selection

Let users click or drag on empty time to create new events:

```svelte
<script>
  import { CalendarProvider, TimeGridView } from '@big-calendar/svelte'

  function handleSlotSelect({ start, end, allDay }) {
    console.log('Selected:', start, '→', end)
    // Open a create-event modal here
  }
</script>

<CalendarProvider
  {localizer}
  {events}
  selectable={true}
  onSlotSelect={handleSlotSelect}
>
  <TimeGridView />
</CalendarProvider>
```

---

## Drag and drop

Requires `@big-calendar/dnd`. Use the `useCalendarDnd` composable inside a child component of `CalendarProvider`:

```svelte
<!-- DndCalendar.svelte -->
<script>
  import { CalendarProvider, TimeGridView, useCalendarDnd } from '@big-calendar/svelte'
  import '@big-calendar/dnd'

  let events = $state(initialEvents)

  function handleEventDrop({ event, start, end, allDay }) {
    events = events.map((e) => (e.id === event.id ? { ...e, start, end } : e))
  }
</script>

<CalendarProvider
  {localizer}
  {events}
  onEventDrop={handleEventDrop}
>
  <DndWrapper />
  <TimeGridView />
</CalendarProvider>
```

```svelte
<!-- DndWrapper.svelte — must be a descendant of CalendarProvider -->
<script>
  import { useCalendarDnd } from '@big-calendar/svelte'
  const dnd = useCalendarDnd()
  // dnd.isActive, dnd.draggedEvent, etc. are reactive rune values
</script>
```

Mark individual events as draggable and resizable via the `draggable` and `resizable` fields on each event object (or override via `accessors`).

---

## Custom slot components

Replace the default event block with your own Svelte component. Pass it via the `components` prop on `CalendarProvider`:

```svelte
<script>
  import { CalendarProvider, MonthView } from '@big-calendar/svelte'
  import MyEventBlock from './MyEventBlock.svelte'

  const components = {
    month: { event: MyEventBlock },
  }
</script>

<CalendarProvider {localizer} {events} {components} defaultView="month">
  <MonthView />
</CalendarProvider>
```

```svelte
<!-- MyEventBlock.svelte -->
<script>
  let { event } = $props()
</script>

<span class="my-event">{event.title}</span>
```

---

## Headless API

If you need full control over rendering, use the composables directly to access the calendar state and drive your own markup.

```svelte
<script>
  import { useCalendarContext, useMonthView } from '@big-calendar/svelte'

  const ctx = useCalendarContext()
  const { weeks, onDayClick, onEventClick } = useMonthView()
</script>

{#each weeks as week}
  {#each week.days as day}
    <button onclick={() => onDayClick(day.date)}>
      {day.label}
    </button>
  {/each}
{/each}
```

Available composables:
- `useCalendarContext()` — raw store and current view
- `useMonthView()` — month grid weeks, cells, and handlers
- `useTimeGridView()` — time grid layout, columns, and all-day row
- `useAgendaView()` — agenda rows and date range
- `useToolbarProps()` — toolbar navigation and view-switcher state
- `useMonthWeeks()` — raw month week/day cells
- `useTimeGrid()` — raw time grid structure
- `useAgendaRows()` — raw agenda row data

---

## Packages

| Package | Purpose |
|---|---|
| `@big-calendar/svelte` | Svelte 5 components and composables (this package) |
| `@big-calendar/core` | Shared engine — store, view models, layout, selection FSM |
| `@big-calendar/dnd` | Optional drag-and-drop engine |
| `@big-calendar/styles` | CSS custom-property design tokens |
| `@big-calendar/localizer-temporal` | Temporal-backed localizer (recommended) |
| `@big-calendar/localizer-luxon` | Luxon-backed localizer |
| `@big-calendar/mcp` | MCP server for AI-assisted calendar development |
