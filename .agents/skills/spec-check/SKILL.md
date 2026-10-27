---
name: spec-check
description: Check a change against Big Calendar's specs and decisions before committing. Use before any commit that touches package code, and whenever unsure whether something is allowed.
---

# Spec check

Run `docs/checklists/spec-review.md` on the current change.

1. Get the change: staged diff, or `git diff main...HEAD` for a whole branch.
2. Follow the checklist's setup to find the governing specs. Read only those.
3. Go through every item. Mark pass, fail or not applicable.
4. For each fail, give the file and line, the spec section or decision it breaks, and a fix.
5. Anything that isn't covered by a spec is a fail and goes to the `decide` skill. Don't resolve it yourself.

In Claude Code, the `spec-reviewer` sub-agent runs the same checklist; use it for large diffs. Review its findings before acting on them.
