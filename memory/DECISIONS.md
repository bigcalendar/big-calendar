# DECISIONS — Active (Phase 11 onward)

> Phase 0–10 decisions archived to `DECISIONS-ARCHIVE.md` (with topic index).
> Add new entries here; archive when a phase is fully closed.

---

## Standing rule — Cross-framework adapter parity (Phase 11+, ongoing)

### 2026-06-30 — ADAPTER_STANDARDS.md is the single source of truth for all adapter work

**What was decided:** All framework adapter work (new adapters, feature additions, HTML/CSS changes, Storybook wiring) must satisfy the rules in `memory/ADAPTER_STANDARDS.md` before being declared done. The rules are:

- `@big-calendar/*` packages accessed only via alias (defined in `packages/aliases.ts`; wired in each Storybook's `viteFinal` and each vitest config).
- DECISIONS.md and DECISIONS-ARCHIVE.md reviewed before starting; ERRORS.md checked for similar past failures.
- Every adapter ships the full canonical story file list, in the same order, with the same story names and the same `argTypes` descriptions.
- Storybook toolbar localizer controls always wired to change rendered output (via `useLocalizerContext` / `localizerRef`).
- All rendered HTML uses the same `bc-*` class names and `data-bc-*` attributes as defined in `packages/styles`; no adapter-specific class names.
- All Controls panel inputs drive story output; no dead controls.
- All `on*` callbacks wired via Storybook `fn()` and logged to the Actions panel.
- DnD and resize functional and wired (`onEventDrop`, `onEventResize`); keyboard DnD works.
- Each adapter passes the 8-step verification checklist (build, tests, Storybook startup, visual parity via Playwright, styles, Actions, Controls, storybook-site composite).

**Why:** React, Vue, and Angular adapters each required the same class of debugging work — missing all-day rows, wrong class names, dead Controls, unlogged Actions, DnD not wired — caught after the fact and fixed one adapter at a time. These rules force the issues to be caught at build time or before sign-off rather than discovered in a follow-up session.

**What was rejected:**
- Per-adapter checklists in individual memory entries — too scattered; a single authoritative document is easier to enforce and update.
- "Best-effort parity" — too vague; specific verifiable criteria are required.

---

## Standing rule — Documentation and MCP sync (Phase 10+, ongoing)

### 2026-06-26 — All new code ships with documentation; MCP resources stay in sync

**What was decided:** Every new package, component, composable, or API surface must ship documentation in the same phase it is built. This is tracked as an explicit task in each phase (the `10-11` pattern). Required documentation for any given deliverable:

- **Storybook `.stories` files** — interactive examples for all exported components and composables, mirroring the React adapter's story coverage where applicable and adapted for framework-specific patterns.
- **MDX concept docs** — prose documentation for new features, APIs, and patterns. Framework docs should mirror the React MDX docs in structure and depth, noting where the framework differs.
- **Package README** — each new package ships a README covering installation, basic usage, and an API summary.
- **MCP resources + tools updated** — any new or changed API surface that affects the MCP server's `bc://` resources or active tools must be updated in the same phase. The MCP server must reflect the current state of the library at all times.

**Why:** As the library expands to additional framework adapters, consistent documentation is essential for developer adoption. Deferring docs creates technical debt that rarely gets paid. The MCP server is a primary developer touchpoint — stale resources undermine its usefulness.

**What was rejected:**
- Documentation as a follow-on phase — risks docs being skipped when priorities shift.
- "Document where convenient" — too vague to enforce; documentation is a first-class deliverable, not a nice-to-have.
