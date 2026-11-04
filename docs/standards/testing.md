# Testing

Sources: D-42, D-44, D-79, D-92, D-93, D-100, [date engine](../spec/date-engine.md).

## Layers (D-42)

| Layer                   | Tool                                                                                         | Used for                                              |
| ----------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Unit                    | Vitest                                                                                       | Everything                                            |
| Property                | fast-check                                                                                   | Time engine, segmentation, packing                    |
| Conformance corpora     | Vitest                                                                                       | Time semantics, RRULE, ICS round-trip, month overflow |
| Interaction and binding | Vitest browser mode (Playwright)                                                             | Machines, binding, components. **Not jsdom.**         |
| End to end and visual   | Playwright on Chromium, Firefox, WebKit, with touch emulation                                | Full flows                                            |
| Accessibility           | axe (zero violations) plus the [screen-reader script](../checklists/screen-reader-script.md) | Every slice                                           |
| Performance             | CI benchmarks ([benchmark profile](../decisions.md), D-44)                                   | Budgets in [date engine](../spec/date-engine.md)      |

## Coverage (D-42)

Per package, never per file:

- kernel, interactions and modules: 90% branches, 95% lines;
- binding and UI: 80% branches.
- `temporal` and `testing`: 90% branches, 95% lines, like the kernel; `styles` has no JavaScript and no threshold (D-101).

Thresholds live in `vite.library.ts` (`coverage`) and each package's `vite.config.ts`. Framework-free packages run their unit tests in Node, where any DOM use fails; the binding and `react-ui` run theirs in Chromium, Firefox and WebKit, with coverage collected from the Chromium run (D-101). Each package has a `test-environment.test.ts` that fails if its environment is switched.

**Never lower a threshold, skip a test or delete a test to make the build pass without asking the maintainer first** ([workflow](workflow.md) rule 3).

## Writing tests

- Use `@big-calendar/testing` (fake clock, drag and keyboard helpers, role-based queries) in our own tests (D-79). If a helper is missing, add it there rather than writing a local one. (D-85)
- Query by role and accessible name. A test that needs a class or test id to find an element usually means the accessible name is missing. (D-85)
- Time tests name the display zone and use the fake clock. Never depend on the machine's zone or the real time. (D-85)
- Tests of the time semantics cite the T-rule they cover (for example `T-10`). (D-85)
- Each bug fix starts with a failing test. (D-85)

## Type checks (D-95, D-97)

The public types are tested like code, in `tools/type-checks`:

- `src/usage/` must compile (`typecheck` target): realistic calendar setups, a feature package registering itself from outside core (`src/runtime/recurrence.ts`), and the P3 move machine in table form.
- `fail/` holds cases that must fail (`test` target): each `// expect: <text>` line names the error the case below it must produce. A missing error, an error elsewhere, or different text fails the check. Error text is part of the API (D-63), so a case checks the message, not just that something failed.
- `src/runtime/` declares the runtime the slices haven't written yet (`createCalendar`, `defineMachine`, …), typed against the real packages (D-99). When a slice implements one, delete its stand-in so the checks use the real export.
- When you change a public type, add a usage case for what it allows and a `fail/` case for what it forbids.

## Dates, times and browsers (D-87)

- **Compare formatted output by parts, never as full strings across engines.** Use `formatToParts()` structure or the underlying values (year, month, era). Engines format the same date differently ("Jum. I" vs "Jmd. I", "8 Reiwa" vs "Reiwa 8").
- **The Playwright suite runs twice on every engine:** once as-is, and once with `globalThis.Temporal` removed by an init script, so the polyfill path is always tested. Playwright's WebKit has native Temporal, which shipped Safari doesn't.
- **The per-slice real-device check includes Safari 26.x** (iOS or macOS) while Safari 26 is on the browser floor. Playwright's WebKit can't reproduce Safari 26 bugs.
- **Each supported bundler and test runner gets a CI smoke test** that builds and runs a small sample app ([support matrix](../spec/support-matrix.md)).

## Time-semantics corpus (D-92, D-93)

- The conformance suite includes the P4 correctness corpus (`prototypes/p4-bench/temporal/corpus.js`, 17,777 cases), with native Temporal as the reference, on both the native and the polyfill path.
- It adds Morocco's future Ramadan periods (2029–2032, 2039–2040). They pass on the polyfill path since `temporal-polyfill` 1.0.7 (D-100), so they're ordinary cases: a failure there is a regression.

## Benchmarks (D-44, D-92)

The harness, built in S0 from the P4 prototype (`prototypes/p4-bench/`):

- **Runner:** Playwright with a plain in-page runner, no benchmark library. Each configuration gets a fresh page, one recorded cold run, one warm-up, then the median of 10 runs.
- **Profiles:**
  - Chromium with 4× CPU slowdown (CDP `Emulation.setCPUThrottlingRate`) and native Temporal: **gated at 50ms**;
  - unthrottled WebKit **with `Temporal` deleted by an init script** (Playwright's WebKit has native Temporal, so without it the polyfill budget measures nothing): **gated at 100ms**;
  - Firefox, and Chromium with the polyfill (the floor predates native Temporal): tracked, not gated.
- **Scenarios:** 5,000 events spread over a year and packed inside the visible range, for every view family as it lands (month and week in S1, agenda and timeline with virtualization later), plus single-event edits.
- **What's timed:** kernel engine time (ingest plus view model) against the budgets. From S1, rendering is measured separately through CDP `Performance.getMetrics` (script and layout time).
- **Structural checks are tests, not timings.** "A single event change re-renders only the affected lanes" is asserted by counting lane recomputes.
- **Regression:** the PR build and `main` run back to back in the same CI job on the same machine. A median more than 10% slower fails the PR. If CI proves too noisy, D-44's fallback (relative tracking) applies.
- **Output:** JSON results as a CI artifact, and a PR comment table (benchmark, budget, `main`, branch, change), as the `bench` skill describes.
- **Real devices:** one check per slice (mid-range Android, iPhone) before approval, using a results page like `prototypes/p4-bench/safari.html` that posts its numbers back to the harness. Phone timings are tracked, not gated.
- **Sizes (D-63):** esbuild production bundles per entry point, minified and gzipped, measured as in `prototypes/p4-bench/size/measure.mjs`. `tools/size` checks each entry point against the budget in its package's `package.json` (`"bigCalendar": { "sizeBudgets": { ".": "1 KB" } }`, D-97), and the binding's lines of code against 600 (excluding `*.type.ts`, tests, stories, comments and blank lines). A slice that adds an entry point adds its budget; S0's budgets are placeholders for empty entry points.
