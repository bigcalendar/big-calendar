# Spec review

Checks a change against the specs and decisions. Sources: [workflow](../standards/workflow.md) rules 1, 6 and 7.

## Setup

1. List the files changed (`git diff --name-only main...HEAD`, or the staged diff).
2. For each, find the governing specs: the package's `AGENTS.md`, then [`docs/spec/README.md`](../spec/README.md).
3. Read only those spec sections and the decisions they cite.

## Checks

- [ ] **No inline decisions.** Every behavior, name, default and option in the change traces to a spec, a decision or an approved slice spec. List anything that doesn't; that is a fail, even if it seems sensible.
- [ ] **Specs before code.** The behavior is specified in P3, P5 or the slice spec approved at kickoff (rule 7).
- [ ] **Layers.** Behavior sits in the right layer ([architecture](../spec/architecture.md)): no DOM in `core`; no keyboard, focus, hit-testing, timers or state machines in `react`; no behavior logic in `react-ui`.
- [ ] **Dependency direction** holds: modules and machines → core; binding → core + machines; react-ui → binding + styles.
- [ ] **Binding budget.** `@big-calendar/react` stays at or under about 600 lines of source.
- [ ] **Time semantics.** Any date or time handling follows T-1 to T-14 ([time semantics](../spec/time-semantics.md)). Calendar arithmetic uses Temporal; civil dates never become instants ([date engine](../spec/date-engine.md)).
- [ ] **Edit model.** Every edit goes through one typed `Change` and the pending layer ([edit model](../spec/edit-model.md)). The kernel never mutates consumer objects.
- [ ] **Data.** The kernel accepts canonical strings only; invalid events are skipped and reported, never thrown ([data model](../spec/data-model.md)).
- [ ] **Getter contract.** Prop-getters emit the `bc-*` class; features add to output through `mergeProps` only (D-72).
- [ ] **Public API** exposes our facade types, never the backing signals library's types ([reactivity](../spec/reactivity.md)).
- [ ] **Dependencies.** No new dependency unless a spec, decision or approved artifact names it.
- [ ] **Spec or decision files changed?** Then there is a matching new entry in [`docs/decisions.md`](../decisions.md), and no past entry was edited.
- [ ] **Docs and tests** landed in the same change (rule 8).
