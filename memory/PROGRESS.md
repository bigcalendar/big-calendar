# PROGRESS

> Full history → PROGRESS-ARCHIVE.md.
> ⚠ React tests import core from `dist/`. After any core src change: `pnpm nx build core` before running react tests.

## Roadmap

- [x] Phase 0 — Foundations (scaffold, Nx, tooling, CI/CD)
- [x] Phase 1 — Localizer + spikes (TemporalLocalizer, browser spike)
- [x] Phase 2 — Core engine (store, view models, layout algos, selection FSM)
- [x] Phase 3 — Styles (`@big-calendar/styles`, `--bc-*` tokens)
- [x] Phase 4 — React MVP (CalendarProvider, views, top-layer UI, a11y)
- [x] Phase 5 — DnD (`@big-calendar/dnd` + React: move/resize/outside/keyboard)
- [x] Phase 6 — LuxonLocalizer (dual-localizer parity, `timeZone` rename)
- [ ] **Phase 7a — API surface refactor** ← CURRENT
- [ ] Phase 7b — Polish & 2.0.0 (React)
- [ ] Phase 8 — Codemods (deferred until 7a API finalized)
- [ ] Phase 9+ — Additional frameworks (Vue → Angular → Lit, one at a time)

---

## ⚠ NEXT TASK

**7a-7** — Build — multi-entry Vite config + wildcard `package.json` subpath exports.

---

## Phase 7a — task list

| # | Task | Status |
|---|---|---|
| 7a-0 | Doc updates (DECISIONS.md, PROGRESS.md, DECISIONS-ARCHIVE.md, Upgrade_plan_prompt.md) | ✅ |
| 7a-1 | Core: rename `config.views` → `config.viewDefinitions`; add `config.enabledViews`; expose `store.enabledViews` signal | ✅ |
| 7a-2 | React: add `views?: ViewKey[]` to `CalendarProps`; update `useToolbarProps` to read `store.enabledViews`; update `Calendar` dispatch to check `components.views[viewModel.view]` for all views | ✅ |
| 7a-3 | Storybook globals — `packages/storybook-shared/` with locale/TZ constants + `withLocalizerDecorator`; wired into storybook-core and storybook-react | ✅ |
| 7a-4 | `@big-calendar/styles` MDX documentation page — all `.bc-*` classes, nesting, CSS custom property overrides | ✅ |
| 7a-5 | `src/` restructure — move internal hooks to top-level public folders; promote `AgendaEventButton` + all `Default*` components to public | ✅ |
| 7a-6 | Hook extraction — `useMonthView`, `useTimeGridView` (split: `useTimeGridHeader` / `useTimeGridBody`), `useAgendaView`; element-spread pattern (className + data-* + handlers + refs + aria per group) | ✅ |
| **7a-7** | **Build — multi-entry Vite config + wildcard `package.json` subpath exports** | ← next |
| 7a-8 | Tests — update imports throughout; verify per-file coverage bars | — |
| 7a-9 | Stories — MDX + interactive stories for each newly-public component/hook; all stories include `withLocalizerDecorator` | — |

---

## Reference

Test counts (last green run — 7a-6 hook extraction): localizer: 45 · core: 493 · dnd: 36 · react: 329 · **total: 903**

Coverage bar: **per-file** 85% branch / 95% function (not a global average).

Architecture decisions: DECISIONS.md 2026-06-10 "Phase 7 redesign".

## Quick resume

```bash
git checkout feat/initial
pnpm install
pnpm exec nx run-many -t lint typecheck test build
```
