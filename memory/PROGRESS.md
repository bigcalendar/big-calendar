# PROGRESS

> Phase 5 active. Full history → PROGRESS-ARCHIVE.md.
> ⚠ React tests import core from `dist/`. After any core src change: `pnpm nx build core` before running react tests.

## Current phase

**Phase 5 — DnD** — complete. All tail items shipped on `feat/initial`. Full detail in PROGRESS-ARCHIVE.md.
Architecture: DECISIONS.md 2026-06-07 "Phase 5 (DnD) opened".

Phase 5 tail summary:
- Resource columns (1a/1b/1c), DnD move/resize/keyboard (5a–5g), timed→all-day promotion, DnD gating, drag affordances (`dndEnabled`), `clsx` refactor — all done and committed.

## ⚠ NEXT

**Phase 6 — `localizer-luxon`** (per §14 roadmap; codemods deferred until requested)

Tasks (in order):
1. **`@big-calendar/localizer-luxon`** — implement `LuxonLocalizer` extending `@big-calendar/localizer` base; `luxon` as `peerDependency`.
2. **Dual-localizer parity retrofit** — update existing core/react tests that use cast-fakes to the `describe.each([temporal, luxon])` pattern (§5.5 tech debt). A behavior is only "passing" when it passes identically under both localizers.

## Test counts (last green run)

core: 264 · dnd: 36 · react: 215

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
