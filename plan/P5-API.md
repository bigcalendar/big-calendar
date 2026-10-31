# Types and public API (P5)

> **Status: draft, part 1 in progress.** Not normative until the maintainer approves P5. On approval, the types and contracts move into the specs they complete, with a decision.

Exit criteria: [roadmap](../docs/spec/roadmap.md#planning-phase), row P5.

P5 turns the locked specs into exact TypeScript types and names. The types are real files in [`prototypes/p5-types/`](../prototypes/p5-types/), checked with `tsc`: usage files that must compile, and usage files that must fail with the right error. This draft explains them and lists what needs the maintainer's answer. Anything marked **Proposed** is a choice no spec or decision makes yet.

It is reviewed in four parts. Each part's questions are answered before the next part starts.

| Part | Covers                                                                                                                                   |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Data types, `createCalendar` options, registered features, state slices, store, actions and signals, permission cascade, `temporalReady` |
| 2    | Machine contract, prop-getter descriptors and `mergeProps`, effects, drafts, changes, callback names and payloads, live constraints      |
| 3    | React binding, `react-ui` slots, part manifests, `formats` and `messages`                                                                |
| 4    | The RBC 1.20.0 parity matrix and the slot mapping table                                                                                  |
