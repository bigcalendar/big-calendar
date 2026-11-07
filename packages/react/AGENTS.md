# @big-calendar/react

The React binding: hooks that connect the kernel and the machines to React. About 600 lines, with no behavior. Layer: `layer:binding`.

## Boundaries

- May depend on: `@big-calendar/core`, `@big-calendar/interactions`, React.
- Must not: hold keyboard handling, focus logic, hit-testing, timers or state machines (lint-enforced; the ~600-line budget is checked in CI).

## Governing specs

- [api.md](../../docs/spec/api.md) (section 3)
- [architecture.md](../../docs/spec/architecture.md) (binding budget)
- [react-and-styling.md](../../docs/spec/react-and-styling.md)

## Commands

- `pnpm nx build react` · `pnpm nx typecheck react` · `pnpm nx lint react` · `pnpm nx test react`
