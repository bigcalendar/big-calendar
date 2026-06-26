# PROGRESS

> Full history → PROGRESS-ARCHIVE.md.

## Roadmap

- [x] Phase 0 — Foundations (scaffold, Nx, tooling, CI/CD)
- [x] Phase 1 — Localizer + spikes (TemporalLocalizer, browser spike)
- [x] Phase 2 — Core engine (store, view models, layout algos, selection FSM)
- [x] Phase 3 — Styles (`@big-calendar/styles`, `--bc-*` tokens)
- [x] Phase 4 — React MVP (CalendarProvider, views, top-layer UI, a11y)
- [x] Phase 5 — DnD (`@big-calendar/dnd` + React: move/resize/outside/keyboard)
- [x] Phase 6 — LuxonLocalizer (dual-localizer parity, `timeZone` rename)
- [x] **Phase 7a — API surface refactor**
- [x] **Phase 7b — Polish (accessors unification + type story)**
- [x] **Phase 8 — Codemods**
- [x] **Phase 9 — MCP server (`@big-calendar/mcp`)**
- [ ] Phase 10+ — Additional frameworks (Vue → Angular → Lit, one at a time) ← CURRENT

---

## ⚠ NEXT TASK

**Phase 9 — COMPLETE.** Next: Phase 10 — Additional frameworks (Vue → Angular → Lit).

---

## Phase 9 — MCP server task list

| # | Task | Status |
|---|---|---|
| 9-1 | Package foundation — scaffold `packages/mcp`, `package.json` (bin entry), `tsconfig.json`, workspace wiring, basic stdio MCP server (connects, no tools) | [x] |
| 9-2 | Memory layer — `bc.md` Zod schema, `reader.ts` (find + parse frontmatter + prose), `writer.ts` (create/update), unit tests | [x] |
| 9-3 | `init` tool — detect missing `bc.md` on startup, conversational onboarding (field names with defaults, feature flags, app context), write `bc.md` on completion | [x] |
| 9-4 | Core tools — `scaffold-calendar`, `add-feature`, `add-handler`, `generate-sample-events`, `update-memory` | [x] |
| 9-5 | Resources — write all `api/` and `recipes/` `.md` docs; register each as a `bc://` URI MCP resource | [x] |
| 9-6 | Prompts — `bootstrap-calendar` (runs `init` then `scaffold-calendar`), `add-feature` | [x] |
| 9-7 | Client setup docs — Claude Code, Cursor, VS Code, JetBrains, stdio fallback; `bc.md.example` | [x] |
| 9-8 | Tests — unit tests for memory reader/writer, each tool (mock `bc.md` states), resource URI resolution | [x] |
| 9-9 | Release wiring — confirm version-lock with BC core in monorepo release process | [x] |
| 9-10 | Documentation — MDX files, README updates for `packages/mcp` and root | [x] |

---

## Phase 8 — Codemods task list (COMPLETE)

| # | Task | Status |
|---|---|---|
| 8-1 | `rename-imports` | [x] |
| 8-2 | `merge-accessors` | [x] |
| 8-3 | `rename-callbacks` | [x] |
| 8-4 | `rename-props` | [x] |
| 8-5 | `flag-removed-props` | [x] |
| 8-6 | `views-prop` | [x] |
| 8-7 | `wrap-provider` | [x] |
| 8-8 | CLI runner (`npx @big-calendar/codemods`) | [x] |
| 8-9 | Migration guide MDX | [x] |

---

## Reference

Test counts (entering Phase 9): localizer: 45 · core: 493 · dnd: 36 · react: 357 · codemods: 82 · **total: 1013**

Coverage bar: **per-file** 85% branch / 95% function (not a global average).

Architecture decisions: DECISIONS.md (Phase 9 MCP decisions) · DECISIONS-ARCHIVE.md (Phase 0–8).

## Quick resume

```bash
git checkout feat/initial
pnpm install
pnpm exec nx run-many -t lint typecheck test build
```
