# @big-calendar/temporal

Resolves native Temporal, or loads and installs the polyfill, and exports `temporalReady` (D-87). Layer: `layer:loader`.

## Boundaries

- May depend on: nothing in the workspace.
- Must not: use top-level `await` (D-87).

## Governing specs

- [date-engine.md](../../docs/spec/date-engine.md)
- [support-matrix.md](../../docs/spec/support-matrix.md)

## Commands

- `pnpm nx build temporal` · `pnpm nx typecheck temporal` · `pnpm nx lint temporal` · `pnpm nx test temporal`
