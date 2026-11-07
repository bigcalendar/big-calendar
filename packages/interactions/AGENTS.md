# @big-calendar/interactions

The interaction machines: keyboard, focus, selection, drag and drop and the prop-getters, written once for every framework. Layer: `layer:machines`.

## Boundaries

- May depend on: `@big-calendar/core`.
- Must not: import React or any binding; touch the DOM, timers or the kernel except through effects (api.md section 2.1).

## Governing specs

- [api.md](../../docs/spec/api.md) (section 2)
- [interaction-accessibility.md](../../docs/spec/interaction-accessibility.md)
- [accessibility.md](../../docs/spec/accessibility.md)
- [headless-api.md](../../docs/spec/headless-api.md)

## Commands

- `pnpm nx build interactions` · `pnpm nx typecheck interactions` · `pnpm nx lint interactions` · `pnpm nx test interactions`
