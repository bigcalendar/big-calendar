# PROGRESS

> Read this first on every restart (Appendix B.4). Then continue from "Next".

## Current phase

**Phase 0 — Foundations** (in progress)

## How to resume

- **Branch:** `feat/initial` (all baseline work lands here; no PRs — user merges manually).
- **Install:** `pnpm install` at repo root.
- **Verify:** `pnpm exec nx report` · `pnpm exec nx run-many -t lint typecheck`.
- **Last command run:** scaffolding root config + package placeholders.
- **Next command:** finish Phase 0 verification, then start Phase 1 (localizer base + temporal).

## Done

- Repo init: `feat/initial` branched off `main` (only `LICENSE` + initial commit existed).
- Root workspace config: `package.json` (pnpm workspaces), `pnpm-workspace.yaml`, `.npmrc`,
  `nx.json` (Nx Cloud OFF, fixed-version Nx Release w/ conventional commits + GitHub releases),
  `tsconfig.base.json` (ES2024/ESNext/strict), `.gitignore`, `.editorconfig`, Prettier config.
- Lint/format/commit: `eslint.config.mjs` (flat, typescript-eslint + `@nx/enforce-module-boundaries`
  scope-tag graph + Appendix A naming rules), `commitlint.config.mjs`, Husky `commit-msg` + `pre-commit`.
- `vitest.workspace.ts` (globs package configs).

## In progress

- 4 CI/CD workflows (PR validation, CodeQL, release/publish, docs deploy).
- Empty package scaffolds: core, localizer, localizer-temporal, localizer-luxon, styles, dnd, react, codemods.
- `pnpm install` + toolchain verification (nx graph / lint / typecheck green).

## Next

1. Finish Phase 0 exit criteria: `nx affected` green; trivial package dry-run publish; CodeQL + PR
   workflows valid; this file seeded. Commit + push `feat/initial`.
2. **Phase 1** — `@big-calendar/localizer` base + `@big-calendar/localizer-temporal`;
   subgrid + Popover API + anchor-positioning + `:dir()` browser spike + fallback matrix.

## Notes / watch-items

- Toolchain pinned to latest stable at scaffold time: nx 22, TS 6, Vite 8, Vitest 4, ESLint 10,
  typescript-eslint 8.60. Watch for TS6/ESLint10 peer-range lag in plugins; log to ERRORS.md if >2 attempts.
- npm `@big-calendar` org + `NPM_TOKEN` and Pages secrets are the USER's setup step before the
  release/docs workflows can actually publish/deploy.
