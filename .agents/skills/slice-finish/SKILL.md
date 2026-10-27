---
name: slice-finish
description: Finish a Big Calendar slice and open its PR for maintainer review. Use when every task in the slice's spec is done.
---

# Slice finish

1. Run `docs/checklists/slice-gates.md` in full. Every item needs evidence.
2. Run the reviews on the whole slice diff (`git diff main...HEAD`): spec review, accessibility review, test review, docs review. In Claude Code you can hand each to its sub-agent; review their findings, and fix or answer every fail.
3. Run `bench` and include the results table.
4. Confirm every maintainer answer during the slice is in `docs/decisions.md`.
5. Update `memory/PROGRESS.md`: the slice is in review, and the Next step is "wait for the maintainer's review of S<N>".
6. Commit and push. Open the PR against `main` with `gh pr create`. The description lists:
   - scope;
   - exit-criteria evidence (tests, benchmark table, story links);
   - decisions added (D-numbers);
   - known limitations;
   - what the maintainer must run by hand (the screen-reader script, real-device check);
   - the next slice's prerequisites.
7. Stop. The maintainer merges. Don't start the next slice.
