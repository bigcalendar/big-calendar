# @big-calendar/react-ui

The prebuilt UI: `<Calendar>` and its parts, with `render` and `wrap` slots. Markup and composition only. Layer: `layer:ui`.

## Boundaries

- May depend on: `@big-calendar/react`, `@big-calendar/styles`, React (core and machine types come re-exported through the binding, D-98).
- Must not: hold behavior logic or state, or render HTML fields (lint-enforced).

## Governing specs

- [api.md](../../docs/spec/api.md) (section 3)
- [react-and-styling.md](../../docs/spec/react-and-styling.md)
- [accessibility.md](../../docs/spec/accessibility.md)

## Commands

- `pnpm nx build react-ui` · `pnpm nx typecheck react-ui` · `pnpm nx lint react-ui` · `pnpm nx test react-ui`
