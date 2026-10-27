---
name: resume
description: Pick up Big Calendar work where the last session stopped. Use at the start of any session, after a restart near a usage limit, or when unsure what to do next.
---

# Resume

1. Read the **Next step** section of `memory/PROGRESS.md`. It is the only context you need to start.
2. Skim `memory/ERRORS.md` for failed approaches in the area you're about to touch. Don't retry one without a new reason.
3. Check the branch and working tree: `git status`, `git log --oneline -5`. The branch should match PROGRESS. If it doesn't, or there are uncommitted changes PROGRESS doesn't explain, stop and ask the maintainer.
4. Read only the specs and standards the next step names (routing table in `AGENTS.md`). Don't read the whole of `docs/`.
5. If the next step is waiting on a maintainer gate (an artifact or slice review), say so and stop. Don't start the next artifact or slice.
6. Otherwise continue with the next step, in task-sized pieces. After each task, update PROGRESS's Next step and commit.

**Before stopping** (end of task, or near the usage limit): finish the current task, update `memory/PROGRESS.md` so the next session can start from its Next step alone, add any failed approach to `memory/ERRORS.md`, and commit.
