# @big-calendar/core

The engine that powers Big Calendar. All of the calendar's logic lives here: which days to show, how to position events on the screen, how to track what the user has selected, how to navigate between views. None of it is tied to any specific framework.

You don't usually install this package directly. Framework packages like `@big-calendar/react` depend on it for you. But if you're building a new framework adapter or working with the calendar store directly, this is where you start.

---

## What's inside

**Store** — The central state container. It holds the current view, the current date, the event list, and the active selection. Framework adapters read from it using signals and write to it by calling actions.

**View models** — Computed representations of each view (month, time grid, agenda). The store derives these from your events and the current date range, so your UI just renders what it receives.

**Layout algorithms** — Logic for positioning overlapping events in a time grid. Two built-in strategies: `overlap` (events stack side by side) and `noOverlap` (events expand to fill the column when there's room).

**Selection FSM** — A finite state machine that tracks what happens when the user clicks and drags on empty calendar slots. Handles the difference between a click, a short drag, and a held drag, and fires the appropriate callbacks.

**Accessors** — A small system for reading data from your event objects. You tell the calendar where to find the title, start time, end time, etc. on your events, and it does the rest.

**Messages** — The English-language strings the calendar uses for labels, button text, and screen reader announcements. Override any of them to localize or customize the UI.

---

## Installation

```bash
pnpm add @big-calendar/core
```

You also need a localizer — the piece that handles date parsing and formatting:

```bash
pnpm add @big-calendar/localizer-temporal
```

---

## Basic usage

```ts
import { createCalendarStore } from '@big-calendar/core'
import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'

const localizer = await createTemporalLocalizer()

const store = createCalendarStore({
  localizer,
  events: [
    {
      id: '1',
      title: 'Kickoff meeting',
      start: '2025-09-01T10:00:00Z',
      end: '2025-09-01T11:00:00Z',
    },
  ],
})

// Read the current view model (signals update reactively)
console.log(store.viewModel.value)
```

If you're building a React app, use `@big-calendar/react` instead — it wires this store to React components for you.

---

## Key exports

| Export | What it is |
|---|---|
| `createCalendarStore` | Creates the central store for one calendar instance |
| `BUILTIN_VIEWS` / `Views` / `Navigate` | Constants for view keys and navigation directions |
| `accessor` / `resolveAccessors` | Helpers for configuring event data accessors |
| `noOverlap` / `overlap` | Built-in day layout algorithms |
| `createSelection` | Mounts the slot selection state machine on a DOM element |
| `DEFAULT_MESSAGES` / `resolveMessages` | Default UI strings and message resolution |
| `moveEvent` | Utility for computing a new event position after a drag |

---

## Dependencies

**[`@preact/signals-core`](https://github.com/preactjs/signals)** — Fine-grained reactive state that works in any framework. The store uses three primitives from this library: `signal` for mutable state, `computed` for values that derive from other signals automatically, and `effect` for side effects that run when their dependencies change. `batch` groups multiple signal writes into one atomic update so subscribers only react once.

We chose signals over plain React state or a Redux-style store because the core engine has no framework dependency. The same store works for React, Vue, Angular, or any other adapter — each framework package bridges signals to its own reactivity system with a small hook or adapter. Signals are also fine-grained: only the part of the UI that reads a specific signal re-renders when that signal changes, which matters for a component as data-heavy as a calendar.

**[`@floating-ui/core`](https://floating-ui.com/)** — Positions tooltip and popover elements (show-more popovers, event tooltips) relative to their anchors. CSS Anchor Positioning — the modern browser API for this — was evaluated and ruled out: as of the Baseline 2024 support floor, it only works in Chromium-based browsers. `@floating-ui/core` is the permanent positioning engine, not a fallback. It is lazy-loaded on first use so it doesn't add to the initial bundle.

**[`@big-calendar/localizer`](../localizer)** — The base localizer contract. Core types all date/time work against `LocalizerContract`, which this package defines. Core itself has no knowledge of Temporal, Luxon, or any specific date library.

---

## How this differs from react-big-calendar

**The engine is framework-agnostic.** In `react-big-calendar`, all calendar logic was tied to React — the store, the view models, the event layout, the selection handling. In Big Calendar, all of that lives in this package with no framework imports. The React package is a thin adapter that reads from the store and routes DOM events back to it.

**Dates are strings, not `Date` objects.** `react-big-calendar` accepted and returned JavaScript `Date` objects at every boundary. `Date` objects carry no time zone information, behave differently depending on the machine's local clock, and serialize differently across environments. Big Calendar uses ISO 8601 strings everywhere — at the store level, in callbacks, in the view models. The localizer handles all parsing and formatting internally.

**The localizer is a strict contract, not a duck-typed object.** In `react-big-calendar`, a localizer was an object you constructed from a helper function and passed in — its shape was implied but not enforced. In Big Calendar, `LocalizerContract` is a TypeScript interface that core depends on directly. Any localizer that implements the interface works; the type system enforces it.

**Core owns all the business logic.** Selection state, event layout algorithms, navigation, drilldown, drag-and-drop date math — all of it lives in this package, tested against the pure logic, with no DOM or framework involved. The framework adapters are intentionally dumb: they translate DOM events into store actions and render what the store says.

---

Part of the [Big Calendar](../../README.md) monorepo.
