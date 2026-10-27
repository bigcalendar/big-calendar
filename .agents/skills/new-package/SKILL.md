---
name: new-package
description: Create a new package in the Big Calendar workspace. Use only for packages listed in the package map (docs/spec/architecture.md); anything else needs a decision first.
---

# New package

1. **Check it's in the package map** (`docs/spec/architecture.md`, D-60). If it isn't, stop and use the `decide` skill.
2. **Generate it with Nx** so it matches the S0 scaffold (the generator and options are recorded in `memory/PROGRESS.md` or the root `AGENTS.md` from S0). Name: `@big-calendar/<name>`, folder `packages/<name>`.
3. **Configure:**
   - strict TypeScript, ESM only, ES2025 output;
   - `"sideEffects": false` (except `*.css`, and the `temporal` loader);
   - MIT license;
   - Nx tags for its layer, so boundary rules apply (dependency direction in `docs/spec/architecture.md`);
   - coverage thresholds for its layer (`docs/standards/testing.md`);
   - a size budget for each entry point (D-63).
4. **Write `packages/<name>/AGENTS.md`** (keep it short):

   ```md
   # @big-calendar/<name>

   <One-line purpose and layer.>

   ## Boundaries

   - May depend on: <…>
   - Must not: <…>

   ## Governing specs

   - <docs/spec/… sections that apply>

   ## Commands

   - `pnpm nx test <name>` · `pnpm nx lint <name>` · `pnpm nx typecheck <name>` · <bench, if any>
   ```

5. **Write `packages/<name>/CLAUDE.md`** containing only `@AGENTS.md`.
6. Add the package to the routing table in the root `AGENTS.md` if it governs a new area.
7. Prove the boundary rule: a failing fixture that imports in the wrong direction must fail lint.
