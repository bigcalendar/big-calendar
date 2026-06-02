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

### Phase 2 — Task 2b: store factory ✓ (commit 19a912f, pushed)

- **`src/types/config.type.ts`** — `CalendarConfig<TEvent, TResource>` (Phase-2b subset: localizer
  required, events/backgroundEvents/resources, view/date, accessor overrides, `getNow`, `length`,
  `onNavigate`/`onView`/`onSelect`). Parity-complete options (`step`/`timeslots`/`min`/`max`/`selectable`/…)
  added by the tasks that consume them.
- **`src/store/store.type.ts`** — `CalendarStore` interface: state signals
  (`date`/`view`/`selected`/`events`/`backgroundEvents`/`resources`), resolved `localizer`+`accessors`,
  and named-parameter actions (`navigate`/`setView`/`setDate`/`select`/`setEvents`/`setBackgroundEvents`/
  `setResources`/`destroy`).
- **`src/store/navigateDate.function.ts`** — pure `navigateDate`: TODAY→`getNow()`, DATE→`target`,
  PREV/NEXT→one view-sized step (month/week/day; agenda by `length`, default 30). All math via the
  localizer. Note: pass-through optionals (`target`/`length`) typed `| undefined` for
  `exactOptionalPropertyTypes`.
- **`src/store/createCalendarStore.function.ts`** — the factory: validates the localizer, resolves
  accessors, seeds signals from config (defaults applied), wires actions + the optional callbacks.
  `destroy()` runs a disposers array (empty in 2b; ready for effects). 100% branch/function coverage.
- Default "now" = `new Date().toISOString()` (UTC RFC 3339) — the one place core touches `Date`, and
  only to produce a string the localizer then interprets.
- Barrel exports `createCalendarStore`, `navigateDate`, `CalendarStore`, `CalendarConfig`.

### Phase 2 — Task 2c: navigation refinements ✓ (commit cd579c9, pushed)

- **`src/store/viewRange.function.ts`** — pure `viewRange({ localizer, date, view, length })` →
  `VisibleRange` (`firstVisibleDay`/`lastVisibleDay`/`days`, all day-start strings). Mirrors v1 per-view
  `range` statics: month = padded grid (localizer `firstVisibleDay`/`lastVisibleDay`/`visibleDays`);
  week = the date's week; work_week = week minus Sat/Sun (weekday derived by offset from
  `firstDayOfWeek()`, so no per-date weekday lookup is needed); day = single floored day; agenda =
  `length` days from the date (default 30). Uses `min`/`max` for bounds to avoid index assertions.
- **`src/store/drilldown.function.ts`** — `GetDrilldownView` type + pure `resolveDrilldownView(...)`:
  defer to `getDrilldownView` when present (its nullish result disables drilldown), else the static
  `drilldownView` (which may be `null` to disable). Matches v1 `Calendar.getDrilldownView`.
- **`src/types/calendar.type.ts`** — added `VisibleRange`.
- **`src/constants/views.constant.ts`** — added `BUILTIN_VIEWS = Object.values(Views)` (drilldown needs
  the view list).
- **`src/types/config.type.ts`** — added `drilldownView?` (`ViewKey | null`, default `day`),
  `getDrilldownView?`, `onRangeChange?`, `onDrillDown?`.
- **`src/store/store.type.ts`** — added `range: ReadonlySignal<VisibleRange>` and the `drilldown({ date })`
  action.
- **`src/store/createCalendarStore.function.ts`** — `range` computed (date+view → `viewRange`);
  `onRangeChange` wired via an `effect` that **skips the initial run** (parity: v1 fires only on
  navigate/view change), registered in `disposers` so `destroy()` now actually tears something down;
  `drilldown` resolves the target view then either delegates to `onDrillDown` or, in a `batch`,
  switches view (firing `onView` only when it changes) + sets date + fires `onNavigate`. Navigate/
  setView/setDate now all trigger `onRangeChange` for free via the effect.
- Tests: `viewRange` (7) + `resolveDrilldownView` (4) + store range/drilldown/onRangeChange (8). New
  fuller UTC fake `makeRangeLocalizer(firstDayOfWeek)` lives in `viewRange.function.test.ts` (out of
  coverage), imported by the store test. 72 tests, **100% stmt/branch/func/line**. typecheck/lint/build green.
- Barrel exports `viewRange`, `resolveDrilldownView`, `BUILTIN_VIEWS`, `VisibleRange`, `GetDrilldownView`.

### Phase 2 — Task 2d: layout algorithms ✓ (commit 63acdbc, pushed)

- **`src/layout/layout.type.ts`** — `DayLayoutEvent` (`id`, numeric `start`/`end`, fraction
  `top`/`height`), `DayLayoutBox` (`id`, `top`/`height`/`left`/`width` fractions, `zIndex`),
  `DayLayoutArgs` (`events`, `minimumStartDifference`), `DayLayoutAlgorithm` fn type,
  `DayLayoutAlgorithmKey` (`'overlap' | 'no-overlap'`). Vertical placement is an INPUT (slot
  metrics own it, Task 2f); the algorithms only compute horizontal packing.
- **`src/layout/overlap.function.ts`** — faithful v1 `overlap` port: `sortByRender` (start asc,
  longer first, groups pulled contiguous), then container→row→leaf grouping; widths grow ×1.7
  (capped) for the dense Google-style overlap. Output in paint order; `zIndex` = render index.
  All fractions (v1's 0–100 → 0..1).
- **`src/layout/noOverlap.function.ts`** — v1 `no-overlap` port, fraction-based: builds a
  vertical-overlap "friends" graph, assigns each event the lowest free column, splits each
  connected component evenly, stretches the right-most column to the edge. Drops v1's pixel
  `calc()` padding (React layer adds gaps). `minimumStartDifference` unused here.
- **`src/layout/dayLayout.function.ts`** — `DEFAULT_DAY_LAYOUT_ALGORITHMS` registry +
  `resolveDayLayoutAlgorithm(key | fn)` (defaults to `overlap`; unknown key → `overlap`).
- Barrel exports all of the above (fns + types). **Deleted** the scaffold `smoke.test.ts`.
- Tests: overlap (10) + no-overlap (6) + resolver (5). 92 tests total; coverage clears the
  per-file bar (overlap 86.66% branch after covering the multi-leaf grow + onSameRow second-clause
  + second-row paths; others 100%). typecheck/lint/build green.
- **Note:** these consume `start`/`end`/`top`/`height` the time-grid will produce in 2f; 2f wires
  `resolveDayLayoutAlgorithm` + a `dayLayoutAlgorithm` config option (not added yet — added by 2f).

### Phase 2 — Task 2e: month view model ✓ (commit fa78b10, pushed)

- **`src/views/month.type.ts`** — `MonthSegment<TEvent>` (`event`, `span`, 1-based `left`/`right`
  day columns), `MonthWeek<TEvent>` (`days`, `levels: MonthSegment[][]`, `extra`),
  `MonthViewModel<TEvent>` (`weeks`).
- **`src/views/month.function.ts`** — `monthViewModel({ localizer, accessors, days, events,
  weekEventLimit? })`: chunks `days` (the padded grid, e.g. `store.range.value.days`) into weeks of
  7; per week filters overlapping events (`inEventRange`), sorts (multi-day first then single, via
  `localizer.sortEvents`), clamps each to day-column segments (`eventSegments`, ports v1 minus the
  `segmentOffset` tz hack), and stacks them into non-overlapping `levels` with overflow into `extra`
  once `weekEventLimit` rows are full (default `Infinity` = no limit). Internal helpers
  `segsOverlap`/`eventSegments`/`stackIntoLevels`/`sortWeekEvents` are private (not exported).
  Reads event fields via `wrapAccessor(accessors.start|end|allDay)`; events with unresolved
  start/end are skipped.
- Barrel exports `monthViewModel` + the three month types.
- Tests: 8 cases (week chunking, single-day column/level, week-spanning → one segment per week,
  level sharing vs stacking, limit→extra overflow, skips unresolved events, multi-day sorts first)
  via a compact UTC localizer double in the test file. 100 tests total; month.function.ts 94.11%
  branch / 100% func. typecheck/lint/build green.

## In progress

- (none — tasks 2a–2e committed + pushed; pick up 2f next)

## Next

Phase 2 sub-tasks, in order (PR-sized; `/compact` between them per Appendix B.3/B.5):

1. **2f — time-grid (day/week/work_week) view models** (slot metrics → `top`/`height` fractions,
   then wire `resolveDayLayoutAlgorithm` + a `dayLayoutAlgorithm` config option; also the week
   all-day header row can reuse the month segmentation helpers — consider exporting them then);
   **2g — agenda view model + resource grouping**.
2. **2h — selection FSM** (pointer + keyboard, §8.2); **2i — messages map** (English defaults, overridable).

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
