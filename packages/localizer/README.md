# @big-calendar/localizer

The base class for all Big Calendar localizers. A localizer is the piece that teaches the calendar how to work with dates — how to parse them, format them for display, compare them, and do date math like "add one week" or "find the start of the month."

You don't use this package to build a calendar. You use it when you're **creating a new localizer** — for example, to support a date library that Big Calendar doesn't have a localizer for yet.

If you just want to use an existing localizer, install one of these instead:

- [`@big-calendar/localizer-temporal`](../localizer-temporal) — recommended, uses the browser's built-in Temporal API
- [`@big-calendar/localizer-luxon`](../localizer-luxon) — for teams already using Luxon

---

## What's inside

The `Localizer` base class handles all the locale-aware logic — number formatting, week start day, date range formatting, and so on — using the browser's built-in `Intl` APIs. It's all string-in, string-out: the calendar never passes raw `Date` objects around.

To create a new localizer, you extend `Localizer` and implement three protected methods:

- `parse(value: string)` — convert an ISO date string into your library's date type
- `serialize(dt: T)` — convert your library's date type back to an ISO string
- `toEpochMs(dt: T)` — return the Unix timestamp in milliseconds

Everything else (formatting, comparison, arithmetic, range queries) is built on top of those three.

---

## Installation

```bash
pnpm add @big-calendar/localizer
```

---

## Building a custom localizer

```ts
import { Localizer } from '@big-calendar/localizer'

class MyLocalizer extends Localizer<MyDateType> {
  protected parse(value: string): MyDateType {
    return MyDateLibrary.parse(value)
  }

  protected serialize(dt: MyDateType): string {
    return MyDateLibrary.toISO(dt)
  }

  protected toEpochMs(dt: MyDateType): number {
    return MyDateLibrary.toMilliseconds(dt)
  }
}

const localizer = new MyLocalizer({ timeZone: 'America/New_York' })
```

The type parameter `T` is your library's internal date type. It never leaves the localizer — the rest of the calendar only sees strings.

---

## LocalizerOptions

| Option | Type | What it does |
|---|---|---|
| `timeZone` | `string` | IANA time zone name (e.g. `'America/Chicago'`). Defaults to the user's local time zone. |
| `locale` | `string` | BCP 47 locale tag (e.g. `'en-US'`, `'fr-FR'`). Defaults to the browser's locale. |
| `firstDayOfWeek` | `0–6` | Which day to start the week on. `0` = Sunday, `1` = Monday, etc. Overrides the locale default when set. |

---

## Key exports

| Export | What it is |
|---|---|
| `Localizer` | Base class to extend for a custom localizer |
| `LocalizerContract` | TypeScript interface describing the full localizer API |
| `LocalizerOptions` | Options type for the `Localizer` constructor |
| `DEFAULT_FORMATS` | Default format strings used for labels and headings |
| `getWeekInfo` | Utility to look up week start day and weekend days for a locale |

---

## Dependencies

None. This package is pure TypeScript with no runtime dependencies. It uses only the browser's built-in `Intl` APIs for locale-aware formatting and week information.

Two small ponyfills are included for `Intl` features that aren't available in all Baseline 2024 browsers: week start day (`Intl.Locale.prototype.weekInfo`) and duration formatting (`Intl.DurationFormat`). Both feature-detect at runtime and fall back to CLDR data or native number formatting when the browser doesn't support the API directly.

---

## How this differs from react-big-calendar

**One base class instead of four separate packages.** `react-big-calendar` shipped four separate localizer adapters — one each for Moment.js, Luxon, date-fns, and Day.js. Each adapter independently implemented the same ~30 formatting and arithmetic methods, which meant bugs and inconsistencies could vary by which localizer you had installed.

Big Calendar has one `Localizer` base class that implements the entire contract once. A concrete localizer (like `TemporalLocalizer` or `LuxonLocalizer`) only needs to implement three primitive methods: `parse`, `serialize`, and `toEpochMs`. All the locale logic, week layout math, and formatting is inherited from the base and behaves identically regardless of which localizer you use.

**Dates never cross the public boundary as objects.** `react-big-calendar` localizers worked with `Date` objects — they accepted them as input and returned them from methods. Big Calendar localizers are string-in, string-out: ISO date strings enter, ISO date strings leave. The internal date type (Temporal's `ZonedDateTime`, Luxon's `DateTime`, etc.) is a generic type parameter that stays private to the concrete class and never appears in the public API.

**Weekdays follow ISO 8601.** `react-big-calendar` used JavaScript's `Date.getDay()` convention where Sunday = 0 and Saturday = 6. Big Calendar uses ISO 8601 where Monday = 1 and Sunday = 7, matching the `Temporal` API and `Intl.Locale.weekInfo`. This avoids the off-by-one arithmetic that was a common source of bugs in RBC's localizers.

---

Part of the [Big Calendar](../../README.md) monorepo.
