# DECISIONS

> Dated decision log. Mirrors the plan's §2 "Locked Decisions" and §15, plus any new
> decisions made during implementation. Newest at the bottom.

## 2026-06-01 — Phase 0 foundations

- **Manual Nx scaffold** (not `create-nx-workspace`): the repo already had git history +
  `LICENSE`; a manual package-based pnpm-workspace setup gives exact control over the §3 tree and
  avoids interactive generator prompts during autonomous work.
- **Package manager: pnpm** (locked, §2). Root is a pnpm workspace (`packages/*`, `apps/*`, `e2e`).
- **Nx Cloud OFF** (locked, §2): no `nxCloudAccessToken`, no cloud runner; local + CI cache only.
- **Nx Release**: `projectsRelationship: "fixed"` (one synced version), `version.conventionalCommits: true`,
  workspace changelog `createRelease: "github"`, project changelogs on. Tag pattern `v{version}`.
- **TS config**: ES2024 target, ESNext module, `moduleResolution: bundler`, strict + `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `isolatedModules`. ESM-only output (§13).
- **Module boundaries** enforced by scope tags (`scope:core|localizer|styles|dnd|ui|tooling`) encoding the
  §3 dependency direction (core→localizer; ui→core/styles/dnd/localizer; styles→nothing; dnd→core).
- **Conventional commits** mandatory via commitlint + Husky `commit-msg`; scope-enum warns (level 1) on
  the known package/scope list.
- **Versions**: latest stable at scaffold time per §13 (nx 22.7, TS 6.0, Vite 8, Vitest 4, ESLint 10,
  typescript-eslint 8.60, @preact/signals-core 1.14).

## Inherited from the plan (already locked — see Upgrade_plan_prompt.md §2/§15)

- Localizers: Temporal (default) + Luxon only; moment/dayjs/date-fns/globalize dropped.
- Public date type: strings only (strict RFC 3339/9557); no `Date` at the boundary.
- UI text: `messages` map in `core`, English defaults, overridable. No separate i18n package.
- Styling: all in `@big-calendar/styles`; framework packages ship no CSS.
- RTL: CSS `:dir()` + logical properties; no `rtl` prop. (`as`/polymorphic prop dropped entirely.)
- Signals: `@preact/signals-core` in `core`; framework bridges shipped inside each UI package.
- React first and alone in the base; Vue→Angular→Lit added one at a time afterward.
- Execution: autonomous on `feat/initial`, commit+push often, no PRs.

## 2026-06-01 — Phase 1 Task 1a: localizer base architecture

- **Template-method design:** `Localizer<T>` (abstract) implements the *entire* `LocalizerContract`
  (all ~40 string-in/string-out methods) on top of a **small `protected abstract` primitive set**
  (`parse`, `serialize`, `toEpochMs`, `getParts`, `addUnits`, `startOfUnit`, `endOfUnit`, `diffUnits`,
  `withTime`, `offsetMinutes`). Concrete localizers (Temporal/Luxon) implement only the primitives, so
  all locale/week/format logic lives once in the base and every localizer behaves identically.
  `T` (internal datetime type) never escapes the public surface; `core` types against `LocalizerContract`.
- **weekday convention = ISO-8601 `1=Mon … 7=Sun`** across `DateParts.weekday`, `firstDayOfWeek`, and
  `weekInfo.firstDay` — matches `Intl.Locale` weekInfo and Temporal `dayOfWeek` (no 0-based JS `getDay`).
- **`firstDayOfWeek` resolution (resolved 2026-06-02):** explicit override option → locale
  `weekInfo.firstDay` (native or ponyfilled) → **Monday (1)** as the last-resort fallback. Per user
  direction: default to locale, fall back to Monday, allow an override argument. The earlier `?? 7`
  (Sunday) last-resort was changed to `?? 1`; this aligns the unreachable base-class fallback with the
  ponyfill's own CLDR "001" no-region default (Monday) and supersedes the plan's "fallback Sunday" prose.
  Because §5 guarantees weekInfo via ponyfill, the fallback remains effectively unreachable — locale
  values still drive real behavior (e.g. en-US resolves to Sunday=7 via weekInfo).
- **Slot/minute math is wall-clock, not instant-based:** `getMinutesFromMidnight` uses wall-clock
  `hour*60+minute` and `getSlotDate` uses `withTime`, so a DST day still maps minute-630 ↔ 10:30 wall
  time (grid slots are wall-clock). `getTotalMin`/`getDstOffset` remain instant-based (real elapsed).
- **Ponyfill guarantee (§5/§15.3):** `getWeekInfo` and `formatDuration` feature-detect the native
  `Intl` API and fall back (CLDR region table / `NumberFormat`+`ListFormat`) when absent.

## 2026-06-01 — Phase 1 Task 1b: Temporal polyfill choice

- **Polyfill = `temporal-polyfill` (v0.3.2)**, not `@js-temporal/polyfill`. Lighter bundle (matches
  §15.10 "monitor Temporal polyfill weight"), spec-compliant. Loaded **lazily** via dynamic `import()`
  behind a `globalThis.Temporal` feature-detect, so native hosts pay zero polyfill cost (§5.2). It is a
  regular runtime `dependency` of `localizer-temporal` only and stays external in the Vite build.
- **Async construction:** the localizer needs `Temporal` synchronously in its methods, so the public
  entry is an async factory `createTemporalLocalizer(options)` that resolves the namespace (native or
  polyfilled) and injects it into the `TemporalLocalizer` constructor.
- **`TemporalAPI` typed as a hand-written structural interface** (not `typeof import(...).Temporal`):
  the `import()` type expression violates the `consistent-type-imports` ESLint rule. The narrow
  interface (`Instant`/`ZonedDateTime`/`PlainDate` `.from`) is what the full namespace structurally
  assigns to.

## 2026-06-01 — Phase 1 Task 1c: CSS layout/top-layer support floor (spike)

> Full report: `memory/spikes/phase1-css-layout.md`. Spike was a **desk review** vs. the Jan-2026
> platform-knowledge cutoff (no live browser run); empirical Playwright verification deferred to Phase 3.

- **Support floor = Baseline 2024 (no pre-2024 fallbacks).** Per user direction (2026-06-02): we support
  no engine released before 2024 and do **not** spend effort on pre-2024 fallbacks. Subgrid, Popover API,
  and CSS `:dir()` are all cross-engine inside that floor and are **adopted unconditionally** as primary
  mechanisms (month/time-grid alignment via subgrid; top layer via Popover; RTL via `:dir()` + logical
  properties — confirms **no `rtl` prop**). The earlier per-capability "older-engine" fallbacks
  (flat-grid for subgrid, JS portal for top layer, `[dir="rtl"]` selectors) are **dropped.**
- **CSS Anchor Positioning — excluded, but NOT as a back-compat concern.** It is the one capability still
  not cross-engine in *current* browsers (Chromium-only in stable; Safari/Firefox not yet shipped as of
  the Jan-2026 cutoff — flagged uncertain). **Decision: do NOT depend on it.** `@floating-ui/core` is the
  **permanent default** positioning engine for tethered top-layer elements (already a
  `@big-calendar/react` dep, §11) — confirmed with the user 2026-06-02. Native `anchor()` may be added
  later as a feature-detected progressive enhancement once it is cross-engine. Division of labor:
  floating-ui does **positioning**, the Popover API does **top-layer stacking** — complementary.

## 2026-06-02 — End of Phase 2 core logic; 2m + selection-wiring deferred to Phase 4

- **Phase 2 core logic = COMPLETE** (sub-tasks 2a–2l): all 5 view models, layout algos, navigation/
  drilldown/range, accessors, resource grouping, selection FSM, messages, derived `viewModel` store
  signal + parity config, background events. 168 Vitest cases, per-file bar met, build green.
- **2m — view registry (custom views): DEFERRED to Phase 4.** Per Cutter (2026-06-02). Rationale: a
  custom view's model shape can't be settled without the framework view-component contract, and
  `CalendarViewModel` is a closed `month|time|agenda` union. Building the registry now would be a
  speculative abstraction (violates CLAUDE.md simplest-first / ask-before-architecture). Revisit once
  the React view-component contract exists; the registry + custom-view model escape-hatch are designed
  together then.
- **Store-level selection wiring: DEFERRED to Phase 4 (with the React adapter).** Per Cutter
  (2026-06-02): the split is confirmed — the selection **FSM lives in `core`** (done, 2h, slot-index
  space); the **adapter** owns slot-index↔date mapping (month = day cells; time-grid = (column, slot)
  2D) and `beginSlotSelection`. **This split MUST be well documented in Storybook** (Cutter's explicit
  ask) — the React Storybook explains how an adapter drives the core FSM and maps coordinates.
- **Next: Phase 3 — Styles** (`@big-calendar/styles`), per §14 roadmap.

## 2026-06-02 — Phase 3 (Styles) complete

- **`@big-calendar/styles` authored** (tokens, reset, layout, components/*, index bundle) per §6:
  Baseline-2024 CSS, `@layer bc.{reset,tokens,layout,components,theme,overrides}`, all visual values
  as overridable `--bc-*` tokens (system-color defaults via `color-mix` → auto light/dark), month via
  **nested subgrid**, logical properties + `:dir()` for RTL (confirmed **no `rtl` prop**), `@container`
  (not viewport) responsive, native Popover for top layer.
- **Geometry contract locked** (the bridge core→CSS, documented in `packages/styles/VOCABULARY.md`):
  events use `--bc-top/height/left/width` fractions + `--bc-z`; month/all-day segments use
  `--bc-seg-left/span/row` grid spans; now-line `--bc-now-top`. The React adapter (Phase 4) sets these
  inline from core's normalized output and attaches the documented `.bc-*` class names — **framework
  packages ship no CSS** (§6 boundary).
- **Granular exports**: `reset.css` / `tokens.css` / `layout.css` / `components/*.css` / `index.css`;
  each file self-wraps its `bc.*` layer so standalone imports stay correctly layered.
- **Not done in this env:** no browser render / visual-regression (none available) and no CSS linter
  (ESLint is TS-only). `spike/index.html` is authored for manual/Storybook verification; empirical
  subgrid/anchor/visual checks ride with Phase 4/7.

## 2026-06-02 — Phase 4 React state model = HYBRID

- **Cutter chose the HYBRID controlled/uncontrolled model** for `@big-calendar/react` (the canonical
  contract all future Vue/Angular/Lit mirror): uncontrolled by default (store owns state, seeded by
  `defaultView`/`defaultDate`; `useCalendar` returns the store), opt into control per-prop by passing
  `view`/`date` + wiring `onView`/`onNavigate`. Controlled values are written straight to the signals
  (no callback re-fire); `events`/`backgroundEvents`/`resources` always sync.
- Implemented in `useCalendar` (task 4b). Also widened `CalendarConfig` optionals to `?: T | undefined`
  (exactOptional pass-through) so adapters forward props cleanly.
- STILL OPEN (Cutter to decide next): `<Calendar>` component vocabulary + `components` override map
  (§7), top-layer popover components (§7.5), selection wiring + its Storybook docs, and the 2m view
  registry.

## 2026-06-02 — Phase 4 React component/API contract (the canonical framework contract)

Settled with Cutter (AskUserQuestion + follow-ups). All future Vue/Angular/Lit adapters mirror this.

- **Shell = HYBRID** (matches §7.1 "Exports: `<Calendar>`, all sub-components"): a batteries-included
  `<Calendar>` for the common/novice path **and** standalone exports (view components, etc.) for full
  composition. Tree-shakeable (compose only what you import) — aligns with the bundle-size priority
  Cutter raised re: resources/selection packaging.
- **Override model = BOTH** (matches §7 L254 "`components` prop / render props"): a `components`
  override map is the primary API (v1 parity → easiest migration); render-prop functions are the
  escape hatch where a function fits better (e.g. show-more content). Type-safe, framework-native.
- **Context REQUIRED, and it WRAPS `<Calendar>` (it is not created inside it).** Per Cutter:
  `CalendarProvider` is the outer container that owns the store (via `useCalendar`) and publishes it on
  `CalendarContext`. `<Calendar>` and any **sibling** components (custom toolbars, sidebars, mini-maps)
  render *inside* the provider and share one store. `<Calendar>` therefore **consumes** context rather
  than creating its own. `useCalendarContext` throws outside a provider, which enforces this for every
  calendar component automatically.
- **Context kept minimal (Appendix A.6):** the context value carries only `store` for now; `messages`
  and the resolved `components` map join the value when their first real consumers (Toolbar /
  overridable Event) land — not before (A.6: promote to context only once a concrete consumer exists).
- **React 18 floor** (peerDeps `react >=18`, CLAUDE.md): use `Context.Provider`/`useContext`/`forwardRef`;
  avoid React-19-only APIs (`<Context>` as provider, `use()`, ref-as-prop).
- Build order: 4c provider+context → view components (consume context + `store.viewModel`) + Toolbar/
  Event with overrides → `<Calendar>` default tree → top-layer (§7.5) → selection wiring (+Storybook).

## 2026-06-02 — Touch support is a first-class design requirement (cross-cutting)

Per Cutter: the calendar must **support touch for use on tablets and phones** — explicitly, not just
"responsive." Responsive (container queries, Phase 3) sizes the *layout*; touch is orthogonal (a tablet
is large **and** touch). The plan implied touch (§8 "pointer + keyboard" FSM, `longPressThreshold`,
pragmatic-DnD's touch path) but never stated it as a requirement. Now it is.

- **Pointer Events, unified** — adapters bind `pointerdown/move/up` (not separate mouse+touch); set CSS
  `touch-action` on selectable/draggable surfaces so slot-drag / event-drag don't fight page scroll.
- **Coarse-pointer adaptations** (`@media (pointer: coarse)` / `(hover: none)`): ≥44×44px hit targets;
  **no hover-only affordances** — show-more, resize handles, tooltips must be tap-reachable.
- **Long-press to begin selection** on touch (the in-scope `longPressThreshold`, adapter-timed) vs
  immediate mouse drag; disambiguate **scroll-vs-select** in the time grid.
- **Touch DnD** — wire pragmatic-drag-and-drop's touch path + `touch-action: none` on drag handles.
- **Scope:** touches the **adapter + styles ONLY, never `core`** — the selection FSM is already
  pointer-agnostic (slot indices). Lands in Phase 4 (4g top-layer tap targets, 4h selection
  long-press/`touch-action`, DnD touch) + a **coarse-pointer pass on the already-built styles package**
  (current `@big-calendar/styles` has no `pointer: coarse` target-sizing yet — follow-up).
- a11y note: keyboard model (§7.6) is unchanged; touch is additive, not a replacement.

## 2026-06-02 — Labels in core; per-event time strings adapter-side

- **View label → CORE** (Cutter chose this): `store.label` computed via `viewLabel` so every adapter
  renders the identical localized title. Done (task 4d).
- **Per-event time strings → ADAPTER** (my call, flagged for Cutter): a shared, separately-tested
  `formatEventTime` helper in `@big-calendar/react` formats event times for display. Rationale: the raw
  events already reach the adapter (a custom event component needs them), and enriching every event in
  every view model with formatted strings is heavier than one shared formatter. **Open to revisiting** —
  if cross-framework parity of event-time formatting matters, promote `formatEventTime` to a core/shared
  util. Title/allDay are trivial accessor reads done inline in the adapter.

## 2026-06-03 — Per-day "now"/state via store.getNow() (not in the view model)

- **DECISION (Cutter):** MonthView's today highlight (and the upcoming time-grid now-indicator) get
  "now" from a newly-exposed **`store.getNow()`** on the public `CalendarStore` (sibling to
  `localizer`/`accessors`; was internal-only, used by `navigate`). The adapter derives `isToday`
  (`localizer.isSameDate`) and `isOffRange` (`localizer.neq({unit:'month'})` vs the focus date) itself.
- **What was rejected:** enriching every view model with per-day `isToday`/`isOffRange` (and a now-fraction
  for time grid). Rejected to keep view-model shapes lean and avoid baking display semantics into core;
  the single primitive `getNow` is reusable by all views and the now-indicator.
- **Coupled change:** surfaced `config.weekEventLimit` and threaded it into the store's `viewModel`
  computed — it was plumbed through `monthViewModel`/`buildViewModel` but the store never passed it, so
  the month "+N more" overflow path was unreachable. Supersedes the 2j note that said month
  `weekEventLimit` is "left unlimited from the store."

## 2026-06-03 — TimeGridView: resolved step/timeslots on the store for now-indicator alignment

- **DECISION (my call, flagged for Cutter):** exposed resolved **`store.step`** and **`store.timeslots`**
  on the public `CalendarStore` (siblings to `getNow`). The time-grid now-line is derived adapter-side
  (per the getNow decision) by rebuilding `createSlotMetrics` on today's column and calling
  `getCurrentTimePosition(getNow())`. To land the line on the *same* vertical span the model used for
  event boxes (`span = step * numSlots`, which can exceed the raw `[min,max]` window when it isn't a
  whole number of slot groups), the adapter needs the resolved `step`/`timeslots` — so they're exposed
  rather than re-guessing the defaults.
- **Implementation:** resolved once in `createCalendarStore` (`config.step ?? 30`, `config.timeslots ?? 2`)
  and threaded into the viewModel options as the single source of truth (previously the options passed
  raw `config.step`/`config.timeslots` and the defaults lived only inside the view builders).
- **What was rejected:** (a) computing the now-fraction in core/the view model — rejected to keep the
  model "now"-free and pure; (b) approximating the fraction adapter-side from `min`/`max` alone via
  `getMinutesFromMidnight` — rejected because it can misalign with event boxes near the window edge when
  the window isn't a whole number of slot groups.

## 2026-06-03 — Test date handling: real localizers only, dual-localizer parity (base decision, Cutter)

- **DECISION (Cutter):** Tests never use JS `Date` for date logic. All date math/formatting in tests goes
  through a **real** Big Calendar localizer — **no mocked/faked localizers** outside the `localizer`
  package. `Date` is allowed *only* to mint mock RFC-3339 primitive strings or seed fixtures, never for
  assertions or arithmetic.
- **Parity scope (Cutter, corrected from "non-core" → "non-localizer"):** every package **except**
  `@big-calendar/localizer` (`core`, `react`, future framework packages) runs its date-dependent tests
  against **both** shipped localizers — `localizer-temporal` **and** `localizer-luxon` — via a
  parameterized suite (`describe.each([temporal, luxon])`); a behavior passes only when it passes
  identically under both. The `localizer` package tests its own abstract base class directly. Tests pin
  `timezone` (e.g. UTC) and pass `getNow` explicitly for determinism.
- **Sequencing (Cutter: "adopt rule, defer retrofit"):** `localizer-temporal` is **built and usable**
  (1b ✓; `createTemporalLocalizer()` async-loads the Temporal namespace), but `localizer-luxon` is only a
  **scaffold** (`PACKAGE_NAME` + smoke test, no `LuxonLocalizer` class), so the *dual*-localizer parity
  requirement can't be met yet. The rule is recorded now but the existing **cast-fakes stay as a stopgap**
  in the 6 non-localizer react test files (`useCalendar`, `CalendarProvider`, `Toolbar`, `AgendaView`,
  `MonthView`, `TimeGridView`) and in `core`. They are retrofitted to the dual-localizer pattern **once
  `localizer-luxon` is implemented** (§5.3). Acknowledged tech debt, flagged for retrofit. `<Calendar>`
  proceeds first.
  - **Correction:** an earlier draft of this entry said "the concrete localizer packages don't exist /
    base is non-instantiable" — wrong. Temporal exists and works; only Luxon is unimplemented.
- **Execution plan (Cutter, 2026-06-03):** retrofit **interim to real temporal NOW** (don't wait for luxon).
  Order **react 6 → core 10 → `<Calendar>`**. Assertion style: **read expected text from the real
  `localizer.format(value, preset)` output** (not hardcoded en-US ICU literals, not formats-overrides) —
  faithful to wiring, robust to ICU/Node data drift; geometry/counts/`bc-today`/drilldown stay exact UTC
  values. Harness = shared per-package helper, `await createTemporalLocalizer({ locale:'en-US',
  timezone:'UTC' })` in `beforeAll`, built as a `describe.each` array so the luxon arm slots in later.
  Step 0 before converting: smoke-test that the temporal dist + its dynamic `temporal-polyfill` import
  resolve under Vitest, and add `@big-calendar/localizer-temporal` as a devDependency to `react`/`core`.
  **Checkpointed here before starting any conversion (usage budget).**
- **Plan:** recorded in `Upgrade_plan_prompt.md` — new §2 Locked-Decisions row ("Test date handling") and
  new **§5.5 Localizer testing policy**.
- **What was rejected:** keeping exhaustive temporal-vs-luxon parity *only* in the localizer package while
  view tests use a single default localizer — rejected by Cutter: `core` and every non-localizer consumer
  must themselves prove parity against both real localizers, not delegate it.
- **Outcome / first catch (2026-06-03, commits `b692032` + `ce8f640`):** step 0 + react 6 + **core 4 of 10**
  (`slotMetrics`, `timeGrid`, `viewModel`, `createCalendarStore`) done. The real localizer immediately
  exposed a **sign bug in `core/createSlotMetrics.positionFromDate`** — it called `diff()` with `a`/`b`
  swapped (`min − date`), negating every timed-event top, all-day/background offset, and the now-indicator;
  the hand-rolled fakes implemented `diff` as `b − a`, **exactly canceling** the bug so all suites were
  green against fakes. Fixed to `diff({ a: date, b: min })` (with `getDstOffset` now on the correct sign).
  Cutter chose **fix core now + pull the 4 affected core files forward**. This is the concrete justification
  for the no-fakes policy. Remaining core 6 (`resources`, `month`, `agenda`, `viewLabel`, `navigateDate`,
  `viewRange`) still use fakes (green) and convert next. **Gotcha:** react tests resolve `@big-calendar/core`
  from its built `dist`, so core src fixes need `pnpm nx build core` before react tests see them.
- **Outcome / completion + second catch (2026-06-03):** core 6 converted — all 10 core test files now run
  against the real `TemporalLocalizer`. `resources` needed no change (no localizer fake; pure accessor
  grouping). `viewRange` keeps the original dual-week-start coverage by running work-week under both `en-US`
  (Sunday-first, the harness default) and `en-GB` (Monday-first, via `create({locale:'en-GB'})`, since
  `firstDayOfWeek` resolves from locale `weekInfo`). The `month` conversion exposed **BUG #2, same class as
  the slotMetrics one**: `core/views/segments.function.ts` built `slots` and the multi-day `span` with
  `diff()` args swapped, so `slots` went negative and every multi-day month segment collapsed to `span:1`.
  The `makeMonthLocalizer` fake's `diff = b − a` canceled it, and single-day events (span 1 regardless) hid
  it from every other test. Fixed both call sites to put the later bound in `a`
  (`diff({a:end,b:start})` for span, `diff({a:last,b:first})` for slots) — consistent with the established
  "fix core now" precedent. Net: the retrofit caught **two** real production sign bugs, both rooted in the
  fakes implementing `diff` as `b − a` against the contract's `a − b`. Localizer retrofit COMPLETE;
  `<Calendar>` is next. Luxon arm still deferred until `localizer-luxon` exists.
