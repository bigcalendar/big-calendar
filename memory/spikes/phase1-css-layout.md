# Phase 1 Spike — Modern CSS Layout & Top-Layer Support Matrix

> Plan refs: §8 (Big Question #1), §6 (styles), §15.4 (support floor), §14 (Phase 1 exit criterion
> "spike report committed"). Decision recorded in `memory/DECISIONS.md` (2026-06-01 Phase 1 Task 1c).

## What this spike answers

Whether the four modern CSS/HTML capabilities the rewrite leans on are safe to depend on under a
**Baseline-2024 support floor** (no engines before 2024, no pre-2024 fallbacks):

1. **CSS Subgrid** — month-grid + time-grid alignment without JS measurement (§8.1).
2. **Popover API** (`popover` attr + top layer) — popups, "show more", tooltips, dialogs (§7.5, §9 Popups).
3. **CSS Anchor Positioning** (`anchor-name` / `position-anchor` / `anchor()` / `position-try`) — tethering
   those top-layer elements to their triggers.
4. **CSS `:dir()`** — RTL handling without an `rtl` prop (§6, §9 RTL).

> ⚠️ **Method & certainty.** This is a **desk spike** compiled from web-platform support knowledge as of
> the assistant's **January 2026** knowledge cutoff — it is **not** an automated cross-browser test run
> (the implementation environment can't launch browsers). Treat version numbers as *approximate* and
> **re-verify against caniuse.com / MDN / the web.dev Baseline widget at implementation time.** Items
> flagged "uncertain" below are the ones most worth confirming. Empirical verification with Playwright is
> scheduled as a Phase-3 watch-item (see bottom), once real layout components exist to test.

## Support matrix

| Capability | Chrome / Edge | Safari | Firefox | Baseline status (≈) | Confidence |
|---|---|---|---|---|---|
| **Subgrid** | ✅ 117 (Sep 2023) | ✅ 16.0 (Sep 2022) | ✅ 71 (2019) | **Newly available** since Sep 2023; approaching/at Widely available by 2026 | High |
| **Popover API** | ✅ 114 (2023) | ✅ 17.0 (Sep 2023) | ✅ 125 (Apr 2024) | **Newly available** since ~Apr 2024 | High |
| **`:dir()`** | ✅ 120 (Dec 2023) | ✅ 16.4 (2023) | ✅ long-standing (~49) | **Newly available** since ~Dec 2023 | High |
| **Anchor Positioning** | ✅ 125 (2024) | ❌ not in stable (TP/in-dev) | ❌ behind flag / in-dev | **Limited availability** (Chromium-only) — **NOT Baseline** | Medium — verify Safari/FF status |

## Findings

### Subgrid — ADOPT (primary layout mechanism)
Cross-engine since ~2022–2023, well inside the Baseline-2024 support floor. Use it for the month grid
(weeks as subgrid rows) and the time grid (day columns sharing the parent's row tracks), per §8.1. This
is the load-bearing choice that removes JS measurement. No fallback — it is depended on unconditionally.

### Popover API — ADOPT (top-layer mechanism)
Cross-engine since Firefox shipped it (Apr 2024) — the latest of the four to land, but inside the
Baseline-2024 floor. Use `popover` (+ `popovertarget`, `::backdrop`, light-dismiss) for popups, the
"show more" overflow, tooltips, and dialogs — this gives real top-layer stacking (escapes
`overflow`/`z-index`/transform containing blocks) for free. No fallback — depended on unconditionally.
Note the division of labor: the Popover API provides **top-layer stacking**; `@floating-ui/core`
provides **positioning**. They are complementary, not alternatives.

### `:dir()` — ADOPT, RTL via logical properties
Cross-engine since ~Dec 2023, inside the Baseline-2024 floor. Combined with CSS logical properties
(`inline-start`/`block-end`/etc.) this delivers RTL with **no `rtl` prop**, per §6/§9. No fallback —
depended on unconditionally.

### Anchor Positioning — DO **NOT** depend on; progressive enhancement only
This is **not** a back-compat concern — it is the one capability of the four that is **still not
cross-engine in *current* browsers.** As of the Jan-2026 cutoff it is Chromium-only in stable; Safari
and Firefox **have not shipped it in stable** (most-uncertain row — verify). So even under a strict
"no engines before 2024" floor, anchor positioning is excluded because today's Safari/Firefox lack it.
**Decision:** **`@floating-ui/core` is the default positioning engine** for tethered top-layer elements
(it is already a dependency of `@big-calendar/react`, plan §11). This is a permanent default, not a
legacy fallback. Native CSS anchor positioning may be layered on later as a progressive enhancement
(feature-detect `CSS.supports('anchor-name: --x')`) once it is cross-engine — but nothing relies on it.

## Resulting support floor (sets §15.4)

- **Floor = Baseline 2024.** We support no engine released before 2024; there are **no pre-2024
  fallbacks.** Subgrid, Popover, `:dir()`, and logical properties are all inside this floor and are
  depended on **unconditionally** — full fidelity, zero JS layout measurement, native top layer.
- **Positioning:** always via `@floating-ui/core` (not CSS `anchor()`). This is a permanent default
  because anchor positioning is not yet cross-engine in current browsers — not a concession to old ones.

## Watch-items / follow-ups

- **Phase 3 (empirical):** add Playwright cross-browser checks (Chromium/WebKit/Firefox) for subgrid
  alignment, Popover top-layer + light-dismiss, and `:dir()` flips once the layout components exist;
  confirm the desk-spike versions above against live engines and update this file.
- **Re-verify anchor-positioning** Safari/Firefox stable status before any decision to promote it from
  progressive-enhancement to baseline.
- Track Baseline "Widely available" promotion dates for subgrid/Popover/`:dir()` to relax fallbacks later.
