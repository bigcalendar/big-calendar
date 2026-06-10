# PROGRESS

> Phase 5 active. Full history → PROGRESS-ARCHIVE.md.
> ⚠ React tests import core from `dist/`. After any core src change: `pnpm nx build core` before running react tests.

## Current phase

**Phase 5 — DnD** — exit criteria met. Tail items on `feat/initial` (resource columns 1a/1b/1c done; DnD gating next).
Architecture: DECISIONS.md 2026-06-07 "Phase 5 (DnD) opened".

## Phase 5 tail — completed (uncommitted unless noted)

- Format split: `dayColumnHeader` / `dayHeader` (2026-06-09) ✓ — commit 6b1072a
- Resource grid scroll architecture (sticky head + frozen gutter, subgrid) (2026-06-09) ✓
- Task 1a: Day view resource columns + `resourceId` everywhere ✓ — commits 08823ac, 3a4d118
- Task 1b: Week view resource-major (two-tier header + per-resource all-day) ✓ — commit 3a4d118
- Task 1c: Day-major week ordering (`resourceLayout:'day'`) ✓ — landed in commit 3a4d118 alongside 1b
- Task 5a: Event MOVE end-to-end (month/day-mode) ✓ — commit d1e4890
- Task 5b: Time-grid (`'time'`) event MOVE ✓
- Task 5c: Time-grid event RESIZE + live preview overlay ✓
- Task 5d: Drop-from-outside / drag-out (HTML5 + Pragmatic) ✓ — commit 1678f6a (native drop fix)
- Task 5e: Keyboard DnD — time-grid modal grab ✓ — commit 06cc9ba
- Task 5f: Month drop-from-outside + month resize + pointer move preview ✓ — commit 8e2afce
- Task 5g: Month keyboard DnD ✓ — commit 8e2afce
- Timed→all-day promotion (one-way) ✓ — commit a7a2284
- Dedicated `@big-calendar/react/dnd` subpath entry ✓ — commit 73bf489
- Start-edge keyboard resize (`Shift+Alt+arrow`) ✓ — commit da76e6b; `grabResize.edge`
- Slot/event handler separation + move-to-core (`store.eventHandlers`) ✓
- Phase 4 complete & pushed (commits d790ca4..b5b5914: selection + 2m view registry + §7.7)
- Phases 0–3 complete & pushed. Full detail in PROGRESS-ARCHIVE.md.

## ⚠ NEXT

**DnD gating** — gate keyboard grab on `store.isDraggable`; gate keyboard resize on `store.isResizable`.
Both gates go in `createCalendarStore` (`grabEvent` + `grabResize`) so every future adapter gets them for free.
Pragmatic pointer DnD already gates correctly via `canDrag` in `bindCalendarDnd`.

## Test counts (last green run)

core: 263 · dnd: 36 · react: 207

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
