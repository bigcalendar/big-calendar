# Testing

Sources: D-42, D-44, D-79, [date engine](../spec/date-engine.md).

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

**Never lower a threshold, skip a test or delete a test to make the build pass without asking the maintainer first** ([workflow](workflow.md) rule 3).

## Writing tests

- Use `@big-calendar/testing` (fake clock, drag and keyboard helpers, role-based queries) in our own tests (D-79). If a helper is missing, add it there rather than writing a local one. (D-85)
- Query by role and accessible name. A test that needs a class or test id to find an element usually means the accessible name is missing. (D-85)
- Time tests name the display zone and use the fake clock. Never depend on the machine's zone or the real time. (D-85)
- Tests of the time semantics cite the T-rule they cover (for example `T-10`). (D-85)
- Each bug fix starts with a failing test. (D-85)

## Benchmarks (D-44)

- The 50ms budget is gated on Chromium with 4× CPU slowdown, median of 10 runs after a warm-up.
- The 100ms polyfill budget is gated on unthrottled WebKit.
- Firefox is tracked, not gated.
- A PR fails if any median slows by more than 10% against `main`.
- One real-device check per slice (mid-range Android, iPhone) before approval.
