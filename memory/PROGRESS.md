# PROGRESS

> Full history → PROGRESS-ARCHIVE.md · Task details → DECISIONS.md / DECISIONS-ARCHIVE.md

## Roadmap

- [x] Phase 0–10 — Foundations, Core, Styles, React, DnD, Luxon, API refactor, Codemods, MCP, Vue
- [x] **Phase 11 — Angular adapter (`@big-calendar/angular` + DnD)** ← just completed
- [ ] Phase 12+ — Additional frameworks (Lit, Svelte, one at a time)

---

## ⚠ NEXT TASK

**Commit Phase 11.** Stage all Phase 11 work in `packages/angular/` → commit → push to `feat/initial`. Then begin Phase 12 planning.

---

## Reference

Test counts (entering Phase 11): localizer: 53 · localizer-temporal: 21 · localizer-luxon: 20 · core: 553 · dnd: 36 · react: 379 · vue: 218 · mcp: 64 · codemods: 82 · **total: 1,426**

Coverage bar: **per-file** 85% branch / 95% function (not a global average).

Architecture decisions: DECISIONS.md (Phase 11+) · DECISIONS-ARCHIVE.md (Phase 0–10).

## Quick resume

```bash
git checkout feat/initial
pnpm install
pnpm exec nx run-many -t lint typecheck test build
```
