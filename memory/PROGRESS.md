# PROGRESS

> Read this first on every restart (Appendix B.4). Then continue from "Next".

## Current phase

**Phase 4 — React (MVP)** STARTED. Phases 0–3 complete. 2m view-registry + store-selection wiring
folded into Phase 4 (per Cutter). See DECISIONS.md (2026-06-02).

### Phase 4 — Task 4a: React test infra + signals→React bridge ✓ (commit f7929a4, pushed)

- **Test infra:** installed `jsdom` + `@testing-library/react` + `@testing-library/dom` (Cutter
  OK'd Testing Library 2026-06-02). `packages/react/vitest.config.ts` → `environment: 'jsdom'`,
  `globals: true`, `setupFiles: ['./vitest.setup.ts']` (afterEach `cleanup()`), includes `.tsx`,
  coverage over `.{ts,tsx}`. Same per-file bar (85% branch / 95% func).
- **`src/internal/useSignalValue.ts`** — the one subscription primitive: `useSyncExternalStore`
  over a `@preact/signals-core` signal; shared client/server snapshot (SSR-safe) reads the signal's
  cached `.value` (stable identity → no Object.is loop). 100% branch/func.
- Added `@preact/signals-core` as a **direct dependency** of `@big-calendar/react` (store's public
  API exposes its `Signal`/`ReadonlySignal` types). Barrel exports `useSignalValue`.
- Tests: 4 (renderHook: read, update, computed, unsubscribe-on-unmount). react: 5 tests total
  (incl. scaffold smoke), typecheck/lint/test/build green.

### Phase 4 — Task 4b: useCalendar headless hook ✓ (commit 7dfbaaa, pushed)

- **DECISION (Cutter 2026-06-02): React state model = HYBRID** (uncontrolled by default, opt-in
  controlled per prop). See DECISIONS.md.
- **`src/useCalendar.ts`** — `CalendarProps<TEvent,TResource>` = `Omit<CalendarConfig,'view'|'date'>`
  + `defaultView`/`defaultDate` (uncontrolled) + `view`/`date` (controlled). `useCalendar(props)`
  creates the store once (ref), syncs controlled `view`/`date` by writing the signals directly (no
  callback re-fire), always syncs `events`/`backgroundEvents`/`resources`, wraps callbacks to read
  latest props, wraps `onRangeChange` only when provided (keeps the range effect off when unused),
  destroys on unmount. Returns the `CalendarStore`.
- **`packages/core/src/types/config.type.ts`** — widened all optional fields to `?: T | undefined`
  (the codebase's exactOptional pass-through convention) so adapters pass props through cleanly.
- Barrel exports `useCalendar` + `CalendarProps`. Tests: 6 (uncontrolled default, controlled
  reflect+update, events sync, uncontrolled action + latest callback, all callbacks forwarded, single
  instance + destroy-on-unmount). react: 11 tests; both src files 100% br/fn. core unaffected (168
  green). typecheck/lint/test/build green across react+core.

### Phase 4 — Task 4c: CalendarProvider + CalendarContext ✓ (commit 2c36865, pushed)

- **DECISION (Cutter 2026-06-02): component/API contract settled** (see DECISIONS.md). Shell = HYBRID
  (`<Calendar>` + standalone exports); override = BOTH (`components` map primary + render-prop escape
  hatch); **context REQUIRED and WRAPS `<Calendar>`** (provider owns the store; `<Calendar>` + siblings
  consume it — `<Calendar>` does not create its own context).
- **`src/CalendarProvider/`** — `calendar.context.ts` (`CalendarContext` = `createContext<CalendarContextValue
  | null>(null)`; value carries **only `store`** for now, per A.6 — `messages`/`components` join when
  Toolbar/Event arrive); `CalendarProvider.component.tsx` (runs `useCalendar(props)`, memoizes
  `{ store }`, publishes via `CalendarContext.Provider` — React-18-safe, not the React-19 `<Context>`
  form); `useCalendarContext.ts` (throws outside a provider → enforces "must be inside a provider" for
  every calendar component); `useCalendarStore.ts` (convenience = `useCalendarContext().store`).
- Barrel exports `CalendarProvider`, `CalendarContext`, `useCalendarContext`, `useCalendarStore` + the
  `CalendarProviderProps`/`CalendarContextValue` types. Tests: 4 (provides store; convenience hook;
  sibling reads state via `useSignalValue`; throws outside provider). react: 15 tests; **100% br/fn/stmt/line**.
  typecheck/lint/test/build green.

### Phase 4 — Task 4d: geometry bridge ✓ (commit cbb574b, pushed)

- **`src/internal/geometry.function.ts`** — core→CSS bridge: `eventBoxStyle`/`segmentStyle`/
  `nowIndicatorStyle`/`selectionStyle` map core's normalized fractions to the documented `--bc-*`
  custom properties (styles/VOCABULARY.md). `StyleWithVars = CSSProperties & Record<\`--${string}\`,
  string|number>` re-permits custom props (csstype rejects them). 4 tests, 100%.

### Phase 4 — Task 4d: core viewLabel + store.label ✓ (commit edbd211, pushed)

- **DECISION (Cutter 2026-06-02): localized labels computed in CORE** (a `label` signal), so every
  adapter renders the identical title. See DECISIONS.md.
- **`packages/core/src/store/viewLabel.function.ts`** — `viewLabel({localizer,view,date,range})`:
  month→`monthHeader`(date), day→`dayHeader`(date), week/work_week/agenda→`monthDay` span. Added
  `label: ReadonlySignal<string>` to the store (computed). Barrel exports `viewLabel`/`ViewLabelArgs`.
  core: 174 tests; viewLabel 100%, store still 100%.

### Phase 4 — Task 4d: Toolbar + components override + messages-in-context ✓ (commit b49ce61, pushed)

- **`src/components.type.ts`** — `CalendarComponents` (override map; starts with `toolbar`, non-generic
  until event-shaped slots land) + `ToolbarProps` (label/view/views/messages/onNavigate/onView).
- **`CalendarProvider` / `calendar.context.ts`** — context value extended to `{ store, components,
  messages }` (A.6: real consumers now exist). Provider resolves `resolveMessages(messages)` and carries
  `components ?? {}`; both stripped from the props passed to `useCalendar`.
- **`src/Toolbar/`** — `Toolbar.component.tsx` (resolves `components.toolbar ?? DefaultToolbar`, feeds
  `useToolbarProps`), `hooks/useToolbarProps.memo.ts` (label/view via signals + bound navigate/setView),
  `components/DefaultToolbar/` (today/prev/next + label + view switcher, `.bc-toolbar*` classes, aria).
  Barrel exports `Toolbar`/`DefaultToolbar`/`CalendarComponents`/`ToolbarProps`. react: 23 tests, 100%.
- **Coverage note:** the per-file/global bar enforces **95% functions** — inline JSX `onClick` arrows
  each count as a function, so every interactive control must be exercised in tests (clicked Today/Back/
  Next + a view button). See ERRORS.md.

### Phase 4 — Task 4e: AgendaView ✓ (commits cfa5d2c core, 980168c react; pushed)

- **DECISION (Cutter 2026-06-02): event TIME strings formatted adapter-side** via a shared tested
  `formatEventTime` helper (not core) — events already reach the adapter; only the localized *label*
  lives in core. Flagged for Cutter; easy to promote later. See DECISIONS.md.
- **`packages/core/src/index.ts`** — re-export `LocalizerContract` (store's public surface; adapters
  need the type without depending on `@big-calendar/localizer`).
- **`src/internal/formatEventTime.function.ts`** — all-day label vs "start – end" (null-safe), `agendaTime`/
  `time` roles. 5 tests, 100%.
- **`src/components.type.ts`** — `CalendarComponents<TEvent>` now generic; added `agenda` slots
  (`date`/`event`/`empty`) + their prop types.
- **`src/AgendaView/`** — `AgendaView.component.tsx` (reads agenda model from context, renders nothing
  outside agenda view, resolves `components.agenda.{date,event,empty}` ?? defaults), `hooks/useAgendaRows.memo.ts`
  (resolves title via accessors + time via formatEventTime), 3 `components/DefaultAgenda*.component.tsx`.
  Barrel exports `AgendaView` + agenda slot types. react: 32 tests, 100% all metrics.

## ⚠ NEXT — Phase 4 remaining build order

1. **MonthView** (segments + geometry: `.bc-month`/subgrid, `segmentStyle` for `.bc-segment`, date cells,
   show-more, drilldown) → **TimeGridView** (event boxes via `eventBoxStyle`, all-day row, now-indicator,
   bg events). Each adds its slots to `CalendarComponents`. Slot names at my discretion (Cutter 2026-06-02).
   ⚠ Heavier localizer fakes needed (month grid / slot metrics) — consider `/compact` before starting.
2. **`<Calendar>`** batteries-included default tree (Toolbar + active view), consuming context.
3. **Top-layer** (§7.5): Popover-API show-more/tooltip + floating-ui positioning.
4. **Selection wiring** (pointer/keyboard → slot coords → core FSM) **+ Storybook docs** (Cutter's ask).
   Plus **2m view registry**. Plus a **coarse-pointer/touch pass on `@big-calendar/styles`** (§7.7).

See [[bigcal-selection-storybook-phase4]].

## Possible next phase

### Phase 3 — Styles ✓ (commits 0f1a20f, ca0f567, 5d3bac6; pushed)

- **`tokens.css`** — full `--bc-*` set (surfaces, event/now/selection colors via `color-mix` over
  system colors for auto light/dark, spacing/typography/border scales, focus ring, density sizing,
  popover elevation), self-wrapped in `@layer bc.tokens` on `:where(.bc-calendar)`.
- **`reset.css`** — opt-in modern reset scoped entirely under `.bc-calendar` (`@layer bc.reset`):
  box-sizing, margin/list/form/button/table normalization, token-driven `:focus-visible`,
  reduced-motion.
- **`layout.css`** (`@layer bc.layout`) — structural grids + the **geometry contract** (documented in
  the file header + VOCABULARY.md): month grid as nested **subgrid** (week rows re-expose 7 cols so
  date cells + multi-day segments align via two overlapping full-width subgrids), time grid
  (gutter + day columns, scrollable slot body, all-day segment row), agenda rows, toolbar/header flex,
  now-indicator + selection overlays. Event boxes from `--bc-top/height/left/width` fractions;
  segments from `--bc-seg-left/span/row` grid spans; **logical properties** throughout; **container
  queries** (`@container bc`) for responsive collapse (long↔short weekday names, gutter shrink).
- **`components/*.css`** (`@layer bc.components`) — visual skin only, all via tokens: toolbar, month
  (date cells/today/off-range/show-more), timegrid (headings, gutter labels, slot-line gradient,
  now-knob), event (timed/segment/bg/selected/title/time), agenda, popover (native `[popover]` +
  `:popover-open`, `::backdrop`), selection.
- **`index.css`** — declares the `bc.reset,tokens,layout,components,theme,overrides` layer order then
  plain-imports every self-layered file. **`package.json`** exports add `./components/*.css`.
- **`VOCABULARY.md`** — the class-name + geometry-custom-prop contract the React layer will consume.
- **`spike/index.html`** — static visual spike rendering month / time-grid / agenda from representative
  core geometry (link `../dist/index.css`; `nx build styles` first). RTL via `:dir()` + logical props
  (no `rtl` prop); top layer via native Popover; positioning later via floating-ui (Phase 4).
- **Gate:** `nx build styles` green (copies src→dist incl. components/); CSS brace/paren-balanced.
  **Caveat:** no browser/visual-regression run in this environment — the spike is authored but not
  empirically rendered here; real visual + the deferred Phase-1 subgrid/anchor Playwright check land in
  Phase 4/7. No CSS linter is configured (ESLint is TS-only).

---

## (historical) Phase 2 — Core engine sub-task log

Phase 2 is split into PR-sized sub-tasks (2a…2l); see the log below.

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

### Phase 2 — Task 2f: time-grid view model + slot metrics ✓ (commit b881720, pushed)

- **`src/views/segments.{type,function}.ts`** (NEW shared module, extracted from 2e's month):
  `EventSegment<TEvent>`, `SegmentRows<TEvent>`; `DatedEvent<TEvent>`, `datedEvents` (resolve
  start/end/allDay via accessors, drop unresolved), `segsOverlap`, `eventSegments` (clamp event to a
  row of N days → 1-based columns), `stackIntoLevels` (limit → `extra` overflow), `sortRowEvents`
  (multi-day first), and `rowSegments` (filter→sort→segment→stack for one row of days). Used by BOTH
  the month grid (one call per week) and the time-grid all-day header (one call across all visible days).
- **`src/views/month.{function,type}.ts`** REWRITTEN to consume `datedEvents`/`rowSegments`;
  `MonthSegment<TEvent>` is now an alias of `EventSegment<TEvent>`. Behaviour unchanged (2e tests green).
- **`src/timegrid/slotMetrics.{type,function}.ts`** — `createSlotMetrics({ localizer, min, max, step=30,
  timeslots=2 })` ports v1 `getSlotMetrics` to **fractions 0..1** (not %): `numSlots`/`totalMin`/`slots`
  (incl. closing boundary, each rebuilt from midnight via `getSlotDate` for DST safety), `getRange`
  ({start,end,ignoreMin?,ignoreMax?} → `{top,height,start,end,startDate,endDate}`; overrun nudge +
  `getDstOffset` correction), `getCurrentTimePosition`.
- **`src/timegrid/timeGrid.{type,function}.ts`** — `timeGridViewModel({ localizer, accessors, days,
  events, dayStartMin=0, dayEndMin=1440, step, timeslots, dayLayoutAlgorithm='overlap', allDayMaxRows,
  showMultiDayTimes })` → `{ days, columns: TimeGridColumn[], allDay: SegmentRows }`. Splits events
  into all-day (explicit allDay | date-only | multi-day-without-showMultiDayTimes — v1 rule) vs timed;
  all-day → `rowSegments`; per day builds slot metrics over `[dayStartMin,dayEndMin]`, positions timed
  events (`getRange` → `top/height`, minutes → `start/end`), packs via `resolveDayLayoutAlgorithm`
  (minimumStartDifference = `ceil(step*timeslots/2)`), maps boxes back to `PositionedEvent<TEvent>`.
- Barrel exports segments (types + `datedEvents`/`rowSegments`), slot metrics, time-grid model + types.
- Tests: slot metrics (5) + time-grid (7). 117 tests total; every file clears the per-file bar
  (total 94.67% branch / 100% func). typecheck/lint/build green.
- **Follow-ups noted:** the time-grid model takes window as `dayStartMin`/`dayEndMin` (minutes) for
  purity — the store-config integration (config `min`/`max` Date/string → minutes, plus a
  `dayLayoutAlgorithm`/`step`/`timeslots` config option + derived view-model signals) is a later
  wiring task. Background events not yet positioned (foreground timed + all-day only).

### Phase 2 — Task 2g: agenda view model + resource grouping ✓ (commit 42b497c, pushed)

- **`src/views/agenda.{type,function}.ts`** — `AgendaDay<TEvent>` (`day`, `events`),
  `AgendaViewModel<TEvent>` (`days`); `agendaViewModel({ localizer, accessors, days, events })` sorts
  the dated events once (`localizer.sortEvents`), then for each visible day emits `{ day, events }`
  only when that day has events touching it (`inEventRange` over `[startOf(day), +1 day)`). Empty days
  omitted (v1 parity); multi-day events repeat on each day they span.
- **`src/resources/resources.{type,function}.ts`** — `ResourceGroup<TEvent, TResource>`
  (`resource`/`resourceId` nullable, `events`); `groupEventsByResource({ events, resources, accessors })`
  → one `null` group with all events when `resources` is undefined, else one group per resource (in
  order) with events bucketed by `accessors.resource` (single id or array → each matching group;
  unmatched dropped). Pure port of v1 `Resources.groupEvents`; reusable across resource-aware views.
- Barrel exports `agendaViewModel`/agenda types and `groupEventsByResource`/`ResourceGroup`.
- Tests: agenda (4) + resources (4). 133 tests total; every file clears the per-file bar
  (total 94.91% branch / 100% func). typecheck/lint/build green.

### Phase 2 — Task 2h: slot-selection FSM ✓ (commit b68fde8, pushed)

- **`src/selection/selection.{type,function}.ts`** — `createSelection({ selectable?, onSelecting?,
  onSelect? })` → `SelectionController`: a pure `@preact/signals-core` FSM over **slot indices**
  (`SelectionState` = `{idle}` | `{selecting, anchor, head}`). Actions: `start`/`to`/`complete`
  (drag via pointer or keyboard Shift+Arrow), `click` (single slot), `cancel`. `onSelecting` fires on
  every range change and vetoes when it returns `false` (start dropped / head left unchanged);
  `onSelect` fires on commit with `{ start, end, action: 'select' | 'click' }`. `range` is a
  `ReadonlySignal<SelectionRange | null>` (normalized min/max) for the live highlight overlay.
  `selectable: false` disables; `'ignoreEvents'` treated as enabled (the over-event decision is
  adapter-side). Types: `SelectableMode`, `SelectAction`, `SelectionRange`, `SlotSelection`,
  `SelectionState`. (Renamed range type to `SelectionRange` to avoid colliding with slot-metrics'
  `SlotRange`.)
- Barrel exports `createSelection` + `SelectionController` + the selection types.
- Tests: 11 cases (idle, drag+normalize, commit, onSelecting fires/vetoes start+extend, ignores
  to/complete when idle, click, cancel, selectable:false, 'ignoreEvents'). 144 tests total; file
  100% branch/func. typecheck/lint/test/build all green.
- **Note:** keyboard movement is `to({ slot })` (adapter computes the target slot + bounds); no core
  timers (long-press is adapter timing). The selection-only slot-metric helpers
  (`closestSlot*`/`nextSlot`/`dateIsInGroup`) were NOT needed by this index-based FSM — defer until an
  adapter needs pixel/point→slot mapping.

### Phase 2 — Task 2i: messages map ✓ (commit 1b4ad37, pushed)

- **`src/messages/messages.{type,function}.ts`** — `Messages` interface (all UI/ARIA strings, v1
  parity incl. `work_week` + `showMore(total)` fn), `DEFAULT_MESSAGES` (English), `resolveMessages`
  (merge overrides over defaults, no mutation). Barrel exports all three. Tests: 4. 148 tests total;
  file 100% branch/func.

## Phase 2 pure-logic sub-tasks 2a–2i: COMPLETE ✓

All the standalone pure pieces are done (constants/accessors, store factory, navigation/drilldown/
range, layout algos, month + time-grid + agenda view models, resource grouping, selection FSM,
messages). What remains to satisfy the Phase-2 exit (§4.2 store shape + §9 logic) is INTEGRATION:

### Phase 2 — Task 2j: store view-model integration ✓ (commit e3909c4, pushed)

- **`src/views/viewModel.{type,function}.ts`** — `CalendarViewModel<TEvent>` discriminated union
  (`{kind:'month',view,month}` | `{kind:'time',view,timeGrid}` | `{kind:'agenda',view,agenda}`),
  `ViewModelOptions` (step/timeslots/dayStartMin/dayEndMin/dayLayoutAlgorithm/allDayMaxRows/
  showMultiDayTimes/weekEventLimit, all `| undefined`), and `buildViewModel({ localizer, accessors,
  view, days, events, options? })` — exhaustive `switch (view)` dispatching to the month / time-grid /
  agenda builders. Since `days` is passed in, the builders need only day+minute localizer methods
  (no viewRange dep).
- **`src/types/config.type.ts`** — added parity options: `step`, `timeslots`, `min`, `max` (datetime
  strings; only time-of-day used; midnight `max` = end-of-day), `dayLayoutAlgorithm`, `allDayMaxRows`,
  `showMultiDayTimes`, `showAllEvents`, `selectable`. (Removed the stale "Phase 2b surface" note.)
- **`src/store/store.type.ts` + `createCalendarStore.function.ts`** — added
  `viewModel: ReadonlySignal<CalendarViewModel<TEvent>>`, a computed over view/range/events/config.
  Store resolves `min`/`max` → `dayStartMin`/`dayEndMin` minutes via `getMinutesFromMidnight`
  (`max` 00:00 → 1440), and folds `showAllEvents` into the all-day row limit (`allDayMaxRows`).
- Barrel exports `buildViewModel` + `CalendarViewModel`/`ViewModelOptions`.
- Tests: buildViewModel (5, pure) + store viewModel (4, via a combined time+range localizer fake
  `{...makeTimeLocalizer(), ...makeRangeLocalizer(1)}`). 166 tests total; every file clears the bar
  (total 94.78% branch / 100% func). typecheck/lint/test/build green.
- **Notes:** month `weekEventLimit` is left unlimited from the store (month "+N more" overflow is
  adapter-measured — core can't know cell height); call `monthViewModel` directly with a measured
  limit if needed. `selectable` config added but not yet consumed (next task).

### Phase 2 — Task 2l: background events in time-grid ✓ (commit a651ee7, pushed)

- **`src/timegrid/timeGrid.{type,function}.ts`** — `timeGridViewModel` now accepts
  `backgroundEvents?` and each `TimeGridColumn` carries `backgroundEvents: PositionedEvent[]`,
  positioned full-width behind the foreground (`top`/`height` from slot metrics, `left:0`/`width:1`,
  `zIndex:0`, no overlap packing) — v1 parity. Threaded through `buildViewModel` (new
  `backgroundEvents?` arg) and the store's `viewModel` computed (`backgroundEvents.value`).
- Tests: +2 (positions bg full-width; defaults to empty). 168 tests; all files clear the bar.
  typecheck/lint/test/build green.

## In progress

- (none)

## Phase 2 status

Concrete core logic is COMPLETE and pushed: constants/accessors, store factory + navigation/
drilldown/range, layout algos, all 5 view models (month / time-grid day-week-work_week / agenda),
resource grouping, selection FSM, messages, derived `viewModel` store signal + parity config,
background events. 168 Vitest cases, every file ≥85% branch / ≥95% func, build green.

## Next — open design decisions (do NOT guess; confirm with Cutter first)

1. **2m — view registry (custom views, §9)** — DEFERRED pending design input. The 5 built-in views are
   hardcoded across `viewRange` (range), `navigateDate` (navigate) and `buildViewModel` (model kind).
   A registry would map a (widened, `string`) `ViewKey` → `{ navigate, range, model-kind/builder }`.
   The sticking point is the **model shape for a custom view**: `CalendarViewModel` is a closed union
   (`month|time|agenda`); custom views need either a generic/escape-hatch model kind or a
   plugin-provided builder. This is coupled to the **framework view-component contract** (Phase 4), so
   building it now risks the wrong abstraction (CLAUDE.md: simplest-first, no speculative abstractions,
   ask before architectural changes). **Decision needed:** define the custom-view model contract now,
   or defer 2m until the React view-component contract exists in Phase 4.
2. **Store-level selection wiring** — the selection FSM (2h) is the core logic. Mapping slot indices →
   dates is view/adapter-specific (month = day cells; time-grid = (column, slot) 2D), so the store/
   `beginSlotSelection` wiring is better done alongside the adapter (Phase 4). Confirm this split.

## Possible next phase

**Phase 3 — Styles** (`@big-calendar/styles`): reset, `--bc-*` tokens, `@layer`s, container-query
layout, logical props, `:dir()` RTL, granular exports; visual spike renders all views from core
geometry. (Per §14 roadmap; begins after Phase 2 sign-off.)

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
