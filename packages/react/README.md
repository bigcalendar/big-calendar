# @big-calendar/react

The React UI package for Big Calendar. This is what most developers will install. It gives you a set of React components and hooks that render a fully interactive event calendar — with month, week, day, and agenda views, keyboard navigation, accessibility support, and optional drag-and-drop.

---

## Requirements

- React 18 or later

---

## Installation

```bash
pnpm add @big-calendar/react @big-calendar/localizer-temporal @big-calendar/styles
```

For drag-and-drop support, also install the optional DnD package:

```bash
pnpm add @big-calendar/dnd
```

---

## Basic usage

```jsx
import { CalendarProvider, Calendar } from '@big-calendar/react'
import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'
import '@big-calendar/styles/index.css'

const localizer = await createTemporalLocalizer()

const events = [
  {
    id: '1',
    title: 'Team standup',
    start: '2025-09-01T09:00:00Z',
    end: '2025-09-01T09:30:00Z',
  },
]

function MyCalendar() {
  return (
    <CalendarProvider localizer={localizer} events={events}>
      <Calendar />
    </CalendarProvider>
  )
}
```

---

## How it's structured

Big Calendar separates **state** from **rendering**. The `CalendarProvider` owns all the calendar's state (which view is active, what date is focused, the event list). The `Calendar` component reads from that state and renders the UI. This lets you place your own toolbars, sidebars, or other controls alongside the calendar, and they can all read and drive the same state.

```jsx
<CalendarProvider localizer={localizer} events={events} defaultView="week">
  <MyCustomToolbar />   {/* can read and control the calendar too */}
  <Calendar />
</CalendarProvider>
```

---

## CalendarProvider props

| Prop | Type | Description |
|---|---|---|
| `localizer` | `LocalizerContract` | Required. A localizer instance (e.g. from `createTemporalLocalizer()`). |
| `events` | `TEvent[]` | The list of events to display. |
| `backgroundEvents` | `TEvent[]` | Events rendered as background shading (not interactive). |
| `resources` | `TResource[]` | Resource columns for multi-resource views. |
| `defaultView` | `ViewKey` | The view to start on (`'month'`, `'week'`, `'day'`, `'agenda'`). |
| `defaultDate` | `string` | The date to focus on initially (ISO 8601). |
| `view` | `ViewKey` | Controlled view. Wire `onView` to update it. |
| `date` | `string` | Controlled focus date. Wire `onNavigate` to update it. |
| `views` | `ViewKey[]` | Which views to show in the toolbar. Defaults to all built-in views. |
| `onEventClick` | `(event) => void` | Fired when the user clicks an event. |
| `onEventDrop` | `(args) => void` | Fired when an event is dragged to a new time (requires `@big-calendar/dnd`). |
| `onEventResize` | `(args) => void` | Fired when an event is resized (requires `@big-calendar/dnd`). |
| `onDropFromOutside` | `(args) => void` | Fired when an item from outside the calendar is dropped onto it. |
| `onSelectSlot` | `(args) => void` | Fired when the user clicks or drags on an empty time slot. |
| `components` | `CalendarComponents` | Override individual UI components (event rendering, toolbar, etc.). |
| `messages` | `Partial<Messages>` | Override UI strings (button labels, empty-state text, etc.). |

---

## Views

The default views are `month`, `week`, `day`, and `agenda`. Pass a `views` array to show only a subset:

```jsx
<CalendarProvider localizer={localizer} events={events} views={['week', 'day']}>
  <Calendar />
</CalendarProvider>
```

---

## Customizing event rendering

Use the `components` prop to replace how events look:

```jsx
function MyEvent({ event }) {
  return <div style={{ background: event.color }}>{event.title}</div>
}

<CalendarProvider
  localizer={localizer}
  events={events}
  components={{ event: MyEvent }}
>
  <Calendar />
</CalendarProvider>
```

---

## Key exports

| Export | What it is |
|---|---|
| `CalendarProvider` | The required outer wrapper. Owns all calendar state. |
| `Calendar` | The default calendar view component. Must render inside a provider. |
| `useCalendar` | Headless hook — creates a calendar store without any rendering. |
| `useCalendarStore` | Access the store from inside a `CalendarProvider`. |
| `MonthView` / `TimeGridView` / `AgendaView` | Individual view components (if you need to render them directly). |
| `Toolbar` / `DefaultToolbar` | The navigation toolbar. |
| `useToolbarProps` | Hook that returns the data and callbacks needed to build a custom toolbar. |

---

## Dependencies

**[`@preact/signals-core`](https://github.com/preactjs/signals)** — Reads reactive state from the calendar store. Components subscribe to individual signals (the current view, the current date, the active view model) and re-render only when those specific signals change. This is more precise than React context or `useState` — a component that only reads `store.view` doesn't re-render when `store.events` changes.

**[`clsx`](https://github.com/lukeed/clsx)** — Builds conditional `className` strings. Small utility, no notable alternatives considered.

**[`@big-calendar/core`](../core)** — The engine. All calendar logic lives here; this package is the React adapter that renders it.

**[`@big-calendar/styles`](../styles)** — Listed as a direct dependency so pnpm and npm hoist it automatically when you install this package. You still need to import the CSS yourself (see Usage above) — listing it as a dependency just ensures it's in `node_modules`.

**[`@big-calendar/dnd`](../dnd)** — An optional peer dependency. Installing it makes drag-and-drop available, but you still need to wire it up by calling the `useCalendarDnd` hook inside your `CalendarProvider`. When the package is absent, the calendar renders without any DnD features and no errors.

---

## How this differs from react-big-calendar

**The store lives outside React.** react-big-calendar managed all state — current view, current date, selected event, events list — through React's own `useState` and `useReducer`. Big Calendar creates a store using `@preact/signals-core` that exists independently of the React tree. React reads from it using `useSignalValue`; other parts of the system (the DnD layer, the selection FSM) write to it directly without going through React at all. This keeps the core engine framework-agnostic and avoids re-rendering the entire calendar tree when only one small piece of state changes.

**`CalendarProvider` + `Calendar` instead of one big `<Calendar>`.** react-big-calendar had a single `<Calendar>` component that accepted 50+ props and managed everything internally. Big Calendar splits this into two pieces: `CalendarProvider` owns the store, and `Calendar` renders the active view. Any component rendered inside the provider can read and drive the same store — a custom toolbar, a sidebar showing upcoming events, a mini calendar for date picking. In react-big-calendar, building a custom toolbar that actually controlled the calendar required reaching into internal state.

**Hybrid controlled/uncontrolled model.** react-big-calendar had a mixed, sometimes unpredictable story around controlled and uncontrolled props. Big Calendar is explicit: omit `view` and `date` to let the store own them (uncontrolled), or pass them and wire `onView`/`onNavigate` to control them from outside. You can mix — `view` can be controlled while `date` is uncontrolled, or vice versa.

**DnD is optional and framework-agnostic.** react-big-calendar bundled `react-dnd` (a React-specific library) as a direct dependency — you got it whether you used DnD or not. Big Calendar's DnD layer is a separate package (`@big-calendar/dnd`) with no React dependency. Install it if you need drag-and-drop; leave it out if you don't.

**React 18 is the minimum.** react-big-calendar supported React 16.3 and later. Big Calendar requires React 18 or later. This lets the package use current React patterns without worrying about legacy behavior.

---

Part of the [Big Calendar](../../README.md) monorepo.
