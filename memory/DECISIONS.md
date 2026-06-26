# DECISIONS — Active (Phase 10 onward)

> Phase 0–9 decisions archived to `DECISIONS-ARCHIVE.md` (with topic index).
> Add new entries here; archive when a phase is fully closed.

---

## Standing rule — Documentation and MCP sync (Phase 10+)

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
