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
  - **React users do nothing.** `<Calendar>` and the binding wait for `temporalReady` internally; P5 specifies how.
  - **Headless and kernel users `await temporalReady` once**, before `createCalendar`. Calling `createCalendar` earlier gives a teaching dev error that names `temporalReady` and links to the docs.
  - After that one wait, kernel APIs stay **synchronous**. No Big Calendar code may use Temporal at module evaluation time.
  - Browsers with native Temporal never download the polyfill. If the polyfill chunk fails to load, `temporalReady` rejects, as any failed lazy chunk would.
- **The polyfill is `temporal-polyfill`, its `full` build** (all calendars, 23.1 KB gzip; D-92). On a 17,777-case corpus checked against native Temporal in Chromium, Firefox and WebKit, it differed in 36 cases, against 641 for `@js-temporal/polyfill`, which is also twice the size and four to five times slower. Its known defects:
  - **`ZonedDateTime#withPlainTime`** keeps the receiver's offset in a repeated hour instead of resolving with `'compatible'`, which breaks T-10. The kernel never calls it: wall-clock times are resolved with `PlainDateTime#toZonedDateTime(zone, { disambiguation: 'compatible' })`, and a lint rule enforces this from S0. Reported upstream as [temporal-polyfill#123](https://github.com/fullcalendar/temporal-polyfill/issues/123).
  - **Two offset changes a few weeks apart** are missed, past or future: the offset before the first change is used all through the gap, so times there are an hour off. Examples: Morocco's Ramadan periods (2012–2021, and again from 2029 with tz 2026a) and Egypt's in 2010 and 2014. The public docs state this as a **known limitation of the polyfill path** (D-93). Tracked upstream as [temporal-polyfill#121](https://github.com/fullcalendar/temporal-polyfill/issues/121).
  - The P4 corpus, with those future dates added, is part of the time-semantics conformance suite on both the native and the polyfill path ([testing](../standards/testing.md)).
- **Performance budgets** are benchmarked in CI with Playwright and a throttled CPU:
  - **5,000 events** loaded;
  - first render of month or week view takes **under 50ms** of engine time with native Temporal (Chromium, Firefox), and **at most 100ms** on WebKit with the polyfill;
  - a single event change re-renders **only the affected lanes**;
  - **phones are tracked, not gated** (D-92): the per-slice device check records them. On the maintainer's iPhone (Safari 27.0.1, no native Temporal) the polyfill path took 109–168ms for 5,000 events, about 105ms of it ingest, so S1 measures lazy ingest (parsing the events near the visible range first);
  - **agenda and timeline are virtualized.**
