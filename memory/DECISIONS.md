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
