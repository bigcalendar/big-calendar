# Slice gates

Run before opening a slice PR. Source: [slice roadmap](../spec/roadmap.md#slice-roadmap) standard gates, plus the slice's own exit criteria in the same table.

## Standard gates (every slice)

- [ ] Typecheck, lint and boundary rules pass.
- [ ] Coverage thresholds and test layers met (D-42).
- [ ] Binding at or under budget.
- [ ] axe with zero violations, plus a manual screen-reader check against P3 ([script](screen-reader-script.md)).
- [ ] Performance benchmarks within budget.
- [ ] Docs written alongside the code: TSDoc lint passes, docs-site pages and stories cover every new capability, and the slice's tutorial steps work.
- [ ] MCP resources synced (from S10 onward).
- [ ] Memory checkpoints updated (`memory/PROGRESS.md`, `memory/ERRORS.md`).

## Slice exit criteria

- [ ] Every exit criterion for this slice in the roadmap table is met, each with evidence (a test name, a benchmark result, a story link).

## Process

- [ ] Every maintainer answer during the slice is in `docs/decisions.md`.
- [ ] [Spec review](spec-review.md), [accessibility review](a11y-review.md), [test review](test-review.md) and [docs review](docs-review.md) have been run on the whole slice diff, with no open fails.
- [ ] One real-device check (a mid-range Android phone and an iPhone) is done or scheduled for the maintainer (D-44).
- [ ] The PR description lists: scope, exit-criteria evidence, decisions added, known limitations, and the next slice's prerequisites.
