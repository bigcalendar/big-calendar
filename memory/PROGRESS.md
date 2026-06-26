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
- [ ] **Phase 10 — Vue adapter (`@big-calendar/vue` + DnD)** ← CURRENT
- [ ] Phase 11+ — Additional frameworks (Angular → Lit, one at a time)

---

## ⚠ NEXT TASK

**Phase 9 — COMPLETE.** Next: Phase 10 Task 10-1 — `@big-calendar/vue` package scaffold.

---

## Phase 10 — Vue adapter task list

| # | Task | Status |
|---|---|---|
| 10-1 | Package scaffold — `packages/vue`, Vue 3 + `@preact/signals-core` peerDeps, workspace wiring, tsconfig, vitest config (jsdom + Vue Test Utils), Storybook (`@storybook/vue3-vite`) wired into core composition hub | [ ] |
| 10-2 | Signals bridge — `useCalendarStore` composable wrapping `createCalendarStore`; bridge `@preact/signals-core` signals to Vue reactivity via `watchEffect` and `computed` refs | [ ] |
| 10-3 | Context — `CalendarProvider.vue` (Vue `provide`/`inject`), `useCalendarContext()` composable, messages and localizer direction threaded through | [ ] |
| 10-4 | View model composables — `useMonthView`, `useTimeGridView`, `useAgendaView` (Vue ports of the React headless hooks) | [ ] |
| 10-5 | View components — `MonthView.vue`, `TimeGridView.vue` (Week / Work Week / Day), `AgendaView.vue`; slot customization mirroring React's `components` prop pattern | [ ] |
| 10-6 | `Calendar.vue` shell + `DefaultToolbar.vue` | [ ] |
| 10-7 | Top-layer UI — `Popover.vue`, `Tooltip.vue`, `Dialog.vue` using Vue `<Teleport>` + `<Transition>` + `@floating-ui/dom` | [ ] |
| 10-8 | Accessibility — slot selection (`useRovingSelection`), event roving (`useEventRoving`), keyboard nav, aria attributes; a11y test assertions | [ ] |
| 10-9 | DnD adapter — `useCalendarDnd` composable wiring `@big-calendar/dnd` into the Vue component tree; keyboard DnD (`useKeyboardDnd`); pointer move + resize previews | [ ] |
| 10-10 | Tests — unit tests for all composables, component tests for all view components and the Calendar shell (Vue Test Utils + vitest, per-file 85% branch / 95% function) | [ ] |
| 10-11 | Documentation — `.stories` files for all exported components, MDX concept docs mirroring React where applicable (noting Vue-specific patterns), package README, MCP `api/` + `recipes/` resources updated | [ ] |

---

## Reference

Test counts (entering Phase 10): localizer: 53 · localizer-temporal: 21 · localizer-luxon: 20 · core: 553 · dnd: 36 · react: 379 · mcp: 64 · codemods: 82 · **total: 1208**

Coverage bar: **per-file** 85% branch / 95% function (not a global average).

Architecture decisions: DECISIONS.md (standing rules + Phase 10 decisions) · DECISIONS-ARCHIVE.md (Phase 0–9).

## Quick resume

```bash
git checkout feat/initial
pnpm install
pnpm exec nx run-many -t lint typecheck test build
```
