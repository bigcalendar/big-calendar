# O-6: hand-written state machine vs XState

The move machine (spec section 6.4: start from the menu, keyboard steps, refused and accepted drops, pointer drop, cancel) was built twice, behind one interface: `transition(state, event, ctx) → { state, effects }`. One effects runtime (`js/app.js`) performs the effects for both (announce, render, commit, focus). Both share the draft-stepping function `step()`, so the comparison is about the pattern, not the move rules.

- (a) `js/machines/move-fsm.js`: a plain `switch` on the state, pure.
- (b) `js/machines/move-xstate.js`: XState 5.33.3 `setup().createMachine()`, run through XState's pure `transition()`.

## Results (2026-10-28)

|                                                                 | (a) Hand-written                                                                          | (b) XState                                                                                                                                                                                                                                                     |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Same behavior                                                   | Reference                                                                                 | **Identical**: same states and effects for a 15-event script (`parity.test.mjs`), and the same focus and announcements in the browser (`../tests/o6-browser.mjs`, `?machine=xstate`)                                                                           |
| Machine code (non-blank, non-comment lines, Prettier-formatted) | 81                                                                                        | 154                                                                                                                                                                                                                                                            |
| Bundle cost, minified + gzip, including the shared `step()`     | 0.9 KB                                                                                    | 13.9 KB (**XState adds 13.0 KB**)                                                                                                                                                                                                                              |
| Unit-testable without a DOM                                     | Yes: call `transition()`                                                                  | Yes: call XState's `transition()`; the snapshot must be carried between calls                                                                                                                                                                                  |
| Timers (long-press, tooltip delay)                              | The runtime schedules and cancels a `timer` effect                                        | Pure `transition()` returns `xstate.raise` with `delay: 500` and later `xstate.cancel`, so **the runtime still schedules and cancels them**. XState handles timers itself only as a live actor, which is no longer pure and needs its simulated clock in tests |
| A registered feature adding states or transitions (D-52, D-72)  | Needs our own convention (for example per-state transition tables merged at registration) | Also needs our own convention: XState has no built-in way to merge machine configs; features would contribute config objects merged before `createMachine`                                                                                                     |
| Context and dependencies                                        | Passed as an argument                                                                     | Passed inside each event (`event.ctx`) or stored in context; actions and guards read them from there                                                                                                                                                           |
| Types exposed to users                                          | Ours                                                                                      | XState's types would leak unless wrapped (the same rule as the signals facade, D-07)                                                                                                                                                                           |
| Strengths                                                       | Tiny, no dependency, one obvious way to read it                                           | Statechart features (nested and parallel states, history), visual tooling, well-known semantics and docs                                                                                                                                                       |

## Reading

- XState's real advantages are nested and parallel states and its tooling. The interaction machines found so far (roving grid, event group, move, menu, popover) are flat: two to four states each.
- In the pure mode that keeps machines testable and framework-free, XState still needs our effects runtime, timers included, so it doesn't remove the runtime from candidate (a).
- 13 KB gzip is a large share of any per-entry-point size budget (D-63), paid by every app that registers an interaction feature.

**Recommendation: (a)**, hand-written machines, with a written contract: pure `transition(state, event, ctx) → { state, effects }`, a closed list of effect types (announce, render, commit, focus, timer start/cancel, DOM read), and features adding transitions through a registration table. P5 records the exact contract.

## Run it

```sh
npm install
node --import ./resolve-xstate.mjs --test parity.test.mjs
node measure.mjs
node timers.mjs
```
