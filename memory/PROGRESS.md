# PROGRESS

> Full history → PROGRESS-ARCHIVE.md · Task details → DECISIONS.md / DECISIONS-ARCHIVE.md

## Roadmap

- [x] Phase 0–10 — Foundations, Core, Styles, React, DnD, Luxon, API refactor, Codemods, MCP, Vue
- [x] Phase 11 — Angular adapter (`@big-calendar/angular` + DnD, stories, MDX, MCP recipe, Playwright suite)
- [x] Phase 12 — Lit adapter (`@big-calendar/lit` + DnD, stories, MDX, MCP recipe, Playwright spec)
- [ ] **Phase 13+ — Additional frameworks (Svelte, one at a time)** ← next

---

## ⚠ NEXT TASK

**Phase 13: Svelte adapter** (or other prioritized work — confirm with Cutter).

---

## Phase 12 task list

| Task | Description | Status |
|---|---|---|
| 12-1 | Bootstrap package scaffold | done |
| 12-2 | Lit custom elements — CalendarElement, MonthViewElement, TimeGridViewElement, AgendaViewElement (light DOM, reactive controllers) | done |
| 12-3 | DnD support — CalendarDndController, keyboard DnD, drop-from-outside | done |
| 12-4 | Storybook setup — main.ts, preview.ts, localizer decorator, harness.ts | done |
| 12-5 | Canonical stories with Controls + Actions wired | done |
| 12-6 | Canonical MDX docs | in-progress (agent writing 24 files) |
| 12-7 | Package README | done |
| 12-8 | MCP resources updated for Angular + Lit | done |
| 12-9 | storybook-site composite registration | done |
| 12-10 | Playwright parity validation vs React | done (compare-lit-react.spec.js created) |
| 12-11 | Full validation suite (typecheck, lint, test, build) | done — all 13 projects pass |
| — | Root README updated for Angular + Lit | done |
| — | vue:build fixed (25 missing index.ts barrel files) | done |
| — | react:build fixed (missing DefaultBackgroundEvent/index.ts) | done |
| — | mcp:test fixed (resource counts 12→13, recipe counts 7→8) | done |

---

## Reference

Test counts (entering Phase 12): localizer: 53 · localizer-temporal: 21 · localizer-luxon: 20 · core: 553 · dnd: 36 · react: 379 · vue: 218 · angular: TBD · mcp: 64 · codemods: 82 · **total: ~1,426+**

Coverage bar: **per-file** 85% branch / 95% function (not a global average).

Architecture decisions: DECISIONS.md (Phase 11+) · DECISIONS-ARCHIVE.md (Phase 0–10).

## Quick resume

```bash
git checkout feat/initial
pnpm install
pnpm exec nx run-many -t lint typecheck test build
```
