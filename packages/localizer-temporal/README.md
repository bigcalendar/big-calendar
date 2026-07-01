# @big-calendar/localizer-temporal

The recommended localizer for Big Calendar, built on the [Temporal API](https://tc39.es/proposal-temporal/) — a modern, precise date and time system that's built into modern browsers.

A localizer is what teaches Big Calendar how to read, format, and do math with dates. This one uses Temporal for all of that work. If the browser running your app doesn't support Temporal yet, this package automatically loads a polyfill for you.

---

## When to use this

Use this localizer if:

- You're starting a new project
- You don't already have a date library in your app
- You want the best time zone handling available

If you're already using Luxon across your project, see [`@big-calendar/localizer-luxon`](../localizer-luxon) instead.

---

## Installation

```bash
pnpm add @big-calendar/localizer-temporal
```

---

## Usage

Use the `createTemporalLocalizer` factory function. It's async because it may need to load the Temporal polyfill in older browsers before the localizer is ready to use.

```ts
import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'

const localizer = await createTemporalLocalizer()
```

Then pass it to your calendar:

```jsx
import { CalendarProvider, Calendar } from '@big-calendar/react'
import '@big-calendar/styles/index.css'

function MyCalendar({ events }) {
  return (
    <CalendarProvider localizer={localizer} events={events}>
      <Calendar />
    </CalendarProvider>
  )
}
```

### Setting a time zone or locale

```ts
const localizer = await createTemporalLocalizer({
  timeZone: 'America/Chicago',
  locale: 'en-US',
  firstDayOfWeek: 0, // 0 = Sunday
})
```

---

## Options

| Option | Type | What it does |
|---|---|---|
| `timeZone` | `string` | IANA time zone name (e.g. `'America/Chicago'`). Defaults to the user's local time zone. |
| `locale` | `string` | BCP 47 locale tag (e.g. `'en-US'`, `'fr-FR'`). Defaults to the browser's locale. |
| `firstDayOfWeek` | `0–6` | Which day starts the week. `0` = Sunday, `1` = Monday. Overrides the locale default when set. |

---

## Key exports

| Export | What it is |
|---|---|
| `createTemporalLocalizer` | Async factory — the recommended way to create the localizer |
| `TemporalLocalizer` | The localizer class (if you need to construct it manually) |
| `loadTemporal` | Loads the Temporal namespace (native or polyfill) and returns it |

---

## Dependencies

**[`temporal-polyfill`](https://www.npmjs.com/package/temporal-polyfill)** — A lightweight, spec-compliant implementation of the Temporal API for browsers that don't support it natively yet. It is loaded lazily — only when `globalThis.Temporal` is not present — so browsers that already ship Temporal natively pay zero cost. We chose `temporal-polyfill` over the alternative `@js-temporal/polyfill` because it has a smaller bundle footprint while maintaining full spec compliance.

The polyfill is a `dependency` of this package, not a `devDependency`, so it is always available at runtime. But because it's loaded behind a `dynamic import()` that only runs on demand, bundlers won't pull it into the initial chunk unless a user's browser actually needs it.

---

## How this differs from react-big-calendar

**react-big-calendar had no Temporal support.** To use it, you had to install one of four supported date libraries — Moment.js, Luxon, date-fns, or Day.js — and import a matching localizer adapter. Moment.js alone added ~67KB to a production bundle.

Big Calendar recommends the Temporal API instead. In browsers that support it (all major engines have shipped or are shipping it), there is nothing extra to install. In older browsers, the polyfill is loaded automatically and silently. Either way, your app code looks the same.

**The constructor is async because the platform might not be ready.** `createTemporalLocalizer()` is an async function rather than a plain `new TemporalLocalizer()` call. This is because it needs to resolve the Temporal namespace — either natively from `globalThis.Temporal` or from the polyfill — before the localizer's methods can use it. The resolved namespace is cached after the first call, so subsequent `createTemporalLocalizer()` calls return almost instantly.

---

Part of the [Big Calendar](../../README.md) monorepo.
