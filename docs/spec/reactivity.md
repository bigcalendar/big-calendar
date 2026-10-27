# Reactivity

> **Normative.** Split verbatim from the approved plan (`plan/P1-PLAN.md` §9, approved 2026-10-27). Changing anything here needs a new entry in the [decision log](../decisions.md).

- **The internal facade mirrors the TC39 Signals proposal** (`State`, `Computed`, `Watcher`).
- **It is backed by a production signals library** chosen by benchmark in **P4** (candidates: alien-signals, `@preact/signals-core`).
- **The TC39 polyfill itself is not used.** Its README says "Do not use this in production", and the proposal is still Stage 1 as of October 2026. The facade switches to native Signals once the proposal reaches Stage 3.
- **The public API exposes read-only signals** typed as _our_ facade types, never the backing library's types, and changes state through actions. Bindings also get `subscribe(selector, cb)` and `getSnapshot()`.
