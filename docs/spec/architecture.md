# Architecture

> **Normative.** Split verbatim from the approved plan (`plan/P1-PLAN.md` §4.1–§4.3, approved 2026-10-27). Changing anything here needs a new entry in the [decision log](../decisions.md).

## Layers

```
┌──────────────────────────────────────────────────────────────┐
│ Prebuilt UI          @big-calendar/react-ui (+ styles)       │  markup + composition only
├──────────────────────────────────────────────────────────────┤
│ Framework binding    @big-calendar/react                     │  glue only (≤ ~600 LOC)
├──────────────────────────────────────────────────────────────┤
│ Interaction machines (framework-free, DOM-aware)             │  keyboard, selection, DnD,
│                      emit prop-getters / handler descriptors │  click/dblclick, long-press
├──────────────────────────────────────────────────────────────┤
│ Kernel (pure)        time engine · ingest · families ·       │  no DOM, no framework
│                      store (signals facade) · layout         │
└──────────────────────────────────────────────────────────────┘
   Opt-in modules: recurrence · availability · ics · normalize · temporal helper
```

- **Kernel.** Pure TypeScript with no DOM. It owns canonical types, ingestion and validation, the time engine, view families and projections, layout (packing), the store, and the signals facade.
- **Interaction machines.** Framework-free and DOM-aware. They return _prop-getters_: plain objects of attributes, ARIA and handler functions that a binding spreads onto elements. All keyboard, selection, drag-and-drop, focus and pointer behavior lives here, written **once**.
- **Binding.** Bridges signals to the framework's reactivity and normalizes prop and event naming. It contains **no behavior**.
- **Prebuilt UI.** Components that render markup and compose the binding's hooks. It contains **no behavior logic**, enforced by lint.

## Package map

_Final (D-60). The maintainer owns the `@big-calendar` npm scope._

| Package                      | Layer       | Notes                                                                                                                                   |
| ---------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `@big-calendar/core`         | Kernel      | Types, time engine, families, store, signals facade                                                                                     |
| `@big-calendar/interactions` | Machines    | Separate package (D-32)                                                                                                                 |
| `@big-calendar/react`        | Binding     | Peer dependency on `react@>=19`; ≤ ~600 LOC                                                                                             |
| `@big-calendar/react-ui`     | Prebuilt UI | Default components with `render`/`wrap` slots                                                                                           |
| `@big-calendar/styles`       | Styles      | `react-ui`'s CSS Module sources compiled with stable `.bc-*` selectors, published per part with `tokens.css`, for headless users (D-69) |
| `@big-calendar/temporal`     | Loader      | Resolves native Temporal, or loads and globally installs the polyfill; exports `temporalReady` (D-87, [date engine](date-engine.md))    |
| `@big-calendar/recurrence`   | Module      | Full RFC 5545 RRULE expansion                                                                                                           |
| `@big-calendar/availability` | Module      | Working hours, capacity, conflicts                                                                                                      |
| `@big-calendar/ics`          | Module      | ICS import/export                                                                                                                       |
| `@big-calendar/normalize`    | Module      | Converts non-canonical inputs into canonical form                                                                                       |
| `@big-calendar/editing`      | Module      | Keyboard delete, copy/paste, undo/redo, headless dialog state ([edit model](edit-model.md))                                             |
| `@big-calendar/codemods`     | Migration   | RBC → Big Calendar                                                                                                                      |
| `@big-calendar/testing`      | Testing     | Fake clock, interaction helpers, role-based queries; Testing Library compatible (D-79)                                                  |
| `@big-calendar/mcp`          | Tooling     | MCP server for AI assistants                                                                                                            |

**Dependency direction** (never inverted): modules and machines → core; binding → core + machines; react-ui → binding + styles. The kernel depends on nothing in the workspace. Nx module-boundary lint rules enforce this.

## The binding budget (hard rule)

- `@big-calendar/react` is held to about **600 lines** of source (excluding types and tests), measured in CI.
- The binding may: subscribe to signals, map them into React state, apply the machines' prop-getters, normalize event names, and provide context.
- The binding may **not** contain keyboard handling, focus logic, hit-testing, timers or state machines.
- Any future framework binding (Vue, Svelte, Angular, Lit and so on, all after 1.0) is held to the same budget.
