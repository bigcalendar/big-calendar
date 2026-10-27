# Specs

These topic specs are the normative description of Big Calendar. They were split verbatim from the approved P1 plan (`plan/P1-PLAN.md`, approved 2026-10-27), which stays frozen as the historical record. From now on, these files and the [decision log](../decisions.md) are the source of truth.

## How to read them

- **Locked** items are decided. Implementation follows them exactly.
- **Open** items ([open items register](roadmap.md#open-items-register)) are _known undecided_ questions, each assigned to a planning artifact. They are decided **before** any slice that depends on them begins, never during implementation.
- Anything an implementer meets that is neither locked here nor listed as open is a **new decision**: work stops and the question goes to the maintainer ([execution rules](../standards/workflow.md)).
- `D-NN` refers to an entry in the [decision log](../decisions.md). `T-NN` refers to a rule in [time semantics](time-semantics.md). `O-NN` refers to the [open items register](roadmap.md#open-items-register).
- "A plan change" means a new decision entry. **Changing any spec file needs one** (use the `decide` skill), and CI enforces that from S0.

## Index

| Spec                                                         | P1 source | Covers                                                                       |
| ------------------------------------------------------------ | --------- | ---------------------------------------------------------------------------- |
| [vision.md](vision.md)                                       | §1–§2     | Why we restarted, product vision                                             |
| [developer-experience.md](developer-experience.md)           | §2.1      | Option shape, explicit features, guardrails, docs structure                  |
| [architecture.md](architecture.md)                           | §4.1–§4.3 | Layers, package map, dependency direction, binding budget                    |
| [headless-api.md](headless-api.md)                           | §4.4      | Registered features, state slices, view models, pipelines, prop-getters      |
| [engine.md](engine.md)                                       | §5        | Axis, lanes, segmentation, packing, coordinates; the four families           |
| [data-model.md](data-model.md)                               | §6        | Canonical shapes, resources, background events, permission cascade           |
| [event-fields.md](event-fields.md)                           | §6.0      | The canonical event field table                                              |
| [edit-model.md](edit-model.md)                               | §6.1      | Input forms, event copy, `Change`, pending layer, callbacks, recurring edits |
| [time-semantics.md](time-semantics.md)                       | §7        | Values, rules T-1 to T-14, worked examples                                   |
| [date-engine.md](date-engine.md)                             | §8        | Temporal use, the `temporal` loader, performance budgets                     |
| [reactivity.md](reactivity.md)                               | §9        | Signals facade                                                               |
| [interaction-accessibility.md](interaction-accessibility.md) | §10       | Machines, pointer and keyboard model, typed drafts, MUI X patterns           |
| [react-and-styling.md](react-and-styling.md)                 | §11       | Slots, styling contract, CSS packaging, manifests, extra prebuilt UI         |
| [modules.md](modules.md)                                     | §12       | Recurrence, availability, ICS, normalize                                     |
| [migration.md](migration.md)                                 | §13       | RBC parity and codemods                                                      |
| [gap-additions.md](gap-additions.md)                         | §18       | Items added to 1.0 after the gap review; post-1.0 backlog                    |
| [roadmap.md](roadmap.md)                                     | §14–§16   | Planning artifacts P0–P5, slices S0–S11, open items register                 |

Outside `docs/spec/`:

- [standards/workflow.md](../standards/workflow.md) (§3): execution rules.
- [standards/agent-toolset.md](../standards/agent-toolset.md) (§17): how this agent context is organized.

Later planning artifacts (P2 support matrix, P3 accessibility spec, P4 benchmarks, P5 types and API) add their own files here when approved.
