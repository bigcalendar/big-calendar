# @big-calendar/styles

`react-ui`'s CSS compiled with stable `.bc-*` selectors, per part, plus `tokens.css`, for headless users (D-69). Layer: `layer:styles`.

## Boundaries

- May depend on: nothing in the workspace.
- Must not: fork the CSS: it is compiled from `react-ui`'s CSS Module sources.

## Governing specs

- [react-and-styling.md](../../docs/spec/react-and-styling.md)
- [docs/standards/styling.md](../../docs/standards/styling.md)

## Commands

- `pnpm nx build styles` · `pnpm nx typecheck styles` · `pnpm nx lint styles` · `pnpm nx test styles`
