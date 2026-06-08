# PROGRESS

> Read this first on every restart (Appendix B.4). Then continue from "Next".

## Current phase

**Phase 4 — React (MVP)** STARTED. Phases 0–3 complete. 2m view-registry + store-selection wiring
folded into Phase 4 (per Cutter). See DECISIONS.md (2026-06-02).

### Phase 4 — Slot/event handler separation + move-to-core (Cutter, 2026-06-07) ✓ (uncommitted at time of writing)
Cutter's separation-of-concerns refactor. **Slot** and **event** interaction are now two distinct,
focused concerns, both **core-owned** (framework-agnostic), with the React layer reduced to a dumb
DOM→core translator. No noop handlers anywhere — core fires a callback only when defined.
- **Renames (breaking public API):**
  - event-selection action `store.select({id})` → **`store.selectEvent({id})`**; notify `onSelect` → **`onEventSelect`**.
  - slot live callback `onSelecting` → **`onSlotSelecting`**.
  - committed slot callback `onSelectSlot` (single, with `action`) **split** into **`onSlotClick` /
    `onSlotDoubleClick` / `onSlotSelect`** — *which* fires encodes the gesture; the `action` field was
    **removed** from `SlotSelectionDates`. (Symmetric with `onEventClick`/`onEventDoubleClick`.)
- **Event handlers moved INTO core** (`CalendarConfig`): `onEventClick` / `onEventDoubleClick` /
  `onEventRightClick` / `onEventMiddleClick`. `domEvent` is the **global `MouseEvent`** (web standard via
  the DOM lib already in `tsconfig.base`), NOT React's synthetic — the React adapter passes `e.nativeEvent`.
  This is the first DOM *type* in core (no DOM *listeners* in core).
- **New `store.eventHandlers`** (`EventHandlerApi<TEvent>`, exported): `has` / `hasRightClick` /
  `hasMiddleClick` presence flags + `click` / `doubleClick` / `rightClick` / `middleClick` methods that
  fire the configured callback if defined. **`click` does NOT select** — selection is composed separately:
  grid `EventButton` calls `store.selectEvent({id})` + `eventHandlers.click(event)`; the agenda (no
  selection) calls `eventHandlers.click(event)` alone. Presence resolved once at store creation.
- **React adapter thinned:** `CalendarProvider` no longer wraps/tracks event handlers (flow straight
  through `...props` → `useCalendar` → core config, stable via the existing ref). Context dropped its
  `onEvent*`/`hasEventHandler` fields. `EventButton`/`AgendaEventButton` read `store.eventHandlers`.
  `CalendarProps` inherits the handler types from `CalendarConfig` (declarations deleted from useCalendar.ts).
- Gates: typecheck core+react ✓; tests core 151 + react 151 ✓; per-file coverage all touched files clear
  (EventButton 100fn/96.7br, AgendaEventButton 100/100, CalendarProvider 100/100, calendar.context 100/100,
  useCalendar 95/96.9, createCalendarStore 97.1/91.4); lint ✓; build-storybook core+react ✓.
- Tests: split-callback tests use a `slotSpy()` helper (fans `onSlotClick`/`onSlotDoubleClick`/
  `onSlotSelect` into one spy, re-injecting `action`) so the existing gesture assertions stay expressive.

### Phase 4 — Event double-click also selects (Cutter, 2026-06-07) ✓ (uncommitted at time of writing)
Resolves the carried "double-click-also-selects" open item (Cutter: "Double click of an event does 'select'").
- **`EventButton`** — factored a shared `select()` (the `selectEvent({id})` step); now called by **both**
  `primary()` (click · Enter · Space) and `secondary()` (double-click · F2). Grid views select on either
  gesture; `eventHandlers.click`/`doubleClick` still don't select (core stays selection-agnostic). **Agenda
  unchanged** — still the no-selection exception (`AgendaEventButton` calls `eventHandlers.doubleClick` alone).
- **Also reconfirmed:** the previously-flagged `useSlotSelection.test.tsx:282-283` typecheck failure is GONE
  (resolved when the separation refactor edited that file) — `nx typecheck core react` clean, no fix needed.
- **Tests/docs:** EventButton double-click + F2 tests assert `aria-selected === 'true'`; `Selection.mdx` F2
  row + a new note document that both grid gestures select (agenda excepted).
- **Gates:** typecheck core+react ✓; core 151 + react 151 ✓; lint ✓; react build-storybook ✓.

### Phase 4 — Task 2m: view registry (custom views, §9) — CORE ✓ (Cutter, 2026-06-07) (uncommitted at time of writing)
Implements the locked **Option B** contract (DECISIONS.md 2026-06-05). Custom views are now a first-class
**core** escape hatch; the 5 built-ins stay hardcoded and the registry is consulted **only** in each seam's
`default` branch. **React rendering of a custom view is intentionally NOT in this change** — that needs the
React view-component contract decision (surfaced to Cutter; see "open design decisions" below).
- **`ViewKey` widened** `BuiltinViewKey → BuiltinViewKey | (string & {})` ([calendar.type.ts](packages/core/src/types/calendar.type.ts)) —
  keeps built-in literal autocomplete while admitting custom keys. Cost (accepted): each seam loses
  exhaustive-`switch` safety → every seam gained a runtime `default` (registry lookup or throw).
- **`CalendarViewModel` gained one additive arm** `{ kind: 'custom'; view: ViewKey; model: unknown }`
  ([viewModel.type.ts](packages/core/src/views/viewModel.type.ts)). `model` is `unknown` in the union; the
  matching view-component re-asserts its `TModel`.
- **New registry types** ([viewRegistry.type.ts](packages/core/src/views/viewRegistry.type.ts)):
  `ViewDefinition<TEvent,TResource,TModel>` (4 pure fns `range`/`navigate`/`label`/`buildModel`),
  `ViewRegistry<TEvent,TResource>` (`Record<string, ViewDefinition>`), arg types, and `ViewRegistrySeams`
  (the `range`/`navigate`/`label` slice — no `TEvent` — so the non-generic seam fns accept a registry without
  dragging `TEvent` through their signatures). **`defineView<TEvent,TResource>()(def)`**
  ([viewRegistry.function.ts](packages/core/src/views/viewRegistry.function.ts)) — identity helper that infers
  `TModel` from `buildModel`.
- **Four seams threaded** (each: `registry?` param + `default` branch → `registry[view].<fn>(...)` or throw):
  `viewRange`, `navigateDate` (`stepFor` now returns `undefined` for non-built-ins → defers PREV/NEXT to
  the definition; TODAY/DATE stay universal), `viewLabel`, `buildViewModel` (also gained `date`/`resources`
  params forwarded to a custom `buildModel`).
- **Config + store:** `CalendarConfig.views?` ([config.type.ts](packages/core/src/types/config.type.ts));
  `createCalendarStore` threads `config.views` into all four seam calls (+ `date`/`resources` into the
  viewModel computed). Barrel exports `defineView` + the registry types (`ViewLabelArgs` aliased to
  `ViewDefinitionLabelArgs` to avoid clashing with the store's existing `ViewLabelArgs`).
- **React fallout fixed (caused by the widening):** `DefaultToolbar` indexed `messages[option]` with a now-
  `string` `ViewKey` → added `viewButtonLabel(messages, view)` = localized message for a built-in, else the raw
  view key. `<Calendar>` uses boolean `kind ===` checks so the new `custom` kind didn't break it (it renders
  nothing for a custom view — the React render path is the pending decision).
- **Tests:** new [viewRegistry.function.test.ts](packages/core/src/views/viewRegistry.function.test.ts) — a
  demo "3-day" custom view exercises all four seam custom branches + every unknown-view throw + `defineView`
  + a store integration (range/label/viewModel/navigate). core **163 tests**.
- **Gates:** typecheck/test/lint/build core ✓; typecheck/test 151/lint/build react ✓; build-storybook
  core+react ✓. Per-file bar enforced by the test target (green).

### Phase 4 — Task 2m: view registry — REACT render path (Option A, Cutter 2026-06-07) ✓ (uncommitted at time of writing)
Cutter chose **Option A — `components.views` map** (AskUserQuestion 2026-06-07), mirroring the existing
component-override pattern; core config stays React-free. Completes 2m end-to-end.
- **`CalendarComponents.views?: Record<string, ComponentType<CustomViewProps>>`** + new exported
  `CustomViewProps { view: ViewKey; model: unknown }` ([components.type.ts](packages/react/src/components.type.ts)).
  The component **receives `{ view, model }` as props** (a small refinement over the context-read sketch in the
  AskUserQuestion preview — props are more ergonomic/testable) and casts `model` to its `TModel`.
- **`<Calendar>` dispatch** ([Calendar.component.tsx](packages/react/src/Calendar/Calendar.component.tsx)):
  reads `components` from context; for `viewModel.kind === 'custom'` looks up `components.views?.[viewModel.view]`
  and renders it inside `.bc-calendar` with `{ view, model }`; renders **nothing** when no component is
  registered for the key. Barrel exports `CustomViewProps`.
- **Tests:** +2 Calendar ([Calendar.component.test.tsx](packages/react/src/Calendar/Calendar.component.test.tsx)) —
  a demo "3-day" `defineView` + component renders via `components.views` (model reaches the component:
  `data-day-count="3"`, no built-in view renders), and renders nothing when the component is unregistered.
- **Storybook:** new `React/Calendar → CustomView` story (3-day custom view, model → React list).
- **Gates:** react typecheck/test (153)/lint/build ✓; build-storybook react ✓. **2m fully done** (core + React).

### Phase 4 — §7.7 coarse-pointer / touch CSS pass (Cutter, 2026-06-07) ✓ (uncommitted at time of writing)
The styles-side of §7.7 (the touch *behaviour* — long-press, `touch-action: pan-y` on the time body — already
shipped with selection wiring). **CSS/docs only**, no JS, no new unit tests (jsdom has no box model / media
emulation; verified via `build-storybook`).
- **`--bc-touch-target` token** ([tokens.css](packages/styles/src/tokens.css)) — default `2.75rem` (44px), the
  WCAG 2.5.5 / platform touch floor.
- **`components/coarse-pointer.css`** (NEW, `@layer bc.components`, imported last in
  [index.css](packages/styles/src/index.css)) — a `@media (pointer: coarse), (hover: none)` block that grows the
  **discrete** controls to `--bc-touch-target`: `.bc-toolbar button`, the `.bc-date-number` / `.bc-day-heading`
  drilldowns, `.bc-show-more`, `button.bc-agenda-event`. **Geometry-sized event boxes + slot cells are
  deliberately NOT enlarged** (their size encodes duration / the slot grid; enlarging breaks layout) — their
  actions stay reachable by tap / long-press. No hover-only affordances (show-more/popover/tooltip all open on tap).
- **`touch-action: pan-y`** added to the other two selectable surfaces — `.bc-month-grid` + `.bc-allday-row`
  ([layout.css](packages/styles/src/layout.css)) — matching the existing `.bc-time-body`, so a day-mode drag
  doesn't fight native scroll/zoom.
- **VOCABULARY.md** gained a "Touch & coarse pointer (§7.7)" section documenting the token, the coarse file, and
  the touch-action surfaces.
- **styles dist rebuilt** (`nx build styles` = src→dist copy; coarse-pointer.css + its `@import` present in dist).
- **Gates:** `nx build styles` ✓; `build-storybook react` ✓ (consumes `@big-calendar/styles/index.css`).
- **Note (deferred, not this scope):** the Playwright touch-emulation visual/a11y gate (§7.7 bullet) is a CI
  concern not runnable in this environment; drag-handle `touch-action: none` belongs to `@big-calendar/dnd`
  (not built yet).

### Phase 4 — Selection Storybook split docs (Cutter, 2026-06-07) ✓ (uncommitted at time of writing)
Satisfies the carried Phase-4 obligation [[bigcal-selection-storybook-phase4]] — the React Storybook MUST
clearly document the **core-FSM ↔ adapter-mapping** selection split. **Docs only** (no code).
- **`Selection.mdx`** gained a new **"Architecture: core FSM ↔ adapter mapping"** section (added after the
  existing "Under the hood" — existing prose left intact): a 3-layer table (1 core `createSelection` FSM in
  slot-index space · 2 store index→ISO-date translation · 3 the React adapter, the only DOM-touching layer),
  the **round-trip** for a pointer drag (pointerdown→`start`, move→`to`+`onSlotSelecting` veto, up→`complete`),
  the keyboard path driving the *same* FSM (`useRovingSelection`), and **why** the split (one behaviour/many
  adapters, isolation testing, each view owns its geometry/`neighbor` map).
- **`SelectionContract.mdx`** (core) gained a pointer to the React Architecture section from its "Why
  translation lives in core" section.
- **Gates:** build-storybook core + react ✓ (MDX validated).

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

### Phase 4 — Task 4f: MonthView ✓ (commit on feat/initial; pushed)

- **DECISION (Cutter 2026-06-03): per-day "now" source = `store.getNow()`** (exposed on the public
  `CalendarStore`, sibling to `localizer`/`accessors`). Adapters derive today / now-indicator state
  themselves; off-range is an adapter-side localizer month-compare vs the focus date. Chosen over
  enriching every view model with `isToday`/`isOffRange` (keeps view-model shapes lean). See DECISIONS.md.
- **core** — `store.getNow()` added to `CalendarStore` + returned by `createCalendarStore`. **Plus**
  surfaced `config.weekEventLimit` and threaded it into the `viewModel` computed (was plumbed through
  `monthViewModel`/`buildViewModel` but the store never passed it → the month overflow path was
  unreachable). Flagged to Cutter; updates the stale 2j "weekEventLimit left unlimited" note below.
- **`src/internal/geometry.function.ts`** — added `monthGridStyle(weekCount)` → `--bc-week-count`.
- **`src/components.type.ts`** — `CalendarComponents.month` (`MonthComponents<TEvent>`): slots
  `weekday`/`dateCell`/`event`/`showMore` + their prop types.
- **`src/MonthView/`** — `MonthView.component.tsx` (renders `.bc-month` header + grid, resolves the 4
  month slots ?? defaults, wraps each event in a `.bc-segment` carrying `segmentStyle`, date cells
  drill down on click, per-week `.bc-show-more`), `hooks/useMonthWeeks.memo.ts` (resolves the month
  model → weekday headings + day cells with today/off-range + placed segments + overflow), 4
  `components/DefaultMonth*.component.tsx`. Barrel exports `MonthView` + month slot types.
- **Gates:** react 38 tests (100% stmt/fn/line, 98.66% branch overall; hook 91.66% branch — one
  defensive `?? ''` fallback unreachable, >85% bar). core 174 green. typecheck/lint/build green.

### Phase 4 — Task 4g: TimeGridView ✓ (commit on feat/initial; pushed)

- **DECISION (2026-06-03): expose resolved `store.step` / `store.timeslots`** on the public
  `CalendarStore` (sibling to `getNow`). Needed so the adapter can rebuild `createSlotMetrics` on
  today's column and place the now-line on the *same vertical span* the model used for event boxes
  (`span = step * numSlots`, which can exceed the raw window). Resolved once in `createCalendarStore`
  (`config.step ?? 30`, `config.timeslots ?? 2`) and also threaded into the viewModel options as the
  single source of truth. Additive; flagged to Cutter. See DECISIONS.md.
- **core** — `step` / `timeslots` added to `CalendarStore` + returned by `createCalendarStore`.
- **`src/internal/geometry.function.ts`** — added `dayCountStyle(n)` → `--bc-day-count` and
  `slotCountStyle(n)` → `--bc-slot-count`.
- **`src/components.type.ts`** — `CalendarComponents.time` (`TimeComponents<TEvent>`): slots
  `dayHeading`/`timeLabel`/`event`/`allDayEvent`/`showMore` + their prop types.
- **`src/TimeGridView/`** — `TimeGridView.component.tsx` (renders `.bc-time-grid` → `.bc-time-header`
  + `.bc-allday-row` + `.bc-time-body`/`.bc-time-gutter`/`.bc-day-column`; timed boxes are `.bc-event`
  carrying `eventBoxStyle`, all-day events wrap in `.bc-segment`, bg events are `.bc-bg-event`,
  now-line is `.bc-now-indicator` on today only), `hooks/useTimeGrid.memo.ts` (resolves the time-grid
  model → headings + gutter labels + slot count + per-column events/bg/nowTop + all-day segments/
  overflow; gutter + now-line built from `createSlotMetrics`), 5 `components/DefaultTime*`. Barrel
  exports `TimeGridView` + time slot types. DOM follows styles VOCABULARY "Time grid" exactly.
- **Gates:** react 45 tests (100% stmt/fn/line, 97.47% branch overall; `useTimeGrid` hook 91.66%
  branch — defensive `if(first)` / `slots ?? ''` / out-of-window fallbacks, >85% bar). core 174 green.
  typecheck/lint/build green.

## ⚠ NEXT — Phase 4 remaining build order

0. **Localizer test retrofit (interim, temporal)** — Cutter decision 2026-06-03 (see DECISIONS.md
   "Test date handling"). Replace the temporary cast-fake localizers in **non-localizer** tests with the
   **real `TemporalLocalizer`**; no JS `Date` for date logic in assertions.
   - ✅ **Step 0 done** (commit `b692032`): `@big-calendar/localizer-temporal` added as devDep to
     `react` + `core`; per-package smoke tests prove the dist + dynamic `temporal-polyfill` import resolve
     under both jsdom (react) and node (core). Shared harness `src/testing/localizers.ts` in each package
     exports `LOCALIZER_CASES` (`describe.each` array; **luxon = row 2 later**); `src/testing/**` excluded
     from coverage.
   - ✅ **react 6 done** (commit `ce8f640`): `useCalendar`, `CalendarProvider`, `Toolbar`, `AgendaView`,
     `MonthView`, `TimeGridView` all on the real localizer. Expected text/dates read back from
     `localizer.format()` / `add` / `startOf` / `getSlotDate`; geometry/counts/`bc-today`/drilldown exact.
     MonthView empty-grid edge uses a **delegating `Proxy`** (forwards to the real localizer, overrides
     only `visibleDays → []`), not a fake. **react tests resolve `@big-calendar/core` from its built
     `dist`** → rebuild core (`pnpm nx build core`) after any core src change or they test stale code.
   - ✅ **core 4 of 10 done** (commit `ce8f640`, pulled forward): `slotMetrics`, `timeGrid`, `viewModel`,
     `createCalendarStore`. These shared `makeTimeLocalizer`/`makeRangeLocalizer`/`makeFakeLocalizer`
     fakes; cross-test-file imports were also re-running `createSlotMetrics` under 4 files (now gone).
   - ⚠ **BUG #1 FOUND + FIXED** (the retrofit's first real catch — see DECISIONS.md): `createSlotMetrics.
     positionFromDate` called `diff()` with `a`/`b` swapped (`min − date`), negating every event top /
     now-indicator. The fakes' `diff = b − a` exactly canceled it, so it was invisible. Fixed to
     `diff({ a: date, b: min })`; `getDstOffset` term now on the correct sign. `fix(core)` in `ce8f640`.
   - ✅ **core 6 done** (this commit): `navigateDate`, `viewLabel`, `month`, `agenda`, `viewRange`
     converted to the harness; **`resources` needed no change** (it has no localizer fake — pure
     accessor grouping). `navigateDate`/`viewLabel` derive expected via `localizer.add`/`format`;
     `month` builds its 35-day grid fixture via `localizer.add` and keeps geometry literals exact;
     `viewRange` runs work-week under BOTH `en-US` (Sunday-first, harness default) and `en-GB`
     (Monday-first) to keep the original dual-week-start coverage, deriving boundaries from the localizer.
   - ⚠ **BUG #2 FOUND + FIXED** (same class, caught by the `month` conversion — see DECISIONS.md):
     `segments.function.ts` computed `slots` and multi-day `span` with `diff()` args swapped, so `slots`
     was negative and every multi-day month segment collapsed to `span:1`. The `makeMonthLocalizer`
     fake's `diff = b − a` canceled it; single-day events (span 1 regardless) hid it from the other
     tests. Fixed both call sites to put the later bound in `a` (`diff({a:end,b:start})`,
     `diff({a:last,b:first})`). Only the multi-day month-segment path was affected in production.
   - **All 10 core test files now on the real localizer.** Two production sign bugs found by the
     retrofit; both in the `diff` (`a − b`) convention vs the fakes' inverted `b − a`.
   - **Luxon arm = still deferred** until `localizer-luxon` (currently a scaffold) is implemented (§5.3).
1. ✅ **`<Calendar>`** batteries-included default tree (Toolbar + active view), consuming context —
   **DONE, see Task 4h below.** Light Storybook + the Toolbar/reset CSS fix landed in the same task.
2. ✅ **Top-layer** (§7.5): Popover-API show-more/tooltip + floating-ui positioning — **DONE, see Task 4i below.**
3. **Selection wiring** (pointer/keyboard → slot coords → core FSM) **+ Storybook docs** (Cutter's ask).
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
- **Notes:** ~~month `weekEventLimit` is left unlimited from the store~~ **UPDATED (4f, 2026-06-03):**
  `config.weekEventLimit` is now surfaced and threaded into the `viewModel` computed, so a caller can
  cap month rows from config (a measured/responsive limit is still set adapter-side by passing the prop).
  `selectable` config added but not yet consumed (next task).

### Phase 2 — Task 2l: background events in time-grid ✓ (commit a651ee7, pushed)

- **`src/timegrid/timeGrid.{type,function}.ts`** — `timeGridViewModel` now accepts
  `backgroundEvents?` and each `TimeGridColumn` carries `backgroundEvents: PositionedEvent[]`,
  positioned full-width behind the foreground (`top`/`height` from slot metrics, `left:0`/`width:1`,
  `zIndex:0`, no overlap packing) — v1 parity. Threaded through `buildViewModel` (new
  `backgroundEvents?` arg) and the store's `viewModel` computed (`backgroundEvents.value`).
- Tests: +2 (positions bg full-width; defaults to empty). 168 tests; all files clear the bar.
  typecheck/lint/test/build green.

### Phase 4 — Task 4h: `<Calendar>` + Toolbar/reset CSS fix + light Storybook ✓ (this commit)

Executed in the order Cutter set (CSS → Storybook → `<Calendar>`). See the dated DECISIONS.md entry
"`<Calendar>` shape, Toolbar outside `.bc-calendar`, reset re-scope, Storybook order".

- **CSS fix (`@big-calendar/styles`):** `src/reset.css` — every reset root re-scoped `.bc-calendar`
  → `:is(.bc-calendar, .bc-toolbar)` (box-sizing group, base-surface block, descendant button/list/
  form/table/focus rules, reduced-motion block) so a standalone Toolbar gets the reset. `src/layout.css`
  — `.bc-calendar { grid-template-rows: auto 1fr }` → `1fr` (toolbar moved outside; kept `block-size:
  100%` + `container: bc / inline-size`). `pnpm nx build styles` green.
- **Light Storybook (Cutter's layout calls 2026-06-03):** per-package `.storybook/` config, but all
  stories + `.mdx` docs live in `packages/<pkg>/stories/`. Core stub = **Placeholder/Welcome page**.
  Stack: `storybook` + `@storybook/react-vite` + `@storybook/addon-docs` `^10.4.2` (root devDeps;
  SB10 supports Vite 8 + React 18/19). `pnpm-workspace.yaml` `allowBuilds: esbuild: true` (SB's Vite
  builder needs esbuild's postinstall). `nx.json` production inputs gained `!{projectRoot}/stories/**/*`
  (the `stories/` folder holds plain `.mdx` docs that the `*.stories.*` glob wouldn't catch).
  - **react** (`packages/react/.storybook/{main,preview}.ts`, `stories/`): `harness.tsx` (top-level
    `await createTemporalLocalizer` en-US/UTC, fixed NOW, demo events, `CalendarStage` = sized grid box
    + provider), `Introduction.mdx`, and stories for Toolbar / MonthView / TimeGridView / AgendaView /
    Calendar. `preview.ts` imports `@big-calendar/styles/index.css`. Targets `storybook` (dev :6006) +
    `build-storybook`. `build-storybook` green.
  - **core** (headless): `packages/core/.storybook/` + `stories/Welcome.mdx` placeholder. Needed
    react/react-dom as **dev-only** deps for the react-vite renderer. Targets `storybook` (dev :6007) +
    `build-storybook`. `build-storybook` green. `storybook-static` already gitignored.
- **`<Calendar>` component:** `src/Calendar/{Calendar.component.tsx,index.ts,Calendar.component.test.tsx}`
  + `export { Calendar }` in `src/index.ts`. Locked shape: generic `<TEvent,TResource>`, sole prop
  `toolbar?: boolean | undefined` (default `true`; the explicit `| undefined` is required by
  `exactOptionalPropertyTypes` so callers can forward `boolean|undefined`). Renders the FRAGMENT
  `<>{toolbar ? <Toolbar/> : null}<div className="bc-calendar">{view by viewModel.kind}</div></>` —
  Toolbar is a sibling OUTSIDE `.bc-calendar`; no shell wrapper. View dispatched by `viewModel.kind`
  (`month`→MonthView, `time`→TimeGridView, `agenda`→AgendaView); each view keeps its own null-guard.
  - **Naming note:** did NOT add a `CalendarProps` interface — that name is already the public *config*
    type exported from `useCalendar.ts`. The single prop is inlined to avoid a clashing export.
- **Gates:** react **53 tests** (7 new Calendar), full-suite coverage 100% stmt/fn/line, 97.65% branch
  (Calendar.component.tsx 100%; the two pre-existing month/time memo hooks sit at 91.66% branch, >85%
  bar). typecheck/lint/build green; both Storybooks build.

### Phase 4 — Task 4i: Top-layer UI (§7.5) — Popover / Tooltip / Dialog + show-more popovers ✓ (this commit)

Cutter's scope calls (AskUserQuestion 2026-06-03): **full §7.5 surface** (Popover + show-mores +
Tooltip + modal Dialog), **thread overflow events through** the show-more slots, **lazy-load
floating-ui on first open**. See the dated DECISIONS.md entry.

- **`src/internal/floatingPosition.ts`** — `positionFloating(anchor, floating, {placement, offset})`:
  lazily `import('@floating-ui/core')` (cached promise; the import stays in value position to satisfy
  `consistent-type-imports`), a **minimal viewport DOM platform** (`getElementRects`/`getDimensions`/
  `getClippingRect` from `getBoundingClientRect` + `window.inner*`), `strategy:'fixed'`, middleware
  `[offset, flip, shift, size]`. `size` both constrains oversized popovers to the viewport **and** is
  what exercises the otherwise-uncalled `getDimensions`. **Verified in the dist build:** floating-ui is
  externalized and referenced by a single dynamic `import("@floating-ui/core")` → truly lazy.
- **`src/internal/useFloatingAnchor.ts`** — shared hook keeping a floating element positioned against an
  anchor while open (repositions on scroll/resize). Extracted from Popover/Tooltip so the floating-ui
  wiring + its defensive empty-ref guards live in one directly-unit-tested place.
- **`src/Popover/`** — anchored top-layer popover. **Declarative `popovertarget`** (browser owns
  open/close + light-dismiss + Esc); React tracks open via the panel's `toggle` event (`onToggle` prop,
  no imperative effect) and positions via the hook. `popover="auto"`, `aria-haspopup/expanded/controls`,
  `trigger` render-prop. Content mounts only while open.
- **`src/Tooltip/`** — `popover="manual"` top-layer tooltip; opens on hover **and** focus, **toggles on
  tap** (coarse-pointer reachable, §7.7); `role="tooltip"` + `aria-describedby` (via `cloneElement`).
  Native show/hide guarded by `typeof` (jsdom has none).
- **`src/Dialog/`** — thin native `<dialog>` modal wrapper. `showModal()` → focus-trap + Esc +
  `::backdrop`; **restores focus** to the prior element on close; `close` event → `onClose`.
- **Threaded overflow events** (Cutter's call): `components.type.ts` — `MonthShowMoreProps`/
  `TimeShowMoreProps` are now **generic `<TEvent>`** and gain `events: ReadonlyArray<ShowMoreEvent<TEvent>>`
  (new exported `ShowMoreEvent` = `{key,event,title}`). `useMonthWeeks`/`useTimeGrid` resolve the
  overflow titles; `MonthView`/`TimeGridView` pass `events` to `ShowMore`. **`DefaultMonthShowMore`/
  `DefaultTimeShowMore` now render a `Popover`** (the `.bc-show-more` button is the trigger) whose panel
  lists the hidden events.
- **styles:** `components/popover.css` gained `.bc-popover-events`/`.bc-popover-event` (top-layer content
  is outside the reset root, so the list is reset locally) and `.bc-dialog` + `::backdrop`. Additive only.
- **Storybook:** stories + required `.mdx` (top-layer + floating-ui-fallback note per §7.5) for
  `React/Top layer/{Popover,Tooltip,Dialog}`, **plus a `React/Calendar` → `ShowMorePopover` story**
  (clustered events + `weekEventLimit={2}`) — answers Cutter's note that no existing story had enough
  events on one day to surface "+N more". Did NOT mutate the shared `demoEvents` (kept other stories
  intact); the overflow story passes its own `events`.
- **Gates:** react **76 tests** (23 new), per-file coverage clears the bar (all 100% func; lowest branch
  Tooltip 88.88% / Dialog 89.47%, both >85%; floatingPosition + useFloatingAnchor + Popover ≥ bar).
  typecheck/lint/test/build green for react/styles/core; `react:build-storybook` green.

### Phase 4 — Task 4i-follow-up: month "+N more" made PER-DAY (Cutter, 2026-06-03) ✓ (this commit)

Cutter spotted (Storybook `ShowMorePopover`) that the month overflow indicator rendered at the **week
start** (Sunday col), not the day that overflowed — because core models overflow **per week**
(`MonthWeek.extra`) and Task 4f anchored the single indicator to `week.days[0]`. Diverges from Google/
Outlook + v1. **Fix is adapter + CSS only (NO core change)** — confirmed `week.extra` segments carry
`left`/`right` columns, so the day each overflowed segment touches is derivable.

- **`useMonthWeeks`** — overflow moved off `MonthWeekCell` onto each `MonthDayCell<TEvent>` (now generic):
  per day column `c` (1-based), `extra = week.extra.filter(seg => seg.left <= c <= seg.right)` → `{count,
  events}` or null (multi-day overflow shows in each day it spans). `MonthWeekCell` drops `extra`, gains
  `moreRow = week.levels.length + 1` (grid row just below the visible levels).
- **`MonthView`** — renders one `<ShowMore>` per overflowing day cell, wrapped in `.bc-show-more-cell`
  placed via `segmentStyle({left: col, span:1, row: moreRow})` (same `--bc-seg-*` grid mechanism as
  segments). `MonthShowMoreProps` shape unchanged (its `day` is now the real day, `events`/`count` per-day).
- **styles** — added `.bc-show-more-cell` (grid placement from `--bc-seg-*`) to `month.css`; the existing
  `.bc-show-more` text styling unchanged.
- **Tests** — new MonthView test asserts the indicator lands in Jun 15's column (`--bc-seg-left === '2'`,
  Sunday-first), not the week start. react **77 tests**; coverage still clears the bar; typecheck/lint/
  build green; `react:build-storybook` green.
- **Note (deferred):** the **time-grid all-day row** "+N more" is still single/row-level (Cutter chose
  month-only for now). Per-day for the all-day row is the larger TimeGridView option if wanted later.

### Phase 4 — Task 4i-fix2: time-grid layout collapse — `--bc-day-count` on the container (Cutter, 2026-06-04) ✓ (this commit)

Cutter compared the new TimeGrid Storybook to react-big-calendar's: our time gutter spanned the full
width with **no day columns**. Root cause was an **adapter bug, not CSS/build** — `layout.css` lays out
`.bc-time-header`, `.bc-allday-row`, `.bc-time-body` from `grid-template-columns: var(--bc-gutter-width)
repeat(var(--bc-day-count), …)`, but `TimeGridView` only set `--bc-day-count` on `.bc-time-header` and
`.bc-allday-segments` — never on `.bc-time-body` or `.bc-allday-row`. With the var undefined, `repeat()`
is invalid → the whole `grid-template-columns` is dropped → body falls back to one implicit column
(gutter full-width, right-aligned labels at the screen edge, no columns).

- **Fix (Cutter chose "on container, dedupe"):** set `--bc-day-count` **once on `.bc-time-grid`** so the
  header, all-day row, all-day segments, and body all inherit it (custom props inherit). Removed the now-
  redundant inline `dayCountStyle` from `.bc-time-header` and `.bc-allday-segments`. Matches the layout.css
  contract comment ("Counts the adapter sets on **containers**"). No CSS change; `layout.css`/dist already
  in sync and correct.
- **Tests** — new TimeGridView test asserts `--bc-day-count === '7'` on `.bc-time-grid` in WEEK view. react
  **78 tests**; coverage clears the per-file bar; typecheck/lint/build green; `react:build-storybook` green.
- **Note (untouched):** the Storybook toolbar in the same screenshot also looked unstyled (view buttons run
  together). Not investigated — out of scope for this fix. Flag if you want it looked at.

### Phase 4 — Task 4i-fix3: time-grid header alignment + gutter group spanning (Cutter, 2026-06-04) ✓ (this commit)

After fix2 the columns rendered but Cutter flagged three structural issues (detailed styling still
deferred):
1. **Day headings one column left of the body.** `.bc-time-header` is an 8-track grid (gutter + 7 days)
   but only rendered the 7 headings, which auto-flowed starting in the gutter track. Fix: render an empty
   `.bc-time-header-gutter` spacer as the header's first child so headings land in tracks 2–8, aligned with
   the body day columns (the all-day row already does this via its `All Day` label in track 1).
2. **Gutter didn't start at 12 AM / labels didn't cover their hour blocks.** Body is `slot-count` (48)
   rows tall but the gutter gave each hourly label a single `slot-height` row → gutter was half the body
   height and labels drifted; the first label (12 AM) was also clipped by `translate: 0 -50%`. Fix: gutter
   rows span the group — new `--bc-slots-per-group` (= `store.timeslots`, default 2) drives
   `grid-auto-rows: calc(var(--bc-slot-height) * var(--bc-slots-per-group, 1))` in layout.css, so the
   gutter matches the body height and each label covers its block. Dropped the `-50%` translate so 12 AM
   sits at the top of its block (label vertical alignment flagged as deferred styling).
- **Adapter:** new `slotGroupStyle(slotsPerGroup)` geometry helper (`--bc-slots-per-group`); applied to
  `.bc-time-gutter` via `store.timeslots`. No model change.
- **styles:** `.bc-time-gutter` grid-auto-rows now group-spanning (layout.css); `.bc-time-label` translate
  removed (timegrid.css). **styles dist rebuilt** (src→dist copy) so Storybook reflects the CSS.
- **Tests** — three new TimeGridView tests: header leads with `.bc-time-header-gutter` (7 `.bc-day-heading`
  total), gutter carries `--bc-slots-per-group === '2'`, plus the fix2 day-count test. react **80 tests**;
  coverage clears the per-file bar; typecheck/lint/build/build-storybook green.
- **Note (deferred):** exact gutter-label vertical position (top-of-block vs straddling the boundary line)
  left for the broader component-styling pass; toolbar still unstyled (untouched).

### Phase 4 — Task 4i-fix4: time-grid border/spacing pass (Cutter, 2026-06-04) ✓ (this commit)

Cutter's minor follow-ups after fix3 (still pre-detailed-styling):
- **Story height 640 → 800** in `harness.tsx` `CalendarStage` default (more vertical room to see the grid).
- **Gutter grouping borders** — `.bc-time-label` gains `border-block-start: var(--bc-border)` so each
  labelled hour group shows a top line in the gutter, aligning with the columns' hour lines (denotes the
  grouping; same `--bc-border` token as the rest, per the rbc reference coloring).
- **Closing bottom border** — the time grid had no bottom edge (unlike `.bc-month-grid`). Added
  `border-block-end: var(--bc-border)` to `.bc-time-grid` (timegrid.css) + `margin-block-end: 2px`
  (layout.css) so the final border sits off the container edge and stays visible. (Cutter asked for the
  margin; I added the closing border so the margin actually reveals something — flagged for review.)
- CSS + story-harness only (no component logic); **styles dist rebuilt**. react **80 tests** still green;
  typecheck/lint/build/build-storybook green. No new unit tests (pure CSS/story changes; not jsdom-testable).

### Phase 4 — Task 4i-fix5: hour vs half-hour slot line colors (Cutter, 2026-06-04) ✓ (this commit)

Cutter: within an hour block the divider between the two 30-min slots should be light grey; the hour
boundaries darker ("black").
- **Two layered gradients on `.bc-day-column`** (timegrid.css): hour lines (one per group of
  `--bc-slots-per-group` slots) paint on top in `--bc-color-border`; lighter half-hour lines beneath in the
  new `--bc-color-slot-border` token (`CanvasText 10%`). At the hour boundary the darker hour line wins;
  between hours only the light slot line shows.
- **`--bc-slots-per-group` moved to the `.bc-time-grid` container** (merged with `dayCountStyle` via spread)
  so BOTH the gutter (row height) and the columns (hour-line period) inherit it; removed the gutter's own
  inline copy. Test updated to assert the var on `.bc-time-grid`.
- **Flagged:** hour lines use the standard `--bc-color-border` (medium grey), NOT literal black, to stay
  consistent with the column/header/outer borders. Offered to add a darker token if Cutter wants true black.
- react **80 tests** green; coverage clears the bar; typecheck/lint/build/build-storybook green; styles dist
  rebuilt.

### Phase 4 — Task 4i-fix6: agenda — periwinkle scoping + grouped table layout (Cutter, 2026-06-04) ✓ (2 commits)

**A — periwinkle scoping (commit daa8d0f):** Cutter: the `.bc-event` background should apply to Month +
time grid, not Agenda. Moved the temporary periwinkle to the `--bc-color-event-bg` token (was AccentColor)
so `.bc-event` (time grid) AND `.bc-segment` (month + time-grid all-day) both get it; switched the default
agenda event off `.bc-event` → `.bc-agenda-event` so the agenda list isn't filled.

**B — agenda layout (this commit):** BC agenda was compacted — `.bc-agenda-day` was a 3-col grid but got
one date + N event rows as children, so events auto-flowed sideways. No header, no date grouping. Cutter
chose **CSS grid + subgrid (divs)** over a `<table>` (responsive reflow for small screens is later work).
- **Shared columns via nested subgrid:** `.bc-agenda` is now the `auto auto 1fr` (date|time|event) grid;
  `.bc-agenda-header` and `.bc-agenda-body` are `grid-template-columns: subgrid`, so header + body columns
  line up like a table. Each `.bc-agenda-day` is also a column-subgrid with `grid-template-rows:
  repeat(var(--bc-agenda-rows), auto)`; the date sits in col 1 spanning `1 / -1` (shows once per day), and
  each `.bc-agenda-row` spans cols 2/-1 as its own subgrid (time | event).
- **Adapter:** new `agendaRowsStyle(count)` helper (`--bc-agenda-rows`), set on each `.bc-agenda-day` from
  `row.events.length`. `AgendaView` now renders a `Date/Time/Event` header (from `messages.date/time/event`)
  and uses one return (header + empty-or-body). Default agenda event dropped the `.bc-event-title` wrapper
  (plain text, matches RBC) — `.bc-event-title` still used by month/time-grid events.
- **Borders (agenda.css):** day boundary heavier (`--bc-border`), intra-day row divider lighter
  (`--bc-color-slot-border`), column separators on date/time + header headings; removed the old grid/gap
  from `.bc-agenda-header` (now in layout.css so the components layer doesn't override the subgrid).
- **Tests** — 2 new AgendaView tests (Date/Time/Event header; `--bc-agenda-rows === '2'` on the focus day).
  react **82 tests**; coverage clears the per-file bar (agenda 100%); typecheck/lint/build/build-storybook
  green; styles dist rebuilt.

### Phase 4 — Task 4j: selection wiring — step 1, FSM → store (Cutter, 2026-06-04) ✓ (commit c6d3d15, pushed)

First implementation step of the §8.1/§8.2 selection plan. **Core only this commit** (no view DOM yet).
- **FSM:** added `doubleClick({slot})` action + `'doubleClick'` to `SelectAction` (single & double-click
  both commit through `onSelect`). Widened `createSelection` arg callbacks to `| undefined`
  (exactOptionalPropertyTypes).
- **Store `selection` API** (`SelectionApi`): wraps one `createSelection` controller —
  `{ state, range }` signals (slot-index space, for the overlay) + `start/to/complete/click/doubleClick/
  cancel`. `start/click/doubleClick` take `{ slot, date, mode }`; the store captures `{mode,date}` and
  **translates index→ISO-date on commit** (decision: translation in core/store, reused by all adapters).
  - **time** mode: `getSlotDate(anchorDay, dayStartMin + i*step)` per slot, **exclusive end**.
  - **day** mode: linear index into `range.days`, **end-of-day** of the last day.
- **Config callbacks** (ISO strings, not `Date`): `onSelecting({start,end})=>bool|void` (veto),
  `onSelectSlot({start,end,slots,action})`. Threaded through react `useCalendar` latest-props wrappers
  (only wired when provided). New exports: `SelectionApi`, `SelectionMode`, `SlotSelectionDates`.
- **Reset:** effect cancels any in-progress drag on view OR date change. `selectable` default false.
- **Tests:** +2 FSM (doubleClick + disabled), +7 store (disabled-default, time drag commit, onSelecting
  veto, click+dblclick actions, day-mode translate, cancel on view-change, cancel on navigate). core
  **144 tests**; per-file coverage clears the bar; typecheck/lint/build + react test/build/storybook green.

### Phase 4 — Task 4j: selection wiring — steps 2-3 (Cutter, 2026-06-04) ✓ (commits ecf0711, 58a25c7, pushed)

- **Step 2 — time-body slot cells (ecf0711):** transparent `.bc-time-slots` grid of `.bc-time-slot`
  (`data-date` + `data-slot-index`) per day column = base hit/focus layer; gradient lines untouched.
  +1 TimeGridView test (48 cells, indices 0/47, data-date).
- **Step 3 — EventButton (58a25c7):** internal `<button>` wrapper (`data-bc-event`), wired into Month +
  TimeGrid (timed + all-day). click→select+`onEventClick`; dblclick→`onEventDoubleClick` (250ms);
  Enter/Space=primary, F2=secondary; pointerdown stopPropagation. New `onEventClick`/`onEventDoubleClick`
  props (CalendarProvider→context, stable identities, react-only). Cutter: **minimal button reset** +
  **aria-selected**. +1 EventButton test file (7 tests). react **90 tests**; all gates + storybook green.

### Phase 4 — Task 4j: selection wiring — step 5a, time-grid pointer (Cutter, 2026-06-04) ✓ (commit 39e4688, pushed)

- **`useSlotSelection(mode)`** (react internal hook): pointer drag/click/dblclick from `[data-slot-index]`
  hit cells → `store.selection`; 4px drag threshold, 250ms tap-debounce, defers over `[data-bc-event]`,
  ignores non-primary / disabled; window-tracked move/up + unmount cleanup; `document.elementFromPoint`
  for the move target. **TimeGridView** wires it to `.bc-time-body` + renders `.bc-selection` in the
  anchored column during a drag. Store adds `selection.anchor` signal + `store.selectable`.
- Tests: new `useSlotSelection.test.tsx` (7: drag/click/dblclick/over-event/miss/right-click/disabled)
  + TimeGridView overlay test. react **97 tests**, core 144; all gates + storybook green. (`elementFromPoint`
  is stubbed in tests — jsdom has no layout.)

### Phase 4 — Task 4j: selection wiring — step 5b, month day selection (Cutter, 2026-06-05) ✓ (commit 85de055, pushed)

- **MonthView** day-mode selection: non-overridable `.bc-month-slots` hit layer (one `.bc-month-slot` per
  day, `data-date` + linear `weekIndex*7+dayIndex`, == `range.days` order — verified `month.function` chunks
  `days.slice(i,i+7)`); `useSlotSelection('day')` on `.bc-month-grid`; per-week `.bc-selection.bc-selection-month`
  band, range clipped to each week row (`max(start,base)..min(end,base+6)` → `segmentStyle({left,span,row:1})`).
- **CSS (layout.css):** added `.bc-month-slots/.bc-month-slot`, `.bc-selection-month` (grid-placed variant
  overriding the absolute `.bc-selection`). **Edited two existing rules** (flagged to Cutter): `.bc-week-backgrounds`
  → `pointer-events:none` + new `.bc-date-number { pointer-events:auto }`, so empty cell area falls through to the
  hit layer while date-number drilldown + event clicks still work. Stacking by DOM order: slots → selection →
  backgrounds → events.
- **Storybook:** new `SelectionDemo` harness (selectable on; `onSelectSlot`/`onEventClick`/`onEventDoubleClick`
  feed an on-screen read-out) + **Selectable** stories for TimeGridView (week) and MonthView. This was the
  "no way to test selection" gap Cutter reported.
- Tests: +3 MonthView (hit-cell tags, day-drag band overlay, ISO day-click payload). react **100 tests**, core 144;
  all gates + storybook green.

### Phase 4 — Task 4j: selection wiring — cross-day time → all-day (Cutter, 2026-06-05) ✓ (commit 0fb17d1, pushed)

- Time-grid drags can cross days: hit cells use a **global** slot index (`dayIndex*slotCount + slot`); the store decodes same-day → timed selection, cross-day → whole-day span over `range.days[startDay..endDay]`. `SlotSelectionDates` + `onSelecting` gain `allDay: boolean` (true for all whole-day selections: month/day + cross-day time). `slotCount` flows view→hook→store anchor (optional, single-day fallback). Per-column overlay (start-day slot→bottom, full middle, top→end-day slot). See [DECISIONS.md](DECISIONS.md) 2026-06-05.
- Storybook read-out moved outside the calendar container (no reflow on selection); selection highlight retinted to translucent periwinkle (tokens.css); month band painted above cell backgrounds; **Selectable** Controls playground added to Calendar stories.
- core **146**, react **102**; all gates + storybook green.

### Phase 4 — Task 4j: selection wiring — step 5b tail, all-day row day selection (Cutter, 2026-06-05) ✓ (this commit)

- **TimeGridView all-day row** now selectable in `'day'` mode (whole days), mirroring MonthView. A second
  `useSlotSelection('day')` is wired to `.bc-allday-row`; a non-overridable `.bc-allday-slots` hit layer
  renders one `.bc-allday-slot` per visible day (`data-date` + linear `data-slot-index` == `grid.columns`/
  `range.days` order). A live `.bc-selection.bc-selection-allday` band spans the selected day columns
  (`segmentStyle({left,span,row:1})`, clipped to the visible columns) while a day-drag is active; commit →
  `onSelectSlot` whole-day span (`allDay: true`).
- **styles (layout.css):** added `.bc-allday-slots`/`.bc-allday-slot`, `.bc-allday-selection` overlay
  subgrid + `.bc-selection-allday` band variant; the all-day row's column-area children all sit at
  `grid-row:1` so the hit layer / band / segments overlap. `.bc-allday-slots` has a `min-block-size` so an
  **empty** all-day strip stays selectable. `.bc-allday-segments` set `pointer-events:none` (its `.bc-segment`
  + `.bc-show-more` children already re-enable) so empty area falls through to the hit layer. styles dist rebuilt.
- **Tests:** +1 TimeGridView (7 all-day hit cells, day-drag band `--bc-seg-left/span`, whole-day `onSelectSlot`
  with `allDay:true` + 3 slots). react **102** (all pass), core 146; typecheck/lint/build + build-storybook green.
- **Note (deferred):** mixed-surface drag — starting a day-drag in the all-day row and dragging down into the
  time body reads a time-grid global slot index via `elementFromPoint` (interpreted in day space → clamped).
  Horizontal across-day dragging is the expected gesture; cross-surface promotion not handled. The all-day row
  "+N more" remains single/row-level (unchanged from 4i-follow-up).

### Phase 4 — Task 4j: selection wiring — step 5c-1, slot-grid keyboard roving (Cutter, 2026-06-05) ✓ (this commit)

- **`src/internal/useRovingSelection.ts`** (new) — keyboard roving-tabindex + selection for one slot
  surface (§8.1). One tab stop per group: the active cell has `tabIndex={0}`, the rest `-1`; **Arrow**
  moves focus via a view-supplied `neighbor(index,dir)` map (each view owns its geometry — time columns
  vertical, month/all-day rows horizontal), **Shift+Arrow** extends (`start()` then `to()`), **Enter/Space**
  commit (`complete()` while selecting, else `click()`), **Esc** cancels. The **focused cell is the source
  of truth** (reads `data-slot-index`/`data-date` off the DOM, not lagging React state); selection-active is
  read from the store each keystroke. Ignores keys from event buttons on the same surface (they own Enter/
  Space/F2) and no-ops when `selectable === false`.
- **Wired into all three slot surfaces:** MonthView (`.bc-month-grid`, day grid: ±1 day / ±7 week),
  TimeGridView time body (`.bc-time-body`, global index: ±1 slot / ±slotCount day) and all-day row
  (`.bc-allday-row`, day row: ±1 day). Each slot cell gained `tabIndex={roving.cellTabIndex(index)}`; the
  containers got `ref`/`onKeyDown`/`onFocusCapture` (the tab stop follows pointer/Tab focus). No CSS change
  (cells inherit the reset `:focus-visible` ring).
- **Tests:** new `useRovingSelection.test.tsx` (9 — roving tab stop + arrows, edges, Shift+Arrow→Enter
  commit, Space click, Esc cancel, event-button keys ignored, disabled, unhandled keys, empty grid) + 1
  MonthView + 2 TimeGridView keyboard tests (nav over every direction incl. edges, keyboard commit). react
  **114** (all pass), core 146. Coverage: hook 87.5% br / 100% fn, MonthView 100/100, TimeGridView 97.18/100.
  typecheck/lint/build + build-storybook green.
- **Deferred to 5c-2:** the **events roving group** (event buttons are still individual tab stops; spec wants
  one tab stop with Arrow moving among them). Full ARIA grid roles + Home/End/PageUp-Down nav stay in §7.6.

### Phase 4 — Task 4j: selection wiring — step 5c-2, events roving group (Cutter, 2026-06-05) ✓ (this commit)

- **`src/internal/useEventRoving.ts`** (new) — the **second** bounded tab stop (§8.2): the view's event
  buttons (`[data-bc-event]`) become one tab stop, Arrow moves focus among them (Enter/Space/F2 stay on the
  button). Event buttons are scattered across per-week / per-column / all-day containers, so the hook attaches
  at the **view root** and owns the buttons' `tabIndex` **imperatively** — after each render it walks the
  `[data-bc-event]` buttons in DOM order and makes exactly one tabbable (the focused one, else the first).
  `EventButton` renders no `tabIndex`, so React never fights these writes. Slot-cell arrows/focus bubbling to
  the root are ignored (no `[data-bc-event]` ancestor); the slot-grid roving's own guards likewise ignore
  event-button keys, so the two groups never cross-fire.
- **Wired into MonthView (`.bc-month`) and TimeGridView (`.bc-time-grid`) roots** (ref/onKeyDown/onFocusCapture).
  Agenda events aren't `EventButton`s yet (deferred), so no group there.
- **Tests:** new `useEventRoving.test.tsx` (7) + 1 MonthView end-to-end (real event buttons → one tab stop +
  arrow nav). react **122**, core 146. Coverage: hook 87.5% br / 100% fn; MonthView 100/100, TimeGridView
  97.18/100. typecheck/lint/build + build-storybook green.

**Step 5c (keyboard roving) COMPLETE** — slot grid (5c-1) + events group (5c-2). Two bounded tab stops, full
Arrow/Shift+Arrow/Enter-Space/Esc + F2 model per §8.1/§8.2.

### Phase 4 — Task 4j: selection wiring — slot focus ring + selection `.mdx` (Cutter, 2026-06-05) ✓ (this commit)

Cutter (Storybook): no visible focus rings on keyboard nav, and no doc explaining selection.
- **Focus ring (styles/layout.css):** slot cells are the **bottom** layer (date cells / events / overlays
  paint above), so the reset's `:focus-visible` outline was hidden. Added `position: relative` to
  `.bc-month-slot`/`.bc-allday-slot`/`.bc-time-slot` + a `:focus-visible::after` ring (`z-index:5`, inset
  `outline-offset` so it isn't clipped, `pointer-events:none` so the cell stays the hit target and events
  stay clickable). styles dist rebuilt.
- **`stories/Selection.mdx`** (`React/Selection`) — the required selection doc: enabling (`selectable`
  values), the finalized `onSelecting`/`onSelectSlot` contract (ISO-string primitives, `SlotSelectionDates`
  shape, the **`allDay` table**, end-of-day rule, `action` values), pointer + keyboard (the two roving tab
  stops, key tables, F2/no-keyboard-dblclick), touch (planned, not wired), and the `data-*` DOM model.
  Points readers to the **Calendar → Selectable** playground. build-storybook green.

### Phase 4 — Task 4j: selection wiring — step 6, `aria-describedby` instructions + core API doc (Cutter, 2026-06-05) ✓ (this commit)

Closes Step 6. Conveys the keyboard gestures ARIA's role/state/shortcut attributes can't (DECISIONS.md
2026-06-04 "aria-describedby instructions element").
- **Core messages (Cutter chose "Core Messages map" over react-only):** added two overridable keys to the
  `Messages` interface + `DEFAULT_MESSAGES` — `selectionInstructions` (slot grid) and `eventInstructions`
  (event buttons). English defaults describe Arrow / Shift+Arrow / Enter-Space / Esc and Enter-Space / F2.
- **Provider (react):** `CalendarProvider` renders two visually-hidden `<p class="bc-sr-only">` instruction
  elements (ids from `useId()`) and exposes `descriptionIds: { selection, event }` on the context, so all
  slot cells + every `EventButton` reference the **same** shared text via `aria-describedby`.
- **Wiring:** `aria-describedby={descriptionIds.selection}` on every focusable slot cell (`.bc-month-slot`,
  `.bc-allday-slot`, `.bc-time-slot` — the roving cells); `aria-describedby={descriptionIds.event}` on each
  `EventButton` (alongside its existing `aria-keyshortcuts`). On the focusable cells/buttons, not the
  container, so SRs announce on focus (full ARIA grid roles stay deferred to §7.6).
- **styles:** new unscoped `.bc-sr-only` utility (clip-path visually-hidden) in `layout.css` (`@layer
  bc.layout`) — unscoped because the provider may render the elements alongside, not inside, `.bc-calendar`.
  styles dist rebuilt.
- **Docs:** new `storybook-core` page `Core/Selection contract` (`stories/SelectionContract.mdx`) mirrors the
  framework-agnostic `onSelecting`/`onSelectSlot` + `SlotSelectionDates` contract (ISO strings, the `allDay`
  table, end-of-day rule, why translation lives in core). React `Selection.mdx` gained a note on the
  `aria-describedby` instructions + the two new message keys. HTML tables (Storybook MDX has no remark-gfm).
- **Tests:** +1 core (defaults carry the two new keys), +1 CalendarProvider (hidden elements render + match
  context ids), +1 EventButton (`aria-describedby` resolves to the F2 text). core **147**, react **124**;
  per-file coverage clears the bar; typecheck/lint/build + both build-storybook green.
- **Note (minor, deferred):** the slot cells stay focusable + describedby even when `selectable===false`, so
  the selection instructions can be announced on a non-selectable grid. Low-stakes; gate later if wanted.

**Step 6 COMPLETE.** Selection wiring (steps 1–6) done: FSM→store, slot cells + EventButton, pointer
(time/month/all-day), cross-day→all-day, keyboard roving (two tab stops), focus ring, `.mdx` docs, and the
a11y instructions.

### Phase 4 — Task 4j: selection wiring — time-grid event gutter (Cutter, 2026-06-05) ✓ (this change)

Closes the "full-width event leaves no selectable strip" open item. A timed `.bc-event`/`.bc-bg-event` is
`--bc-left:0`/`--bc-width:1` when unoverlapped, so it covered the **full** inline width of its day column and
no `.bc-time-slot` was grabbable at those times (the RBC "drag a new event alongside an existing one"
affordance was impossible).
- **styles (CSS-only):** new `--bc-event-gutter: 0.625rem` token (tokens.css, by `--bc-event-gap`). The
  `.bc-event, .bc-bg-event` rule now squeezes the fractional layout into `100% - var(--bc-event-gutter)`
  (`inset-inline-start`/`inline-size` both `* (100% - gutter)`), leaving a permanent selectable strip on the
  trailing edge over a bare `.bc-time-slot`. styles dist rebuilt.
- **No core/geometry/JS change, no contract change** — the gutter is a presentational affordance, not data
  (rejected baking it into the core day-layout widths). **No Vitest test:** jsdom has no box model / working
  `elementFromPoint`, so "the strip is grabbable" is only verifiable visually; verified via `build-storybook`
  (green). Decision (size 0.625rem, CSS-only approach) logged in DECISIONS.md.

### Phase 4 — Task 4j: selection wiring — touch long-press + scroll suppression (Cutter, 2026-06-05) ✓ (this change)

Closes the carried "touch long-press + `touch-action` (scrollable body)" open item. The pointer adapter started a
drag immediately on press; on touch that fights native scroll (`pointercancel` instead of `pointermove`), so
drag-select on a finger was broken and you couldn't scroll the time body without a stray selection.
- **core:** new `longPressThreshold` config (`config.type.ts`) → resolved on the store (`store.type.ts`,
  `createCalendarStore`, **default 500**) → exposed as a React prop automatically (`CalendarProps extends Omit<CalendarConfig>`).
- **react adapter (`useSlotSelection`):** on `pointerType === 'touch'`, a press arms a long-press timer; selection
  begins only after the hold. Movement past the 4px threshold before it fires = scroll → gesture abandoned (no
  select/click). On engage: `setPointerCapture` + a **non-passive `touchmove` preventDefault** suppresses native
  scroll for the rest of the drag. `pointercancel` now aborts the in-progress range (`selection.cancel()`).
  Mouse/pen unchanged (immediate drag). Restructured to **gesture-local closures** (per-pointerdown) to add the
  timer + `pointercancel` without circular `useCallback` deps; all prior mouse tests pass unchanged.
- **styles:** `touch-action: pan-y` on `.bc-time-body` (normal finger scroll until a long-press engages). dist rebuilt.
- **tests/docs:** touch timing/abandon/tap/custom-threshold/pointercancel/pointer-capture unit-tested with fake
  timers; per-file 85.2% branch / 100% func. Selection.mdx Touch section rewritten (was "planned, not wired").
  Decision (configurable 500ms + robust suppression) logged in DECISIONS.md. Scroll-suppression *effect* itself is
  visual-only (jsdom has no box model) — `build-storybook` green.

### Phase 4 — Task 4j: selection wiring — agenda event interaction + right/middle click (Cutter, 2026-06-05) ✓ (this change)

Closes the carried "Agenda EventButton" open item — but **not** by reusing the shared `EventButton` (Cutter's call).
The agenda is a list (no drag/resize/selection), so wrapping the row in a button would have broken its `.bc-agenda-row`
subgrid table. Instead the agenda keeps its DOM and makes only the **title** (`.bc-agenda-event`) interactive.
- **New bespoke element `AgendaView/components/AgendaEventButton.component.tsx`:** renders the title as a real
  `<button>` (link-styled) **only when `hasEventHandler`** (any of click/dblclick/right/middle wired), else a plain
  `<span>`. Wires click→`onEventClick`, dblclick→`onEventDoubleClick` (250ms debounce), Enter/Space→primary,
  **F2**→secondary (the keyboard dblclick equiv Cutter wanted). **No** `aria-selected`/store selection (agenda
  selects nothing) and **no** `aria-describedby` — the shared `eventInstructions` describe arrow-roving, which the
  agenda does NOT use (it's **natural tab order**, Cutter's choice — each title its own tab stop, no roving hook).
  `DefaultAgendaEvent` now renders `.bc-agenda-row` > `.bc-agenda-time` + `<AgendaEventButton>` (row structure kept;
  no override-contract change).
- **NEW public handlers `onEventRightClick` / `onEventMiddleClick`** (Cutter named; signature `(event, domEvent)`)
  added to `CalendarProps` (useCalendar.ts) and wired on **both** the shared `EventButton` (Month/TimeGrid) **and**
  the agenda element. Right = `onContextMenu` (also keyboard Menu key / touch long-press); middle = `onAuxClick` +
  `e.button === 1` (modern browsers don't fire `click` for non-primary buttons). App owns `preventDefault` (lib does
  NOT auto-suppress the native menu). Both fold into `hasEventHandler`.
- **Provider/context:** `CalendarProvider` exposes the right/middle wrappers **only when the app actually passed
  them** (else `undefined`) + computes `hasEventHandler`; `CalendarContextValue.onEventRightClick`/`onEventMiddleClick`
  are `((event, domEvent) => void) | undefined`. Consumers attach `onContextMenu`/`onAuxClick` only when present, so
  an omitted right-click handler leaves the browser's **native context menu untouched** (no listener) — Cutter's
  refinement (the prior always-attached noop didn't call `preventDefault` so it didn't actually suppress the menu,
  but gating is cleaner + removes the needless listener). Left-click/double-click keep their always-defined noop-safe
  wrappers (left-click still drives `store.select`).
- **styles:** `button.bc-agenda-event` link styling in `components/agenda.css` (appearance/font/text-align reset +
  accent color + underline + `justify-self:start`); dist rebuilt.
- **tests/docs:** EventButton + AgendaView tests for right/middle/contextmenu/keyboard/span-vs-button/natural-tab;
  per-file AgendaEventButton 100%/100%, EventButton 96.2%/100%, CalendarProvider 100%/100%. Selection.mdx event-
  interaction table + agenda note added; `SelectionDemo` read-out wired for all four handlers. Decision logged.
- **⚠ Pre-existing unrelated typecheck failure** (NOT this change): `useSlotSelection.test.tsx:282-283` — the touch
  pointer-capture stub restore violates `exactOptionalPropertyTypes` (optional `proto.setPointerCapture` ← possibly
  `undefined`). All files in THIS change typecheck clean. Awaiting Cutter's OK to fix the 2-line stub.

## In progress — selection wiring remaining
- **Open items carried:** ✅ *double-click-also-selects RESOLVED 2026-06-07.* ✅ *2m view-registry FULLY
  RESOLVED 2026-06-07 — CORE (Option B) + REACT render path (Option A, `components.views` map). See the two
  Task 2m entries above.*

## Phase 2 status

Concrete core logic is COMPLETE and pushed: constants/accessors, store factory + navigation/
drilldown/range, layout algos, all 5 view models (month / time-grid day-week-work_week / agenda),
resource grouping, selection FSM, messages, derived `viewModel` store signal + parity config,
background events. 168 Vitest cases, every file ≥85% branch / ≥95% func, build green.

## Next — open design decisions (do NOT guess; confirm with Cutter first)

1. **2m — view registry (custom views, §9)** — ✅ **FULLY IMPLEMENTED 2026-06-07.** CORE = Option B
   (registry seams + `custom` arm + `defineView`); REACT = Option A (`components.views` map consumed by
   `<Calendar>`). See the two Task 2m entries above + DECISIONS.md 2026-06-07. Nothing outstanding.
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
