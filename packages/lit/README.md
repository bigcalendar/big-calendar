# @big-calendar/lit

The Lit v3 web components adapter for Big Calendar. Install this package to add a fully interactive event calendar — with month, week, work-week, day, and agenda views — to any application using Lit, or to any framework (or no framework at all) via standard custom elements.

---

## Requirements

- Lit 3.0 or later

---

## Installation

```bash
yarn add @big-calendar/lit @big-calendar/localizer-temporal @big-calendar/styles
```

For drag-and-drop support, also install the optional DnD package:

```bash
yarn add @big-calendar/dnd
```

---

## Basic usage

```ts
import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import '@big-calendar/lit'
import '@big-calendar/styles/index.css'
import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'

// createTemporalLocalizer is async — call it once at module level
const localizer = await createTemporalLocalizer({ locale: 'en-US', timeZone: 'UTC' })

const events = [
  {
    id: '1',
    title: 'Team standup',
    start: '2026-06-15T09:00:00Z',
    end: '2026-06-15T09:30:00Z',
  },
]

@customElement('my-calendar')
class MyCalendar extends LitElement {
  // Use light DOM so shared bc-* CSS applies
  override createRenderRoot() { return this }

  override render() {
    return html`
      <div style="height: 600px">
        <bc-calendar .localizer=${localizer} .events=${events} defaultView="month">
          <bc-default-toolbar></bc-default-toolbar>
          <bc-month-view></bc-month-view>
          <bc-time-grid-view></bc-time-grid-view>
          <bc-agenda-view></bc-agenda-view>
        </bc-calendar>
      </div>
    `
  }
}
```

> **Height required.** The calendar fills its container. Give the outer wrapper an explicit height.

---

## Using in vanilla HTML

Because `@big-calendar/lit` exports standard web components, you can use them without any build step or framework. Just import the package with a CDN and set properties via JavaScript:

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://esm.sh/@big-calendar/styles/index.css" />
</head>
<body>
  <div id="cal" style="height:600px"></div>

  <script type="module">
    import { createTemporalLocalizer } from 'https://esm.sh/@big-calendar/localizer-temporal'
    import 'https://esm.sh/@big-calendar/lit'

    const localizer = await createTemporalLocalizer({ locale: 'en-US', timeZone: 'UTC' })
    const events = [
      { id: '1', title: 'Standup', start: '2026-06-15T09:00:00Z', end: '2026-06-15T09:30:00Z' }
    ]

    const container = document.getElementById('cal')
    container.innerHTML = `
      <bc-calendar>
        <bc-default-toolbar></bc-default-toolbar>
        <bc-month-view></bc-month-view>
        <bc-time-grid-view></bc-time-grid-view>
        <bc-agenda-view></bc-agenda-view>
      </bc-calendar>
    `
    const cal = container.querySelector('bc-calendar')
    cal.localizer = localizer
    cal.events = events
  </script>
</body>
</html>
```

---

## How it works

Big Calendar separates **state** from **rendering**. `<bc-calendar>` owns all the calendar state (which view is active, the focus date, the event list) and shares it via `@lit/context` to its child elements. Each child reads from that shared state automatically.

```html
<!-- bc-calendar: owns the state -->
<bc-calendar .localizer=${localizer} .events=${events}>
  <!-- Optional toolbar renders navigation and view switcher -->
  <bc-default-toolbar></bc-default-toolbar>

  <!-- View elements render the grid — only the active one renders content -->
  <bc-month-view></bc-month-view>
  <bc-time-grid-view></bc-time-grid-view>
  <bc-agenda-view></bc-agenda-view>
</bc-calendar>
```

All child elements are placed in the **light DOM** (not shadow DOM), so the shared `bc-*` CSS applies without any CSS parts or custom properties needed.

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

## Setting properties

Complex values (objects, arrays, functions) must be set as JavaScript **properties** using Lit's `.prop=` syntax, not as HTML attributes. In a Lit template:

```ts
html`
  <bc-calendar
    .localizer=${localizer}     <!-- .prop= for objects/functions -->
    .events=${events}           <!-- .prop= for arrays -->
    defaultView="month"         <!-- plain attr= for strings -->
  >
  </bc-calendar>
`
```

In vanilla JavaScript:
```js
const el = document.querySelector('bc-calendar')
el.localizer = localizer    // property assignment for objects
el.events = events          // property assignment for arrays
el.defaultView = 'month'    // setAttribute works for string attrs
```

---

## Slot selection

Let users click or drag on empty time to create new events:

```ts
html`
  <bc-calendar
    .localizer=${localizer}
    .events=${events}
    .selectable=${'click'}
    .onSlotSelect=${({ start, end, allDay }) => {
      console.log('Selected:', start, '→', end)
      // Open a create-event modal here
    }}
  >
    <bc-time-grid-view></bc-time-grid-view>
  </bc-calendar>
`
```

---

## Drag and drop

Requires `@big-calendar/dnd`. Enable it by wiring the three DnD callbacks:

```ts
import '@big-calendar/dnd'

html`
  <bc-calendar
    .localizer=${localizer}
    .events=${events}
    .onEventDrop=${({ event, start, end, allDay }) => {
      // Update your events state here
    }}
    .onEventResize=${({ event, start, end }) => {
      // Update your events state here
    }}
  >
    <bc-time-grid-view></bc-time-grid-view>
  </bc-calendar>
`
```

Mark individual events as draggable and resizable via the `draggable` and `resizable` fields on each event object (or override via `.accessors`).

---

## Packages

| Package | Purpose |
|---|---|
| `@big-calendar/lit` | Lit v3 custom elements (this package) |
| `@big-calendar/core` | Shared engine — store, view models, layout, selection FSM |
| `@big-calendar/dnd` | Optional drag-and-drop engine |
| `@big-calendar/styles` | CSS custom-property design tokens |
| `@big-calendar/localizer-temporal` | Temporal-backed localizer (recommended) |
| `@big-calendar/localizer-luxon` | Luxon-backed localizer |
| `@big-calendar/mcp` | MCP server for AI-assisted calendar development |
