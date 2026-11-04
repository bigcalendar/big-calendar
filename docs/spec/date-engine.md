# Date engine and performance

> **Normative.** Split verbatim from the approved plan (`plan/P1-PLAN.md` §8, approved 2026-10-27); the Temporal loading rules are amended by D-87, and the polyfill, instant ordering and the phone budget by D-92 and D-93 (P4). Changing anything here needs a new entry in the [decision log](../decisions.md).

- **Temporal is used internally.** The public API uses strings, formatting goes through `Intl`, and there is **no pluggable localizer**. Moment, dayjs, date-fns, globalize and Luxon support is dropped.
- **Temporal defines correctness everywhere.**
  - **Calendar arithmetic always uses Temporal:** day boundaries (`startOfDay()`, `hoursInDay`), adding calendar units across DST, zone conversion, wall-clock positions (`toPlainTime()`), recurrence and formatting.
  - **Ordering instants** (sorting, overlap checks, packing comparisons) compares `epochNanoseconds` BigInts, cached once per event at ingest (D-92). `Instant.compare` is defined on epoch nanoseconds, so the results are identical. The numeric form is allowed **only** for instant ordering. P4 measured why: Chromium's native `Instant.compare` costs about 260ns per call, so 5,000 events took 104–279ms against the 50ms budget (4× slowdown); with cached BigInts they took 23–34ms.
  - **Civil dates never become instants.** If a numeric form is needed, it is an epoch-day count derived from `PlainDate`.
  - Temporal objects are created once per event at ingest and cached by object identity.
- **Temporal loads automatically, behind one ready promise (D-87, amending D-32).** Every package that uses Temporal depends on `@big-calendar/temporal`. It does **not** use top-level `await`, which breaks in Safari before 27 ([support matrix](support-matrix.md), finding 1):
  - If a complete `globalThis.Temporal` already exists, native or installed by the app, it is used as-is, nothing is loaded, and `temporalReady` is already resolved.
  - Otherwise, importing the module starts loading the polyfill, which bundlers split into its own chunk. When it arrives, the module **installs it on `globalThis`** and resolves `temporalReady`. The app and its other libraries therefore see it too, and the docs must say so.
  - **React users do nothing.** `<Calendar>` and the binding wait for `temporalReady` internally, as [types and public API](api.md) section 3.1 specifies (D-94).
  - **Headless and kernel users `await temporalReady` once**, before `createCalendar`. Calling `createCalendar` earlier gives a teaching dev error that names `temporalReady` and links to the docs.
  - After that one wait, kernel APIs stay **synchronous**. No Big Calendar code may use Temporal at module evaluation time.
  - Browsers with native Temporal never download the polyfill. If the polyfill chunk fails to load, `temporalReady` rejects, as any failed lazy chunk would.
- **The polyfill is `temporal-polyfill` 1.0.7 or later, its `full` build** (all calendars, 22.7 KB gzip; D-92, D-100). On a 17,777-case corpus checked against native Temporal in Chromium, Firefox and WebKit, 1.0.7 differs in no case, against 641 for `@js-temporal/polyfill`, which is also twice the size and four to five times slower.
  - **1.0.7 fixed the two defects P4 found** in 1.0.6 (D-100): `ZonedDateTime#withPlainTime` in a repeated hour ([temporal-polyfill#123](https://github.com/fullcalendar/temporal-polyfill/issues/123)), and offsets missed between two changes a few weeks apart, such as Morocco's Ramadan periods past and future ([temporal-polyfill#121](https://github.com/fullcalendar/temporal-polyfill/issues/121)). Its offsets for Casablanca, El Aaiún, Tehran and New York match native Temporal and `Intl` on every day from 2019 to 2040 in all three engines. There is no known limitation of the polyfill path, and the kernel may use any Temporal API.
  - The P4 corpus, with Morocco's future Ramadan periods added, is part of the time-semantics conformance suite on both the native and the polyfill path ([testing](../standards/testing.md)), so a regression in a later polyfill release fails CI.
- **Performance budgets** are benchmarked in CI with Playwright and a throttled CPU:
  - **5,000 events** loaded;
  - first render of month or week view takes **under 50ms** of engine time with native Temporal (Chromium, Firefox), and **at most 100ms** on WebKit with the polyfill;
  - a single event change re-renders **only the affected lanes**;
  - **phones are tracked, not gated** (D-92): the per-slice device check records them. On the maintainer's iPhone (Safari 27.0.1, no native Temporal) the polyfill path took 109–168ms for 5,000 events, about 105ms of it ingest, so S1 measures lazy ingest (parsing the events near the visible range first);
  - **agenda and timeline are virtualized.**
