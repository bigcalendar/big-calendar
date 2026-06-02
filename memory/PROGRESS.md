# PROGRESS

> Read this first on every restart (Appendix B.4). Then continue from "Next".

## Current phase

**Phase 2 — Core engine** (in progress). Phase 1 complete. Phase 2 is split into PR-sized
sub-tasks (2a…2i); see "Done" / "Next" below.

## How to resume

- **Branch:** `feat/initial` (all baseline work lands here; no PRs — user merges manually). Pushed to `origin/feat/initial`.
- **Install:** `pnpm install` at repo root.
- **Verify:** `pnpm exec nx run-many -t lint typecheck test build` (all green as of latest commit).
- **Coverage:** per-file bar 85% branch / 95% function (Vitest `perFile`).
- **Next:** start **Phase 2 — Core engine** (`@big-calendar/core`): signals store, view models for all
  5 views, layout algorithms, navigation, accessors, selection FSM. Build on the `LocalizerContract`.
  `/compact` first (phase boundary).

## Done

### Phase 0 — Foundations ✓ (committed, pushed)

- Repo + workspace config, Nx (Cloud OFF) + Nx Release, TS base, ESLint flat config with
  `@nx/enforce-module-boundaries` scope graph, commitlint + Husky, Vitest workspace, 4 CI workflows,
  8 package scaffolds. All gates green; module-boundary enforcement verified.

### Phase 1 — Task 1a: `@big-calendar/localizer` base ✓ (this commit)

- **`src/types/localizer.type.ts`** — full string-in/string-out `LocalizerContract`, `LocalizerOptions`,
  `DateParts`, `DateTimeUnit`/`FixedUnit`, `FormatKey`/`FormatMap`, `CompareArgs`, `DateRange`, `TimeParts`.
- **`src/ponyfills/weekInfo.function.ts`** — `getWeekInfo(locale)`: native `Intl.Locale` week API when
  present, else compact CLDR region table (Sunday/Saturday-first sets, Fri/Sat weekend set).
- **`src/ponyfills/durationFormat.function.ts`** — `formatDuration(...)`: native `Intl.DurationFormat`
  when present, else `Intl.NumberFormat` unit + `Intl.ListFormat` fallback.
- **`src/constants/formats.constant.ts`** — `DEFAULT_FORMATS` (overridable named Intl option sets).
- **`src/localizer.class.ts`** — abstract `Localizer<T>` implementing the entire contract on top of a
  small `protected abstract` primitive set (`parse/serialize/toEpochMs/getParts/addUnits/startOfUnit/
  endOfUnit/diffUnits/withTime/offsetMinutes`). Subclasses only supply those primitives.
- Tests: 44 cases via a UTC `TestLocalizer` fixture + ponyfill suites. Coverage 95.78% branch /
  100% function. Lint + typecheck + build green.

### Phase 1 — Task 1b: `@big-calendar/localizer-temporal` ✓ (committed)

- **`src/loadTemporal.function.ts`** — lazy `loadTemporal()`: feature-detects `globalThis.Temporal`,
  else dynamic-imports `temporal-polyfill`; caches. `TemporalAPI` is a hand-written structural interface
  (the `import type { Temporal }` value-namespace approach tripped `consistent-type-imports`; the
  narrow interface — `Instant`/`ZonedDateTime`/`PlainDate` `.from` — is what the full namespace assigns to).
- **`src/localizer-temporal.class.ts`** — `TemporalLocalizer extends Localizer<Temporal.ZonedDateTime>`
  implementing all engine primitives over `Temporal.ZonedDateTime` (DST-aware via `startOfDay`, offset
  via `offsetNanoseconds`, RFC 3339 vs 9557 via `toString({ timeZoneName })`, date-only via `PlainDate`).
- **`src/index.ts`** — `createTemporalLocalizer(options)` async factory + `TemporalLocalizer`/`loadTemporal` exports.
- Tests: 17 cases incl. real DST (EST/EDT 300/240, 60-min shift), RFC 9557 bracket round-trip, date-only
  parse, loader native+cached branches (via `vi.resetModules`). class.ts 88.23% branch / 100% function.

### Phase 1 — Task 1c: CSS layout/top-layer support spike ✓ (committed)

- **`memory/spikes/phase1-css-layout.md`** — support + fallback matrix for Subgrid / Popover API /
  CSS Anchor Positioning / `:dir()`. Outcome: adopt subgrid + Popover + `:dir()` (Baseline); **anchor
  positioning is non-Baseline → use `@floating-ui/core` as the default positioning engine**, native
  `anchor()` only as a later progressive enhancement. Desk review (Jan-2026 cutoff); empirical Playwright
  verification deferred to Phase 3 (watch-item in the report).

### Phase 2 — Task 2a: core constants + accessors ✓ (commit 8096d7a, pushed)

- **`src/constants/views.constant.ts`** — `Views` + `Navigate` const objects (values matched to v1
  `views`/`navigate` for parity) with derived `BuiltinViewKey`/`NavigateDirection` unions.
- **`src/types/calendar.type.ts`** — `ViewKey` (= built-in set for now; widens when the view registry
  lands), `EventId`, `ResourceId`.
- **`src/accessors/accessors.{type,function}.ts`** — `Accessor`/`Accessors`/`WrappedAccessor` types and
  `accessor`/`wrapAccessor`/`resolveAccessors` + `DEFAULT_ACCESSORS`. Default field names match v1 exactly
  (`tooltip`→'title', `resourceId`→'id', `id`/`eventId`→'id'). 100% stmt/branch/func/line coverage.
- Barrel `src/index.ts` re-exports all of the above. Placeholder `smoke.test.ts` left in place.

## In progress

- (none — task 2a committed + pushed; pick up 2b next)

## Next

Phase 2 sub-tasks, in order (PR-sized; `/compact` between them per Appendix B.3/B.5):

1. **2b — store factory** `createCalendarStore(config)`: signals (`date`/`view`/`selected`), config
   normalization (accessors via `resolveAccessors`, required localizer), actions
   (`navigate`/`setView`/`select`/`destroy`), `viewModel` computed wiring (stub until view models land).
2. **2c — navigation**: `navigate(date, direction, view)` (PREV/NEXT/TODAY/DATE), drilldown resolution,
   derived range / range-change computation. Built on `LocalizerContract`.
3. **2d — layout algorithms**: `overlap` + `no-overlap` as pure fns returning normalized boxes
   (`{ top, height, left, width, zIndex }` fractions).
4. **2e — month view model**; **2f — time-grid (day/week/work_week) view models**;
   **2g — agenda view model + resource grouping**.
5. **2h — selection FSM** (pointer + keyboard, §8.2); **2i — messages map** (English defaults, overridable).

All built against `LocalizerContract` (core depends on the contract type, never a concrete localizer).
Per-file coverage bar 85% branch / 95% function throughout.

## Deferred (explicit — revisit later, not now)

- **CSS Anchor Positioning** — use `@floating-ui/core` for all tethered positioning **for now**. Adopt
  native CSS anchor positioning (`anchor-name`/`position-anchor`/`anchor()`/`position-try`) as a
  feature-detected progressive enhancement **only once it is stable across engines** (Chromium-only as of
  the Jan-2026 cutoff; Safari/Firefox not yet shipped). Trigger to revisit: confirm Safari + Firefox
  stable support via caniuse/MDN. See `memory/spikes/phase1-css-layout.md` + DECISIONS.md (2026-06-02).

## Notes / watch-items

- Toolchain pinned to latest stable at scaffold time: nx 22, TS 6, Vite 8, Vitest 4, ESLint 10,
  typescript-eslint 8.60.
- npm `@big-calendar` org + `NPM_TOKEN` and Pages secrets are the USER's setup step before the
  release/docs workflows can publish/deploy.
- **weekday convention:** ISO-8601 `1=Mon … 7=Sun` everywhere (matches Temporal `dayOfWeek`).
- **Temporal polyfill weight** (plan §15.10): monitor bundle impact; lazy-load where native.
