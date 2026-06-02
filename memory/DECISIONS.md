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
