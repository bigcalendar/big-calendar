# Big Calendar — agent guide

Big Calendar is a headless-first toolkit for calendaring and scheduling apps, and the successor to react-big-calendar (RBC). A framework-free kernel and interaction machines do all the work; a thin React binding and an optional prebuilt UI sit on top. Vision: [docs/spec/vision.md](docs/spec/vision.md).

## Start here

1. **Read the "Next step" section of [`memory/PROGRESS.md`](memory/PROGRESS.md) first.** It's the only context you need to begin.
2. Check [`memory/ERRORS.md`](memory/ERRORS.md) before retrying anything in the same area.
3. Read only the specs and standards your task needs, using the table below. Don't load all of `docs/`.

## Hard rules

1. **No inline decisions.** If a spec or decision doesn't cover a choice, stop and ask the maintainer, then record the answer in [`docs/decisions.md`](docs/decisions.md) (skill: `decide`).
2. **Gates.** Every planning artifact (P0–P5) and slice (S0–S11) ends with maintainer approval. Never start the next one yourself.
3. **Ask first** before adding a dependency no spec names; weakening, skipping or deleting a test or threshold; force-pushing, rebasing pushed commits or deleting branches; or anything outside the repo.
4. **Specs before code.** Implement only behavior specified in P3, P5 or an approved slice spec.
5. **Layers.** Behavior lives in the kernel and interaction machines. `@big-calendar/react` stays at about 600 lines with no keyboard, focus, hit-testing, timers or state machines; `react-ui` has no behavior logic.
6. **Docs ship with the code.** Code, tests and docs land in the same commit.
7. **Spec changes need a decision.** Any change to `docs/spec/` comes with a new entry in `docs/decisions.md`. Past entries are never edited. `plan/P1-PLAN.md` is frozen.
8. **Conventional commits.** Nothing is published to npm before 1.0, and the maintainer alone decides when 1.0 ships.

Full rules: [docs/standards/workflow.md](docs/standards/workflow.md).

## Routing

| When you are…                               | Read                                                                                                                                     |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| starting or resuming a session              | `memory/PROGRESS.md` → skill `resume`                                                                                                    |
| meeting a question nothing answers          | skill `decide`, [docs/decisions.md](docs/decisions.md)                                                                                   |
| looking for any spec                        | [docs/spec/README.md](docs/spec/README.md) (index)                                                                                       |
| planning or sequencing work                 | [docs/spec/roadmap.md](docs/spec/roadmap.md) (artifacts, slices, open items)                                                             |
| working on layers, packages or dependencies | [architecture](docs/spec/architecture.md), [headless API](docs/spec/headless-api.md)                                                     |
| touching dates, times or zones              | [time semantics](docs/spec/time-semantics.md), [date engine](docs/spec/date-engine.md)                                                   |
| touching events, resources or edits         | [data model](docs/spec/data-model.md), [event fields](docs/spec/event-fields.md), [edit model](docs/spec/edit-model.md)                  |
| touching layout or views                    | [engine](docs/spec/engine.md), [reactivity](docs/spec/reactivity.md)                                                                     |
| touching keyboard, pointer, focus or ARIA   | [accessibility](docs/spec/accessibility.md), [interaction and accessibility](docs/spec/interaction-accessibility.md), skill `a11y-check` |
| writing React or CSS                        | [React and styling](docs/spec/react-and-styling.md), [react.md](docs/standards/react.md), [styling.md](docs/standards/styling.md)        |
| working on a module or migration            | [modules](docs/spec/modules.md), [migration](docs/spec/migration.md), [gap additions](docs/spec/gap-additions.md)                        |
| writing any code                            | [docs/standards/code.md](docs/standards/code.md), skill `spec-check`                                                                     |
| writing tests or benchmarks                 | [testing.md](docs/standards/testing.md), skill `bench`                                                                                   |
| writing docs, TSDoc or stories              | [documentation.md](docs/standards/documentation.md), [writing.md](docs/standards/writing.md)                                             |
| starting or finishing a slice               | skills `slice-start`, `slice-finish`; [slice gates](docs/checklists/slice-gates.md)                                                      |
| adding a package                            | skill `new-package`                                                                                                                      |
| changing this agent setup                   | [agent-toolset.md](docs/standards/agent-toolset.md)                                                                                      |

Each package will have its own `AGENTS.md` (purpose, boundaries, commands, governing specs). Skills live in [`.agents/skills/`](.agents/skills); checklists any agent can run live in [`docs/checklists/`](docs/checklists/README.md).

## Current state

Planning phase on the `planning` branch. `packages/`, `storybook-site/` and the root build configs are **attempt-1 code**: archived and replaced in S0. Don't read them for guidance or build on them.
