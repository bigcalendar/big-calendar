# @big-calendar/localizer-luxon

A Big Calendar localizer built on [Luxon](https://moment.github.io/luxon/), a popular JavaScript date and time library.

A localizer is what teaches Big Calendar how to read, format, and do math with dates. This one uses Luxon for all of that work, which makes it a good fit for projects that are already using Luxon for other things.

---

## When to use this

Use this localizer if you're already using Luxon in your project and want to keep your date handling consistent.

If you're starting fresh and don't already have a date library, use [`@big-calendar/localizer-temporal`](../localizer-temporal) instead. It uses the browser's built-in Temporal API and doesn't require an additional dependency.

---

## Installation

```bash
pnpm add @big-calendar/localizer-luxon luxon
```

Luxon is a peer dependency — you need it installed in your own project.

---

## Usage

```ts
import { LuxonLocalizer } from '@big-calendar/localizer-luxon'

const localizer = new LuxonLocalizer()
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
const localizer = new LuxonLocalizer({
  timeZone: 'Europe/London',
  locale: 'en-GB',
  firstDayOfWeek: 1, // 1 = Monday
})
```

---

## Options

| Option | Type | What it does |
|---|---|---|
| `timeZone` | `string` | IANA time zone name (e.g. `'Europe/London'`). Defaults to the user's local time zone. |
| `locale` | `string` | BCP 47 locale tag (e.g. `'en-GB'`, `'de-DE'`). Defaults to the browser's locale. |
| `firstDayOfWeek` | `0–6` | Which day starts the week. `0` = Sunday, `1` = Monday. Overrides the locale default when set. |

---

## Key exports

| Export | What it is |
|---|---|
| `LuxonLocalizer` | The localizer class |

---

## Dependencies

**[`luxon`](https://moment.github.io/luxon/)** — Listed as a peer dependency, not a direct dependency. This means you need to install Luxon yourself in your project. If Luxon is already in your `package.json`, nothing extra is needed. This keeps the package from bundling a second copy of Luxon if your project already has one.

---

## How this differs from react-big-calendar

**It was bundled into react-big-calendar; now it's a separate package.** RBC's Luxon localizer was a file shipped inside the main `react-big-calendar` package — you imported it from `react-big-calendar/lib/localizers/luxon`. Every RBC user got the localizer file in their `node_modules` whether they used Luxon or not.

Big Calendar packages each localizer separately. If you don't use Luxon, you don't install `@big-calendar/localizer-luxon` and none of its code appears in your project.

**Luxon's ISO parsing has a known gotcha with bracketed time zones.** The Big Calendar wire format can include an IANA time zone bracket in the string — for example `2025-09-01T09:00:00Z[America/New_York]` (RFC 9557 format). Luxon's `DateTime.fromISO()` reads the wall-clock digits and discards the `Z`, which produces the wrong instant. The `LuxonLocalizer` handles this by splitting the bracket off before parsing and reconstructing the string manually on output — you don't need to do anything special, but it's worth knowing if you ever inspect the wire format.

---

Part of the [Big Calendar](../../README.md) monorepo.
