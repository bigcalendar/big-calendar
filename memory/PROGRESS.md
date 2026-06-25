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
- [ ] Phase 9+ — Additional frameworks (Vue → Angular → Lit, one at a time) ← CURRENT

---

## ⚠ NEXT TASK

**Phase 9 — Additional frameworks.** Start with Vue adapter (Vue 3 + `@big-calendar/vue`), following the same package structure as `@big-calendar/react`.

---

## Phase 8 — Codemods task list (COMPLETE)

| # | Task | Status |
|---|---|---|
| 8-1 | `rename-imports` | [x] |
| 8-2 | `merge-accessors` | [x] |
| 8-3 | `rename-callbacks` | [x] |
| 8-4 | `rename-props` | [x] |
| 8-5 | `flag-removed-props` | [x] |
| 8-6 | `views-prop` | [x] |
| 8-8 | CLI runner (`npx @big-calendar/codemods`) | [x] |
| 8-7 | `wrap-provider` | [x] |
| 8-9 | Migration guide MDX | [x] |

---

## Reference

Test counts (entering Phase 9): localizer: 45 · core: 493 · dnd: 36 · react: 357 · codemods: 82 · **total: 1013**

Coverage bar: **per-file** 85% branch / 95% function (not a global average).

Architecture decisions: DECISIONS-ARCHIVE.md — Phase 5 DnD + Phase 7 API surface entries.

## Quick resume

```bash
git checkout feat/initial
pnpm install
pnpm exec nx run-many -t lint typecheck test build
```
