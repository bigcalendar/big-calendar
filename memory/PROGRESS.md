# PROGRESS

> Full history → PROGRESS-ARCHIVE.md · Task details → DECISIONS.md / DECISIONS-ARCHIVE.md

## Roadmap

- [x] Phase 0–10 — Foundations, Core, Styles, React, DnD, Luxon, API refactor, Codemods, MCP, Vue
- [x] Phase 11 — Angular adapter (`@big-calendar/angular` + DnD, stories, MDX, MCP recipe, Playwright suite)
- [x] Phase 12 — Lit adapter (`@big-calendar/lit` + DnD, stories, MDX, MCP recipe, Playwright spec)
- [x] **Phase 13 — Svelte 5 adapter (`@big-calendar/svelte`)**

---

## ⚠ NEXT TASK

**Phase 14** — TBD (Phase 13 complete)

---

## Phase 13 task list

| Task | Description | Status |
|---|---|---|
| 13-1 | Bootstrap package scaffold (package.json, project.json, tsconfig.json, vite.config.ts, vitest.config.ts, alias entry) | done |
| 13-2 | Signal bridge + core primitives (fromSignal.svelte.ts, geometryStyles.ts, calendarProps.type.ts) | done |
| 13-3 | Context system (calendarContext.ts, useCalendarContext.ts, useCalendarStore.svelte.ts, CalendarProvider.svelte) | done |
| 13-4 | Internal composables (useEventRoving, useRovingSelection, useSlotSelection, useKeyboardDnd, useMonthRowMeasure, useFloatingAnchor) | done |
| 13-5 | Data composables (useMonthWeeks, useTimeGrid*, useAgendaRows, useToolbarProps, useAgendaView, useMonthView, useTimeGridView, useTimeGridBody, useTimeGridHeader) | done |
| 13-6 | Default slot components + EventButton + Dialog/Popover/Tooltip | done |
| 13-7 | View composables + view components (AgendaView.svelte, MonthView.svelte, TimeGridView.svelte) | done |
| 13-8 | Toolbar + Calendar.svelte + barrel index.ts + DnD (useCalendarDnd.svelte.ts) | done |
| 13-9 | Unit tests — 173 tests passing (fromSignal, CalendarProvider, useCalendarStore, useSlotSelection, useRovingSelection, useKeyboardDnd, useMonthRowMeasure, useCalendarDnd, useMonthView, useAgendaView, useTimeGridView/Body/Header) | done |
| 13-10 | Storybook setup (main.ts, preview.ts, withSvelteLocalizerDecorator.ts, localizerRef.ts, harness.ts, demoEvents.ts) — port 6011 | done |
| 13-11 | Canonical stories — all .stories.ts files with Controls + Actions wired | done |
| 13-12 | Canonical MDX docs — all 24+ MDX files | done |
| 13-13 | Package README | done |
| 13-14 | MCP resources + storybook-site registration + root README updated for Svelte | done |
| 13-15 | Playwright parity spec (compare-svelte-react.spec.js) | done |
| 13-16 | Full validation suite — typecheck, lint, test, build all packages; resolve any failures | done |

---

## Reference

Test counts (entering Phase 13): localizer: 53 · localizer-temporal: 21 · localizer-luxon: 20 · core: 553 · dnd: 36 · react: 379 · vue: 218 · lit: TBD · angular: TBD · mcp: 64 · codemods: 82 · **total: ~1,426+**

Coverage bar: **per-file** 85% branch / 95% function (not a global average).

Architecture decisions: DECISIONS.md (Phase 11+) · DECISIONS-ARCHIVE.md (Phase 0–10).

## Quick resume

```bash
git checkout feat/initial
pnpm install
pnpm exec nx run-many -t lint typecheck test build
```
