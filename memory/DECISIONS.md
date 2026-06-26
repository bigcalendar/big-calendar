# DECISIONS — Active (Phase 9 onward)

> Phase 0–8 decisions archived to `DECISIONS-ARCHIVE.md` (with topic index).
> Add new entries here; archive when a phase is fully closed.

---

## Phase 9 — MCP server (`@big-calendar/mcp`)

### 2026-06-25 — MCP server design: installable dev dependency + `bc.md` memory file

**What was decided:** `@big-calendar/mcp` is a workspace package in the BC monorepo, installable as a dev dependency (`npm install --save-dev @big-calendar/mcp`), version-locked to BC core. It runs as a stdio MCP server and uses a `bc.md` file at the project root as persistent memory.

**Why:** Installable (vs. standalone `npx`) gives the server file-system access to read and write `bc.md` in the developer's project. `bc.md` uses YAML frontmatter (parsed by `gray-matter`) for structured config (accessor field names, features, views) plus a prose body for app context (modal library, data-fetching approach, implemented patterns). This mirrors the `CLAUDE.md` pattern developers already know.

**What was rejected:**
- Standalone `npx @big-calendar/mcp` — ephemeral, no project context, can't write files.
- `bc.config.ts` — a `.ts` config file adds parsing complexity and can't hold prose context naturally.
- `.json` / `.yaml` — structured-only, no prose, less flexible for capturing app-specific conventions.

---

### 2026-06-25 — MCP server scope: consumers, both tools and resources

**What was decided:** Server targets BC *consumers* (developers building scheduling apps, not BC contributors). It exposes both *resources* (static docs, API reference, recipes) and *tools* (active capabilities: onboarding wizard, scaffold component, add feature/handler, generate sample events, update memory).

**What was rejected:**
- Resources-only — too passive; doesn't help developers generate integration code.
- Contributor-focused tooling — a separate concern, lower priority.

---

### 2026-06-25 — No event generation; dummy events only for wiring

**What was decided:** The server does not generate real events. Events come from the developer's server. `generate-sample-events` produces dummy events shaped to the developer's accessor mapping, for wiring/testing before real data is connected.

**What was rejected:**
- General event generator — not useful; real events come from the app's REST layer.

---

### 2026-06-25 — Four MCP client targets + stdio fallback

**What was decided:** Ship explicit setup docs for Claude Code, Cursor, VS Code, and JetBrains (matching the Nx MCP pattern). Fallback for any other client: configure to run `npx @big-calendar/mcp` via stdio transport.

**Why:** These four cover the dominant AI-assisted dev environments. stdio is the universal adapter — any MCP-compatible client can connect without server changes.
