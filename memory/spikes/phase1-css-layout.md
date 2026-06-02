# Phase 1 Spike — Modern CSS Layout & Top-Layer Support Matrix

> Plan refs: §8 (Big Question #1), §6 (styles), §15.4 (support floor), §14 (Phase 1 exit criterion
> "spike report committed"). Decision recorded in `memory/DECISIONS.md` (2026-06-01 Phase 1 Task 1c).

## What this spike answers

Whether the four modern CSS/HTML capabilities the rewrite leans on are safe to depend on, and what the
fallback is where they are not:

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
Cross-engine for ~2+ years. Use it for the month grid (weeks as subgrid rows) and the time grid
(day columns sharing the parent's row tracks), per §8.1. This is the load-bearing choice that removes
JS measurement.
**Fallback (older engines only):** a flat grid with explicit, duplicated row-track definitions on each
row container; multi-day event-row alignment then needs the layout algorithm's normalized fractions
(which `core` already emits) rather than `subgrid` inheritance. Acceptable degradation, not pixel-perfect.

### Popover API — ADOPT (top-layer mechanism)
Cross-engine since Firefox shipped it (Apr 2024). Use `popover` (+ `popovertarget`, `::backdrop`,
light-dismiss) for popups, the "show more" overflow, tooltips, and dialogs — this gives real top-layer
stacking (escapes `overflow`/`z-index`/transform containing blocks) for free.
**Fallback (pre-2024 engines):** a JS-managed portal overlay (render to a body-level container) with a
manual focus trap and a high stacking context. This is the one piece `@floating-ui` does **not** solve —
floating-ui positions but does not provide top-layer stacking.

### `:dir()` — ADOPT (with a cheap fallback), RTL via logical properties
Cross-engine since ~Dec 2023. Combined with CSS logical properties (`inline-start`/`block-end`/etc.,
which are universally supported) this delivers RTL with **no `rtl` prop**, per §6/§9.
**Fallback:** `[dir="rtl"] …` attribute selectors. Trivial, fully supported, so RTL has effectively no
support risk — logical properties do the heavy lifting and `:dir()` is only sugar.

### Anchor Positioning — DO **NOT** depend on; progressive enhancement only
This is the **only non-Baseline** capability of the four: Chromium-only in stable as of the cutoff, with
Safari and Firefox **not yet shipping it in stable** (most-uncertain row — verify). Per §15.4, the
support floor for the rewrite is therefore set **without** anchor positioning.
**Decision:** **`@floating-ui/core` is the default positioning engine** for tethered top-layer elements
(it is already a dependency of `@big-calendar/react`, plan §11). Native CSS anchor positioning may be
layered on later as a progressive enhancement (feature-detect `CSS.supports('anchor-name: --x')`), but
nothing in the baseline relies on it.

## Resulting support floor (sets §15.4)

- **Baseline-2024 capable engines** (subgrid + Popover + `:dir()` + logical properties): full fidelity,
  zero JS layout measurement, native top layer.
- **Positioning:** always via `@floating-ui/core` (not CSS `anchor()`), so positioning is engine-agnostic.
- **Older engines:** degrade via the per-capability fallbacks above; layout stays correct (fractions come
  from `core`), only subgrid auto-alignment and native top-layer are emulated.

## Fallback matrix (quick reference)

| Capability | If unsupported, fall back to | Owner |
|---|---|---|
| Subgrid | flat grid + explicit row tracks; alignment from `core` fractions | `@big-calendar/styles` + `core` layout algo |
| Popover top layer | JS portal overlay + focus trap + stacking context | `@big-calendar/react` (top-layer component, §7.5) |
| Anchor positioning | `@floating-ui/core` (the default — not a fallback) | `@big-calendar/react` |
| `:dir()` | `[dir="rtl"]` selectors + logical properties | `@big-calendar/styles` |

## Watch-items / follow-ups

- **Phase 3 (empirical):** add Playwright cross-browser checks (Chromium/WebKit/Firefox) for subgrid
  alignment, Popover top-layer + light-dismiss, and `:dir()` flips once the layout components exist;
  confirm the desk-spike versions above against live engines and update this file.
- **Re-verify anchor-positioning** Safari/Firefox stable status before any decision to promote it from
  progressive-enhancement to baseline.
- Track Baseline "Widely available" promotion dates for subgrid/Popover/`:dir()` to relax fallbacks later.
