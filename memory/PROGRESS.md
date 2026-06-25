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
- [ ] **Phase 8 — Codemods** ← CURRENT
- [ ] Phase 9+ — Additional frameworks (Vue → Angular → Lit, one at a time)

---

## ⚠ NEXT TASK

**Phase 8 — 8-1 rename-imports transform.** Start here: `packages/codemods/src/transforms/rename-imports.ts`, jscodeshift `tsx` parser, replaces all `react-big-calendar` imports with `@big-calendar/react`. Handles `.js .jsx .ts .tsx`. Then continue 8-2 through 8-8 CLI in order.

---

## Phase 8 — Codemods task list

Transforms: jscodeshift `tsx` parser handles `.js .jsx .ts .tsx`. All live in `packages/codemods/src/transforms/`.

| # | Task | Status |
|---|---|---|
| 8-1 | `rename-imports`: `react-big-calendar` → `@big-calendar/react` | [ ] |
| 8-2 | `merge-accessors`: 11 `*Accessor` props → `accessors={{ … }}` object | [ ] |
| 8-3 | `rename-callbacks`: `onSelectEvent` → `onEventClick`, `onDoubleClickEvent` → `onEventDoubleClick` | [ ] |
| 8-4 | `rename-props`: misc prop renames (`resourceGroupingLayout` → `resourceLayout`, etc.) | [ ] |
| 8-5 | `flag-removed-props`: props with no equivalent — inject `// TODO: removed — …` comment | [ ] |
| 8-6 | `views-prop`: array/object `views` → `views` array + optional `viewDefinitions` | [ ] |
| 8-8 | CLI runner (`npx @big-calendar/codemods`) — wires all transforms, accepts `--dry-run`, glob or dir | [ ] |
| 8-7 | `wrap-provider` (opt-in): wraps `<Calendar>` in `<CalendarProvider>` | [ ] |
| 8-9 | Migration guide MDX in `storybook-core` | [ ] |

---

## Reference

Test counts (entering Phase 8): localizer: 45 · core: 493 · dnd: 36 · react: 357 · **total: 931**

Coverage bar: **per-file** 85% branch / 95% function (not a global average).

Architecture decisions: DECISIONS-ARCHIVE.md — Phase 5 DnD + Phase 7 API surface entries.

## Quick resume

```bash
git checkout feat/initial
pnpm install
pnpm exec nx run-many -t lint typecheck test build
```
