# PROGRESS

> Phase 5 active. Full history → PROGRESS-ARCHIVE.md.
> ⚠ React tests import core from `dist/`. After any core src change: `pnpm nx build core` before running react tests.

## Current phase

**Phase 5 — DnD** — complete. All tail items shipped on `feat/initial`. Full detail in PROGRESS-ARCHIVE.md.
Architecture: DECISIONS.md 2026-06-07 "Phase 5 (DnD) opened".

Phase 5 tail summary:
- Resource columns (1a/1b/1c), DnD move/resize/keyboard (5a–5g), timed→all-day promotion, DnD gating, drag affordances (`dndEnabled`), `clsx` refactor — all done and committed.

## Current work — Phase 6 complete

- `LuxonLocalizer` implemented (commit 02ca87b) ✓
- Dual-localizer parity retrofit complete (commit 20de37f) ✓ — LOCALIZER_CASES now includes both localizers; all existing `describe.each` suites run against both automatically; smoke tests and formatEventTime converted.

## ⚠ NEXT

**Phase 7 — Polish & 2.0.0 (React)** (per §14 roadmap)

- Docs pass (storybook-core API docs, selection `.mdx`, top-layer docs)
- Perf benchmarks vs v1
- Bundle-size budgets
- Release: composed Storybook site (core + react) deployed; `2.0.0` published

## Test counts (last green run)

core: 469 · dnd: 36 · react: 337

## Quick resume

```bash
git checkout feat/initial
pnpm install
pnpm exec nx run-many -t lint typecheck test build
```

Coverage bar: per-file 85% branch / 95% function.
Core dist rebuild needed before react tests after any core source change:
```bash
pnpm nx build core
```
