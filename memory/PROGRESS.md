# PROGRESS

> Full history → PROGRESS-ARCHIVE.md.

## Roadmap

- [x] Phase 0 — Foundations (scaffold, Nx, tooling, CI/CD)
- [x] Phase 1 — Localizer + spikes (TemporalLocalizer, browser spike)
- [x] Phase 2 — Core engine (store, view models, layout algos, selection FSM)
- [x] Phase 3 — Styles (`@big-calendar/styles`, `--bc-*` tokens)
- [x] Phase 4 — React MVP (CalendarProvider, views, top-layer UI, a11y)
- [x] Phase 5 — DnD (`@big-calendar/dnd` + React: move/resize/outside/keyboard)
- [x] Phase 6 — LuxonLocalizer (dual-localizer parity, `timeZone` rename)
- [x] **Phase 7a — API surface refactor**
- [x] **Phase 7b — Polish (accessors unification + type story)**
- [x] **Phase 8 — Codemods**
- [x] **Phase 9 — MCP server (`@big-calendar/mcp`)**
- [x] **Phase 10 — Vue adapter (`@big-calendar/vue` + DnD)**
- [ ] **Phase 11 — Angular adapter (`@big-calendar/angular` + DnD)** ← CURRENT
- [ ] Phase 12+ — Additional frameworks (Lit, Svelte, one at a time)

---

## ⚠ NEXT TASK

**Phase 11 Task 11-3** — `CalendarProviderComponent` (standalone) + `CALENDAR_TOKEN` injection token + `injectCalendar()` helper.

---

## Phase 11 — Angular adapter task list

| # | Task | Status |
|---|---|---|
| 11-1 | Package scaffold — `packages/angular`, Angular (check `npm show @angular/core dist-tags` at task start; target latest LTS − 1, currently expected Angular 20), standalone components, `@angular/cdk` peer dep, workspace wiring, tsconfig, Vitest config (`@analogjs/vitest-angular` + jsdom), Storybook (`@storybook/angular`) wired into composition hub at port 6009 | [x] |
| 11-2 | Signals bridge — `injectCalendarStore(config)` factory composable; bridge `@preact/signals-core` signals to Angular signals via `computed()` + `effect()`; `toAngularSignal(preactSignal)` utility | [x] |
| 11-3 | Context — `CalendarProviderComponent` (standalone), `CALENDAR_TOKEN` injection token, `injectCalendar()` helper; messages and localizer threaded through Angular DI; `CalendarProviderComponent` owns store lifecycle (create on init, destroy on destroy) | [ ] |
| 11-4 | View model inject composables — `injectMonthView()`, `injectTimeGridView()`, `injectAgendaView()` (Angular signals derived from core view models; call `injectCalendar()` internally) | [ ] |
| 11-5 | View components — `MonthViewComponent`, `TimeGridViewComponent` (Week / WorkWeek / Day), `AgendaViewComponent`; slot customization via `ng-template` input properties (e.g. `[bcMonthEvent]`, `[bcTimeEvent]`, `[bcAgendaDate]`) mirroring React's `components` prop pattern | [ ] |
| 11-6 | `CalendarComponent` shell (dispatches view by `viewModel.kind`) + `DefaultToolbarComponent`; re-exports barrel for single-import convenience | [ ] |
| 11-7 | Top-layer UI — `BcPopoverComponent`, `BcTooltipComponent`, `BcDialogComponent`; popover/tooltip use Angular CDK Overlay + `@floating-ui/dom` positioning; dialog wraps native `<dialog>` (same as React/Vue) | [ ] |
| 11-8 | Accessibility — `BcRovingSelectionDirective`, `BcEventRovingDirective`, keyboard nav, `aria-describedby` instruction elements; a11y assertion tests | [ ] |
| 11-9 | DnD adapter — `CalendarDndDirective` + `CalendarDndService` wiring `@big-calendar/dnd`; keyboard DnD (`useKeyboardDnd` as Angular service); pointer move + resize live previews | [ ] |
| 11-10 | Tests — unit tests for all inject composables, directives, and services; component tests for view components and CalendarComponent (`TestBed` + `@analogjs/vitest-angular`, per-file 85% branch / 95% function) | [ ] |
| 11-11 | Documentation — `.stories` files for all exported components in same order as React/Vue stories; MDX concept docs mirroring React/Vue (Angular-specific patterns noted); package README; MCP `api/` + `recipes/` resources updated for Angular | [ ] |

---

## Reference

Test counts (entering Phase 11): localizer: 53 · localizer-temporal: 21 · localizer-luxon: 20 · core: 553 · dnd: 36 · react: 379 · vue: 218 · mcp: 64 · codemods: 82 · **total: 1,426**

Coverage bar: **per-file** 85% branch / 95% function (not a global average).

Architecture decisions: DECISIONS.md (standing rules + Phase 11 decisions) · DECISIONS-ARCHIVE.md (Phase 0–10).

## Quick resume

```bash
git checkout feat/initial
pnpm install
pnpm exec nx run-many -t lint typecheck test build
```
