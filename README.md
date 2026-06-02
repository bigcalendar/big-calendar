# Big Calendar (`@big-calendar/*`)

A framework-agnostic calendar **engine** with thin, idiomatic UI packages per
framework. The engine owns all logic, state, and date math; UI packages own only
rendering and framework wiring. This is a ground-up, breaking rewrite of
`react-big-calendar`.

> **Status:** early development on `feat/initial`. Not yet published.

## Workspace layout

| Package                            | Scope             | Purpose                                                                |
| ---------------------------------- | ----------------- | ---------------------------------------------------------------------- |
| `@big-calendar/core`               | `scope:core`      | Framework-agnostic store (signals), view models, layout, selection FSM |
| `@big-calendar/localizer`          | `scope:localizer` | Base localizer contract (Intl-based, string-in/string-out)             |
| `@big-calendar/localizer-temporal` | `scope:localizer` | Temporal API localizer (recommended default)                           |
| `@big-calendar/localizer-luxon`    | `scope:localizer` | Luxon localizer                                                        |
| `@big-calendar/styles`             | `scope:styles`    | Baseline 2024 CSS, `--bc-*` tokens, `@layer`s                          |
| `@big-calendar/dnd`                | `scope:dnd`       | Optional drag/drop (Pragmatic Drag and Drop)                           |
| `@big-calendar/react`              | `scope:ui`        | React 18+ UI (reference implementation)                                |
| `@big-calendar/codemods`           | `scope:tooling`   | v1 → v2 migration codemods (jscodeshift)                               |

Vue / Angular / Lit packages come after the React base is complete.

## Toolchain

Nx (no Cloud) · pnpm workspace · TypeScript (ESNext → ES2024, ESM only) · Vite
(library mode) · Vitest · Playwright · ESLint + Prettier · Nx Release
(conventional commits, synced versions).

## Common commands

```bash
pnpm install                      # install workspace
pnpm exec nx run-many -t build    # build all packages
pnpm exec nx run-many -t test     # unit/component tests
pnpm exec nx run-many -t lint     # lint (incl. module-boundary rules)
pnpm exec nx run-many -t typecheck
pnpm exec nx affected -t lint test typecheck   # only what changed
```

Implementation roadmap and decisions live in [`memory/`](./memory).
