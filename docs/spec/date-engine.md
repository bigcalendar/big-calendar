# Date engine and performance

> **Normative.** Split verbatim from the approved plan (`plan/P1-PLAN.md` §8, approved 2026-10-27). Changing anything here needs a new entry in the [decision log](../decisions.md).

- **Temporal is used internally.** The public API uses strings, formatting goes through `Intl`, and there is **no pluggable localizer**. Moment, dayjs, date-fns, globalize and Luxon support is dropped.
- **Temporal defines correctness everywhere.**
  - **Calendar arithmetic always uses Temporal:** day boundaries (`startOfDay()`, `hoursInDay`), adding calendar units across DST, zone conversion, wall-clock positions (`toPlainTime()`), recurrence and formatting.
  - **Ordering instants** (sorting, overlap checks, packing comparisons) uses cached Temporal objects by default. `Instant.compare` is defined on epoch nanoseconds, so a numeric fast path gives identical results. It is allowed **only** for instant ordering, and **only** if P4's benchmarks show Temporal objects miss the budget.
  - **Civil dates never become instants.** If a numeric form is needed, it is an epoch-day count derived from `PlainDate`.
  - Temporal objects are created once per event at ingest and cached by object identity.
- **Temporal loads automatically.** Every package that uses Temporal depends on `@big-calendar/temporal`, which uses top-level `await`:
  - If a complete `globalThis.Temporal` already exists, native or installed by the app, it is used as-is and nothing is loaded.
  - Otherwise the module awaits the polyfill, which bundlers split into its own chunk, and **installs it on `globalThis`**. The app and its other libraries therefore see it too, and the docs must say so.
  - Because ES modules wait for their imports, nothing in Big Calendar runs before Temporal exists. The app does nothing, and kernel APIs stay **synchronous**.
  - Browsers with native Temporal never download the polyfill. If the polyfill chunk fails to load, importing the calendar fails, as any failed lazy chunk would.
- **Which polyfill** (`temporal-polyfill` or `@js-temporal/polyfill`) is decided by benchmark in **P4**.
- **Performance budgets** are benchmarked in CI with Playwright and a throttled CPU:
  - **5,000 events** loaded;
  - first render of month or week view takes **under 50ms** of engine time with native Temporal (Chromium, Firefox), and **at most 100ms** on WebKit with the polyfill;
  - a single event change re-renders **only the affected lanes**;
  - **agenda and timeline are virtualized.**
