# @big-calendar/core

The kernel: canonical types, ingest, the time engine, view families, layout, the store and the signals facade. Pure TypeScript, no DOM code. Layer: `layer:kernel`.

## Boundaries

- May depend on: nothing in the workspace.
- Must not: import any workspace package, React or DOM APIs at runtime (DOM types appear only in API signatures, such as `KeyboardEvent` in `onEventKeyDown`).

## Governing specs

- [api.md](../../docs/spec/api.md) (section 1)
- [data-model.md](../../docs/spec/data-model.md)
- [event-fields.md](../../docs/spec/event-fields.md)
- [time-semantics.md](../../docs/spec/time-semantics.md)
- [date-engine.md](../../docs/spec/date-engine.md)
- [engine.md](../../docs/spec/engine.md)
- [reactivity.md](../../docs/spec/reactivity.md)
- [headless-api.md](../../docs/spec/headless-api.md)
- [edit-model.md](../../docs/spec/edit-model.md)

## Commands

- `pnpm nx build core` · `pnpm nx typecheck core` · `pnpm nx lint core` · `pnpm nx test core`
