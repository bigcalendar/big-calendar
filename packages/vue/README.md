# @big-calendar/vue

The Vue 3 adapter for Big Calendar. Install this package to add a fully interactive event calendar — with month, week, work-week, day, and agenda views — to any Vue 3 application.

---

## Requirements

- Vue 3.4 or later

---

## Installation

```bash
pnpm add @big-calendar/vue @big-calendar/localizer-temporal @big-calendar/styles
```

For drag-and-drop support, also install the optional DnD package:

```bash
pnpm add @big-calendar/dnd
```

---

## Basic usage

```vue
<script setup>
import { CalendarProvider, Calendar } from '@big-calendar/vue'
import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'
import '@big-calendar/styles/index.css'

// createTemporalLocalizer is async — call it once at module level or top-level await
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

<template>
  <div style="height: 600px">
    <CalendarProvider :localizer="localizer" :events="events">
      <Calendar />
    </CalendarProvider>
  </div>
</template>
```

> **Height required.** The calendar fills its container. Give the outer `<div>` an explicit height.

---

## How it works

Big Calendar separates **state** from **rendering**. `CalendarProvider` owns all the calendar state (which view is active, the focus date, the event list). It shares that state through Vue's `provide` / `inject` system. The `Calendar` component and all composables inside it read from that shared state automatically — no prop drilling needed.

```vue
<template>
  <!-- CalendarProvider: owns the state -->
  <CalendarProvider :localizer="localizer" :events="events">
    <!-- Your own toolbar can go here -->
    <MyToolbar />
    <!-- Calendar renders the grid -->
    <Calendar />
  </CalendarProvider>
</template>
```

---

## Localizers

A localizer handles all date formatting and arithmetic. Pick one based on what your project already uses.

### Temporal (recommended for new projects)

Uses the browser's built-in Temporal API. No extra dependency beyond the adapter package.

```bash
pnpm add @big-calendar/localizer-temporal
```

```js
import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'
const localizer = await createTemporalLocalizer({ locale: 'en-US', timeZone: 'America/New_York' })
```

### Luxon (for projects already using Luxon)

```bash
pnpm add @big-calendar/localizer-luxon luxon
```

```js
import { createLuxonLocalizer } from '@big-calendar/localizer-luxon'
const localizer = await createLuxonLocalizer({ locale: 'en-US', timeZone: 'America/New_York' })
```

---

## Slot selection

Let users click or drag on empty time to create new events:

```vue
<script setup>
function handleSlotSelect({ start, end, allDay }) {
  console.log('Selected:', start, '→', end)
  // Open a create-event modal here
}
</script>

<template>
  <CalendarProvider :selectable="true" :onSlotSelect="handleSlotSelect" ...>
    <Calendar />
  </CalendarProvider>
</template>
```

---

## Drag and drop

Requires `@big-calendar/dnd`:

```vue
<script setup>
import { shallowRef } from 'vue'
import { CalendarProvider, Calendar, useCalendarDnd } from '@big-calendar/vue'

const calendarRef = shallowRef(null)
useCalendarDnd(calendarRef)

function handleEventDrop({ event, start, end, allDay }) {
  // Update your events array with the new start/end
}
</script>

<template>
  <CalendarProvider :onEventDrop="handleEventDrop" ...>
    <div ref="calendarRef">
      <Calendar />
    </div>
  </CalendarProvider>
</template>
```

Mark individual events as draggable and resizable via the `draggable` and `resizable` fields (or override via `accessors`).

---

## Custom event components

Replace the default event block with your own component:

```vue
<script setup>
import MyEventBlock from './MyEventBlock.vue'
</script>

<template>
  <CalendarProvider :components="{ monthEvent: MyEventBlock }" ...>
    <Calendar />
  </CalendarProvider>
</template>
```

`MyEventBlock.vue` receives a typed `MonthEventProps` object (for month view), `TimeEventProps` for time grid, or `AgendaEventProps` for agenda.

---

## Packages

| Package | Purpose |
|---|---|
| `@big-calendar/vue` | Vue 3 components and composables (this package) |
| `@big-calendar/core` | Shared engine — store, view models, layout, selection FSM |
| `@big-calendar/dnd` | Optional drag-and-drop engine |
| `@big-calendar/styles` | CSS custom-property design tokens |
| `@big-calendar/localizer-temporal` | Temporal-backed localizer (recommended) |
| `@big-calendar/localizer-luxon` | Luxon-backed localizer |
| `@big-calendar/mcp` | MCP server for AI-assisted calendar development |
