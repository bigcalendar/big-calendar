# @big-calendar/dnd

Optional drag-and-drop support for Big Calendar. Install this package when you want users to be able to drag events to new times, resize them by dragging their edges, or drop items from outside the calendar onto it.

This package is framework-agnostic — it wires into the calendar engine directly. For React, `@big-calendar/react` detects it automatically when it's installed and enables drag-and-drop behavior with no extra configuration.

---

## Installation

```bash
pnpm add @big-calendar/dnd
```

This package is listed as an optional peer dependency of `@big-calendar/react`. Once installed, the React UI will use it automatically.

---

## What it supports

**Move events** — Drag an event to a new time slot or day. The engine recomputes the event's start and end, then fires `onEventDrop` with the result.

**Resize events** — Drag the top or bottom edge of a time-grid event to change its duration. Fires `onEventResize`.

**Drop from outside** — Drag an item from elsewhere on the page (like a task list) onto the calendar to create a new event. Fires `onDropFromOutside`.

**Drag out** — Drag a calendar event out onto a drop target outside the calendar. The event's data is available on the native `dataTransfer` so your external drop zone can receive it.

**Keyboard drag-and-drop** — Full keyboard support for move and resize using the keyboard, accessible to users who can't use a mouse.

---

## Live previews

While an event is being dragged, Big Calendar shows a live preview of where it will land — before the user drops it. This works for all drag types, including items dragged in from outside the calendar.

---

## How it works (for adapter authors)

`@big-calendar/dnd` exports a single function, `bindCalendarDnd`, that takes a calendar root element and the calendar store, and wires up all drag sources and drop targets using [Atlassian's Pragmatic Drag and Drop](https://atlassian.design/components/pragmatic-drag-and-drop). It uses a `MutationObserver` to stay in sync as the calendar re-renders.

```ts
import { bindCalendarDnd } from '@big-calendar/dnd'

const cleanup = bindCalendarDnd({ root, store, mode: 'time' })

// Call cleanup() when the calendar unmounts
```

`mode` is either `'time'` (week, day, work-week views) or `'day'` (month view). The React adapter calls this for you.

---

## Key exports

| Export | What it is |
|---|---|
| `bindCalendarDnd` | Wires drag sources and drop targets onto a calendar root element |
| `EXTERNAL_MIME` | The MIME type to set on a native draggable item so the calendar accepts it as an external drop |
| `EVENT_MIME` | The MIME type the calendar writes when an event is dragged out |
| `EXTERNAL_DATA_KEY` | The data key to set on a Pragmatic `draggable` palette item |
| `ALLDAY_TARGET_ATTR` | HTML attribute the React adapter stamps on all-day row cells |
| `ALLDAY_SEGMENTS_ATTR` | HTML attribute the React adapter stamps on all-day segment containers |

---

## Dependencies

**[`@atlaskit/pragmatic-drag-and-drop`](https://atlassian.design/components/pragmatic-drag-and-drop/)** — The drag-and-drop library from Atlassian (the company behind Jira and Trello). We chose it because it is completely framework-agnostic — it works with plain DOM elements and has no dependency on React, Vue, or any other framework. This was a requirement: since `@big-calendar/dnd` is meant to power DnD for React today and Vue or Angular later, a React-specific library would not work here.

We evaluated `react-dnd` (React-specific, ruled out for the reason above) and `@dnd-kit` (also React-specific). Pragmatic DnD is the only widely-used option that works as a pure DOM layer.

**One important clarification about Pragmatic DnD's "external" drag monitor:** its built-in external adapter tracks items dragged in from *outside the browser window* — files from the desktop, links from another tab. It does not track a `draggable="true"` element on the same page that sits outside the calendar grid. For that use case (a task list or palette on the same page), Big Calendar uses plain HTML5 `dragover` and `drop` event listeners alongside Pragmatic. Both transports — Pragmatic sources and native HTML5 sources — fire the same `onDropFromOutside` callback with the same payload shape.

---

## How this differs from react-big-calendar

**react-big-calendar used `react-dnd`.** `react-dnd` is a React-specific library that wraps your components in higher-order components and manages drag state through React context. It worked fine for a React-only library, but it couldn't be used in a framework-agnostic core.

Big Calendar's DnD layer has no framework dependency. `bindCalendarDnd` takes a plain DOM element and a store reference, attaches Pragmatic DnD bindings to the elements it finds inside, and returns a cleanup function. The React package mounts and tears down this binder using a `useEffect` — but the binder itself knows nothing about React.

**All date math from a drop lives in core, not in the DnD layer.** When an event is dropped, `bindCalendarDnd` reads the target slot from a `data-*` attribute on the drop target element, calls `store.moveEvent` or `store.resizeEvent`, and lets the core engine compute the new bounds. The DnD layer is intentionally dumb: it maps DOM events to store actions and nothing else.

**Timed-to-all-day promotion is one-way.** react-big-calendar allowed dragging an all-day event down into the time grid to assign it a time. Big Calendar does not support this direction. Dragging a timed event up into the all-day row (to promote it to a whole-day event) is supported. The reverse — demoting an all-day event to a timed slot — is not, because there is no sensible default time to assign on drop, and guessing produces confusing behavior.

---

Part of the [Big Calendar](../../README.md) monorepo.
