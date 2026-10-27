---
name: bench
description: Run and interpret Big Calendar's performance benchmarks against the budgets. Use when a change touches ingest, the time engine, layout, packing, signals or rendering, and before every slice PR.
---

# Bench

Budgets: `docs/spec/date-engine.md`. Profile: D-44 in `docs/decisions.md`. The harness itself is built in S0 to the design agreed in P4; until then there's nothing to run.

1. Run the benchmark target for the affected packages (the command is in each package's `AGENTS.md` from S0).
2. Compare against the budgets:
   - 5,000 events loaded;
   - first render of month or week under 50ms of engine time on Chromium with 4× CPU slowdown (median of 10 after warm-up);
   - at most 100ms on unthrottled WebKit with the polyfill;
   - a single event change re-renders only the affected lanes;
   - agenda and timeline are virtualized.
3. Compare against `main`: a median more than 10% slower fails the PR.
4. Report the numbers in a table: benchmark, budget, `main`, this branch, change.
5. If a budget is missed, don't change the budget or the profile. Find the cause. If the fix needs anything the specs don't cover (for example the numeric fast path for instant ordering, which only P4's data can allow), use the `decide` skill.
