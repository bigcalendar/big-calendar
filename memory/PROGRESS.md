# PROGRESS

> Read this first on every restart (Appendix B.4). Then continue from "Next".

## Current phase

**Phase 0 — Foundations** (in progress)

## How to resume

- **Branch:** `feat/initial` (all baseline work lands here; no PRs — user merges manually).
- **Install:** `pnpm install` at repo root.
- **Verify:** `pnpm exec nx run-many -t lint typecheck test build` (all green as of Phase 0 commit).
- **Last command run:** committed Phase 0 (`f6147ae`).
- **Next command:** retry `git push -u origin feat/initial` once auth is fixed, then start Phase 1.

> ⚠️ **PUSH BLOCKED (user action required):** `git push` returned **403 — permission denied to
> `cutterbl`** on `bigcalendar/big-calendar`. The account needs write access to the `bigcalendar`
> org/repo (or a credential/SSH-remote fix). The Phase 0 commit is safe locally; re-run the push
> after access is granted.

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
