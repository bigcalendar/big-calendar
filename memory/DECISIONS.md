# DECISIONS

> Dated decision log. Mirrors the plan's §2 "Locked Decisions" and §15, plus any new
> decisions made during implementation. Newest at the bottom.

## 2026-06-01 — Phase 0 foundations

- **Manual Nx scaffold** (not `create-nx-workspace`): the repo already had git history +
  `LICENSE`; a manual package-based pnpm-workspace setup gives exact control over the §3 tree and
  avoids interactive generator prompts during autonomous work.
- **Package manager: pnpm** (locked, §2). Root is a pnpm workspace (`packages/*`, `apps/*`, `e2e`).
- **Nx Cloud OFF** (locked, §2): no `nxCloudAccessToken`, no cloud runner; local + CI cache only.
- **Nx Release**: `projectsRelationship: "fixed"` (one synced version), `version.conventionalCommits: true`,
  workspace changelog `createRelease: "github"`, project changelogs on. Tag pattern `v{version}`.
- **TS config**: ES2024 target, ESNext module, `moduleResolution: bundler`, strict + `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `isolatedModules`. ESM-only output (§13).
- **Module boundaries** enforced by scope tags (`scope:core|localizer|styles|dnd|ui|tooling`) encoding the
  §3 dependency direction (core→localizer; ui→core/styles/dnd/localizer; styles→nothing; dnd→core).
- **Conventional commits** mandatory via commitlint + Husky `commit-msg`; scope-enum warns (level 1) on
  the known package/scope list.
- **Versions**: latest stable at scaffold time per §13 (nx 22.7, TS 6.0, Vite 8, Vitest 4, ESLint 10,
  typescript-eslint 8.60, @preact/signals-core 1.14).

## Inherited from the plan (already locked — see Upgrade_plan_prompt.md §2/§15)

- Localizers: Temporal (default) + Luxon only; moment/dayjs/date-fns/globalize dropped.
- Public date type: strings only (strict RFC 3339/9557); no `Date` at the boundary.
- UI text: `messages` map in `core`, English defaults, overridable. No separate i18n package.
- Styling: all in `@big-calendar/styles`; framework packages ship no CSS.
- RTL: CSS `:dir()` + logical properties; no `rtl` prop. (`as`/polymorphic prop dropped entirely.)
- Signals: `@preact/signals-core` in `core`; framework bridges shipped inside each UI package.
- React first and alone in the base; Vue→Angular→Lit added one at a time afterward.
- Execution: autonomous on `feat/initial`, commit+push often, no PRs.
