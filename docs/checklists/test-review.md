# Test review

Source: [testing standard](../standards/testing.md), D-42, D-79.

- [ ] Each new behavior has tests at the layers [testing.md](../standards/testing.md) assigns to it (unit; property tests for time engine, segmentation and packing; browser mode for machines, binding and components; Playwright for flows).
- [ ] Interaction tests run in Vitest browser mode, not jsdom.
- [ ] Time-dependent tests use the fake clock and an explicit display zone.
- [ ] DST cases are covered where time math is touched: a spring-forward gap and a fall-back overlap (T-10, T-14).
- [ ] Edit-pipeline changes cover veto, resolve, reject and supersede.
- [ ] Conformance corpora gain cases for any new rule they cover.
- [ ] Shared helpers come from `@big-calendar/testing`.
- [ ] Per-package coverage stays at or above its threshold.
- [ ] No test, assertion or threshold was weakened, skipped or deleted to make the build pass. If one was, the maintainer approved it first, and the PR says so.
- [ ] Tests assert behavior described in a spec, not implementation details.
