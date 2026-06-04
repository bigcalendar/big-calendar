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

## 2026-06-03 — Serialization: canonical UTC-`Z`, offset opt-in (SUPERSEDES the `+00:00` behavior)

- **Decision (Cutter):** the localizer's serialized instant is **canonical UTC terminated with `Z`** by default
  — `2026-06-03T10:30:00Z`, or `…Z[America/Los_Angeles]` when `extendedZone`. A new instance option
  `output: 'utc' | 'offset'` (default `'utc'`) lets an app opt into local-offset wire format
  (`…±hh:mm`, or `…±hh:mm[Zone]`). **Supersedes** the prior implicit behavior where `serialize` emitted a
  numeric offset (`+00:00` in UTC) via `dt.toString({timeZoneName:'never'})` / `dt.toString()`.
- **Rationale:** a calendar date is an absolute instant; it always needs a UTC/epoch reference, and the IANA
  zone is only the *display* lens (DST-aware). So values are never zoneless — both forms carry `Z`; the
  bracket is metadata. Per-value "mirror the input format" was rejected: `parse` normalizes into the
  localizer timezone and discards the input's textual form, so mirroring would require threading raw strings
  through the whole base class, has no defined meaning for multi/zero-input methods (`min`/`max`/`getNow`),
  and reintroduces the offset-vs-`Z` ambiguity. An instance-level flag matches how `timezone`/`locale`/
  `extendedZone` already work.
- **Implementation:** option added to `LocalizerOptions` + `LocalizerContract` (readonly) + base `Localizer`
  (`this.output = options.output ?? 'utc'`). Only `TemporalLocalizer.serialize` changed: `body =
  output==='offset' ? dt.toString({timeZoneName:'never'}) : dt.toInstant().toString()`, then append
  `[${dt.timeZoneId}]` when `extendedZone`. **Parse untouched** — verified `Instant.from` already accepts
  `Z`, `+00:00`, `-07:00`, and `…Z[Zone]`, all to the same instant. (`Instant.toString()` also drops the
  `.000` trailing zeros, so outputs are `…00Z`, not `…00.000Z`.)
- **Verified gotcha for the future Luxon adapter:** `DateTime.fromISO('…Z[America/Los_Angeles]')` returns
  `isValid:true` but the **wrong instant** (off by the zone offset — it reads the wall digits as local and
  discards `Z`). The luxon adapter MUST IXDTF-split the bracket and parse the instant separately
  (`fromISO(isoPart, { zone })`), and its `serialize` must compose `…Z` + `[zone]` by hand (Luxon's
  `toISO()` emits offset, never `Z`/bracket). Temporal needs no such workaround.
- **Tests:** `localizer-temporal.class.test.ts` keeps its NY wall-clock assertions readable by constructing
  those localizers with `output:'offset'` (reproduces prior output exactly), plus a new "output modes" block
  covering `utc` default (`…Z`), `…Z[Zone]`, offset mode, and mixed-input→same-instant. Base
  `localizer.class.test.ts` asserts the `output` default/override. Retrofitted core/react suites read values
  back from the localizer, so they're format-agnostic and unaffected.

## 2026-06-03 — `<Calendar>` shape, Toolbar outside `.bc-calendar`, reset re-scope, Storybook order

**Status: IMPLEMENTED 2026-06-03** (Phase 4 Task 4h — see PROGRESS.md). Built in the approved order
(CSS → Storybook → `<Calendar>`); all gates green. The two open Storybook questions below were
resolved by Cutter before install — see "Storybook layout (resolved)".

- **`<Calendar>` is a context CONSUMER**, not a provider — rendered inside `<CalendarProvider>` (the
  provider's docstring already commits to this). Generic over `<TEvent, TResource>`. Sole own prop:
  `toolbar?: boolean`, default `true`.
- **Render shape (locked):** a fragment, NOT a wrapping element —
  `<>{toolbar ? <Toolbar/> : null}<div className="bc-calendar">{active view}</div></>`. The Toolbar is a
  **sibling OUTSIDE** `.bc-calendar`. Active view picked by `viewModel.kind`
  (`month`→`MonthView`, `time`→`TimeGridView`, `agenda`→`AgendaView`); the views keep their existing
  internal `kind`-mismatch null-guards as a safety net.
- **No shell wrapper (Cutter, explicit):** `.bc-calendar` styles/sizes only the calendar (views), filling
  100% w/h of its parent. `.bc-toolbar` owns its own layout/styling. Any container that stacks toolbar +
  calendar (e.g. fixed-height `auto 1fr`) is **developer-supplied at app level** — Big Calendar does not
  emit one. The Toolbar must work both standalone-in-provider and as `<Calendar>`'s sibling.
- **Why this surfaced a CSS bug:** the existing `@big-calendar/styles` baked the toolbar *into*
  `.bc-calendar` — `layout.css` had `.bc-calendar { grid-template-rows: auto 1fr }` (row 1 = toolbar,
  row 2 = view) and `reset.css` scoped the entire reset under `.bc-calendar` only. Moving the toolbar
  outside breaks both: the view would land in the `auto` row (stops filling) and a standalone toolbar
  would lose the reset (host box-sizing/fonts/focus leak in).
- **CSS fix (approved verbatim, do FIRST):**
  - `reset.css`: reset root `.bc-calendar` → `:is(.bc-calendar, .bc-toolbar)` across all selectors.
  - `layout.css`: `.bc-calendar` `grid-template-rows: auto 1fr` → `1fr`; keep `block-size:100%` +
    `container: bc / inline-size`.
- **Custom-toolbar reset = opt-in (Cutter's choice):** the reset covers the built-in `DefaultToolbar`
  (root `.bc-toolbar`). A `components.toolbar` override renders its own root with an unknown class and is
  the dev's responsibility to scope (use `.bc-toolbar`, or render inside `.bc-calendar`) — consistent with
  how custom slot components already attach the style classes. No DOM wrapper is added by the `Toolbar`
  wrapper component.
- **Storybook order (Cutter):** after the CSS fix, stand up a LIGHT Storybook *before* writing
  `<Calendar>`, so progress is visible as the rest of the plan proceeds. Scope: "API stub of base +
  React instances, early React stories only" → stories only for the already-built React components
  (Toolbar, MonthView, TimeGridView, AgendaView). New stack: Vite 8 → `@storybook/react-vite`, pnpm.
  Structure is already implied by `nx.json` (per-project `.storybook/` + co-located `*.stories.*`, both
  already excluded from the `production` namedInputs). The legacy `docs-site.md` memory (webpack/yarn/
  MDX, 150+ prop stories, port 9002) describes the OLD react-big-calendar and is reference only, NOT the
  new toolchain.
- **Storybook layout (resolved by Cutter 2026-06-03, the two formerly-open questions):**
  - (a) **Per-package `.storybook/` config**, but ALL stories and `.mdx` docs live in a
    `packages/<pkg>/stories/` folder (NOT co-located next to components). `nx.json` production inputs
    gained `!{projectRoot}/stories/**/*` so plain `.mdx` docs there (not matched by the `*.stories.*`
    glob) stay out of build/typecheck cache inputs.
  - (b) **"API stub of base" = a Placeholder/Welcome page** for the headless `@big-calendar/core`
    (`stories/Welcome.mdx`), not a full API doc — the real core API reference is a later pass.
- **As-built (Task 4h):** `storybook` + `@storybook/react-vite` + `@storybook/addon-docs` `^10.4.2`
  (SB10 supports Vite 8 + React 18/19) as root devDeps. `pnpm-workspace.yaml` `allowBuilds: esbuild:
  true` (pnpm 11 build-script approval; SB's Vite builder needs esbuild's postinstall). Core got
  react/react-dom as dev-only deps so its docs Storybook renders via react-vite. Stories cover Toolbar,
  MonthView, TimeGridView, AgendaView, and (added once it existed) Calendar. The `<Calendar>` prop type
  shipped as `toolbar?: boolean | undefined` (the `| undefined` required by `exactOptionalPropertyTypes`);
  no `CalendarProps` interface was added for it — that name is already the public config type from
  `useCalendar.ts`, so the single prop is inlined to avoid a clashing export.

## 2026-06-03 — Top-layer UI (§7.5): Popover / Tooltip / Dialog, lazy floating-ui, threaded overflow

**Status: IMPLEMENTED 2026-06-03** (Phase 4 Task 4i — see PROGRESS.md). All gates green.

Scope settled with Cutter (AskUserQuestion + the show-more follow-up):
- **Full §7.5 surface** (not simplest-first): `Popover` + wired show-mores + standalone `Tooltip` +
  modal `Dialog`. Cutter chose to build ahead of every consumer (Tooltip/Dialog have no internal
  consumer yet; stories demonstrate them).
- **Thread overflow events through the show-more slots** (a public prop-type change): `MonthShowMoreProps`
  / `TimeShowMoreProps` became generic `<TEvent>` and gained `events: ReadonlyArray<ShowMoreEvent<TEvent>>`
  (new exported `ShowMoreEvent = {key,event,title}`). The default show-mores render a `Popover` listing the
  hidden events. Rejected "label/count only" (would leave the default popover empty).
- **Lazy-load floating-ui on first open** (not direct import): `floatingPosition.ts` dynamically
  `import('@floating-ui/core')` the first time a surface opens. Verified in the dist build — externalized +
  a single dynamic import → out of the initial bundle.

Engineering decisions:
- **Plan vs. locked-decision reconciliation:** the plan §7.5 calls floating-ui a *"fallback … lazy-loaded
  behind feature detection"* for when Anchor Positioning is missing. The **locked DECISIONS entry
  (2026-06-02) supersedes that**: floating-ui is the **permanent default** positioning engine (Anchor
  Positioning is Chromium-only). Implemented per the locked decision; flagged the stale plan prose to Cutter.
  "Lazy-loaded" is honored as a bundle optimization (dynamic import on first open), not as feature-detection.
- **Minimal DOM platform for `@floating-ui/core`:** `computePosition` needs a caller-supplied `platform`
  (core has no DOM knowledge). Because our surfaces live in the top layer (viewport-relative, `strategy:
  'fixed'`), we supply only `getElementRects`/`getDimensions`/`getClippingRect` from `getBoundingClientRect`
  + the viewport box — the small footprint the decision intends, **no `@floating-ui/dom`**. Middleware
  `[offset, flip, shift, size]`; `size` both viewport-constrains big popovers and is what calls
  `getDimensions` (so the required platform method is covered).
- **Popover = declarative `popovertarget`** (not imperative show/hide). jsdom 29 has **no** Popover/dialog
  imperative API and **no `ToggleEvent`** (probed empirically), and `popover="auto"` + a manual onClick
  double-fires against native light-dismiss. So the trigger carries `popovertarget`, the browser owns
  open/close/light-dismiss/Esc, and React only reads the panel's `toggle` event (via the `onToggle` prop —
  React wires a direct 'toggle' listener; confirmed in tests) to track open state + position. Tooltip and
  Dialog DO use the imperative API (`popover="manual"` / `showModal`) guarded by `typeof` (no-op when absent).
- **Shared `useFloatingAnchor` hook:** extracted the open→position→reposition→cleanup effect out of Popover
  and Tooltip. Concentrates the floating-ui wiring and makes the defensive empty-ref guards directly
  unit-testable (pass `{current:null}` refs) — which is how the per-file 85% branch bar is met for these
  small components.
- **Tap-reachable Tooltip (§7.7):** opens on hover **and** focus, **toggles on tap** — no hover-only
  affordance, so it works on coarse-pointer/touch.
- **Storybook show-more demonstrability (Cutter's note):** the existing stories had no day with enough
  events to surface "+N more". Added a `React/Calendar → ShowMorePopover` story (clustered events +
  `weekEventLimit={2}`) instead of mutating the shared `demoEvents` (kept the other stories' intent intact).
- **No jest-dom:** the suite uses plain matchers (`getAttribute().toBe()`, `toBeTruthy()`); native-API
  branches are covered by mocking `showPopover`/`hidePopover`/`showModal` onto the prototype via a typed
  `as unknown as {…}` cast (the `no-explicit-any` lint bars `as any`).

## 2026-06-03 — Month "+N more" is PER-DAY, not per-week (Cutter)

**Status: IMPLEMENTED 2026-06-03** (Task 4i follow-up — see PROGRESS.md).

- **Decision (Cutter):** the month overflow indicator must appear **inside the specific day cell that
  overflowed** (Google/Outlook + v1 react-big-calendar behavior), not once at the week's start. Cutter
  caught this in the Storybook `ShowMorePopover` story — events were on Jun 15 but "+3 more" rendered under
  Jun 14 (the week's first column).
- **Root cause (pre-existing, NOT from §7.5):** core models month overflow **per week** (`MonthWeek.extra`
  is a flat per-week list, from `rowSegments`), and Task 4f's adapter anchored the single indicator to
  `week.days[0]`. §7.5 only turned that existing indicator into a popover.
- **Resolution = adapter + CSS only, NO core change.** `week.extra` segments already carry `left`/`right`
  day-columns, so each overflowed segment's days are derivable. `useMonthWeeks` now computes per-day extra
  (segments whose column span covers that day) onto each `MonthDayCell`; `MonthView` renders one indicator
  per overflowing cell, grid-placed in its column at `moreRow = visibleLevels + 1` via the shared
  `--bc-seg-*` mechanism (`.bc-show-more-cell`). A multi-day overflow shows in each day it spans.
- **What was rejected:** changing the core month model to track per-day overflow (unnecessary — the column
  spans in `week.extra` are sufficient; keeps core's week-level band layout intact for multi-day alignment).
- **Scoped to month only (Cutter):** the time-grid **all-day row** indicator stays single/row-level for now;
  per-day for the all-day row is a larger TimeGridView change to revisit if wanted.

## 2026-06-04 — Selection wiring plan finalized (Cutter)

**Status: PLANNED** (canonical detail in reference repo `Upgrade_plan_prompt.md` §8.1; implementation next).

Discussed RBC's `Selection.js` vs BC's existing 1-D core FSM (`packages/core/src/selection/`, built + unit-tested, NOT yet store-wired). Locked decisions for the upcoming selection-wiring task:

- **Index space:** time body = 1-D vertical slot index per column; **month + all-day row = 1-D linear day-index across the visible grid** (one FSM, no RBC-style 2-D path; "full rows between" falls out).
- **Coordinate mapping:** real focusable DOM cells with `data-*` (`data-date`; time body gains **real per-slot cells** with `data-slot-index`), read via `closest('[data-…]')` — no pixel hit-testing. `'ignoreEvents'` enforced adapter-side via `closest('.bc-event')`.
- **Store surface:** wire one `createSelection` into the store; expose **controller actions + signals** (`start/to/complete/click/doubleClick/cancel`, `state`, `range`). Resets on view change / navigate. Separate from event selection.
- **Double-click:** core FSM **gains `doubleClick({slot})` + `'doubleClick'` SelectAction**; 250 ms click/dbl timing lives in the **adapter** (disambiguated internally so both never fire — fixes RBC's app-side debounce footgun).
- **Public callbacks emit dates:** `onSelecting({start,end})` veto; `onSelectSlot({start,end,slots[],action:'select'|'click'|'doubleClick'})`. **No `bounds`/`box`** pixel rects.
- **Keyboard (new vs RBC, closes a11y gap):** roving tabindex; Arrow=move focus, Shift+Arrow=extend, Enter/Space=commit (complete if selecting else click), Esc=cancel. Home/End/PageUp/Down stay navigation.
- **Touch:** long-press (`longPressThreshold` 250 ms, adapter-timed) + `touch-action`; core pointer-agnostic (§7.7).
- **Overlay:** `.bc-selection` grid-placed — time = vertical `--bc-top`/`--bc-height` box per column; month/all-day = one box per week-row touched (`--bc-seg-*`).
- **Required (Cutter):** a **detailed `.mdx`** in the React Storybook explaining pointer/touch/keyboard selection for manual testing; temporary home in storybook-react, final placement later.
- **Deferred:** per-resource columns / `resourceId` (no resource grouping in BC core yet).
